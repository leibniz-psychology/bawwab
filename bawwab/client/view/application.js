import { translations, i18nMixin } from '../i18n.js';
import { store, config } from '../app.js';
import { ConductorState } from '../conductor.js';
import { BorgErrorNonexistent } from '../borg.js';
import WorkspaceVersionComponent from '../component/workspaceVersion.js';

export default {
	name: 'ApplicationView',
	props: ['wsid', 'appid', 'nextUrl'],
	template: `<aside class="appoverlay">
		   <header>
				<nav class="pure-g">
				   <div class="pure-u-1-5 back">
						   <router-link :to="{name: 'workspaces'}">{{ t('projects') }}</router-link>
				   </div>
				   <div class="pure-u-3-5 title">
						<ul>
							<li v-if="program && program.error !== null"><action-button :f="reset" icon="redo">{{ t('reset') }}</action-button></li>
							<li v-if="program && program.state != ConductorState.exited"><action-button :f="terminate" icon="stop">{{ t('stop') }}</action-button></li>
							<li v-if="workspace"><router-link :to="{name: 'workspace', params: {wsid: workspace.metadata._id}}"><application-icon :workspace="workspace" :application="application"></application-icon> {{ workspace.metadata.name }}</router-link></li>
							<li><dropdown class="history">
								<template v-slot:button>
									<action-button :f="createManualVersion" icon="history" importance="low">{{ t('createVersion') }}</action-button>
									<i class="fas fa-caret-down"></i>
								</template>
								<template v-slot:default>
									<workspace-version :wsid="wsid"></workspace-version>
								</template>
							</dropdown></li>
						</ul>
				   </div>
				   <div class="pure-u-1-5 logo">
						   <router-link :to="{name: 'index'}"><img src="https://www.lifp.de/assets/images/psychnotebook.svg" style="height: 1.5em; filter: invert(100%) opacity(50%);"></router-link>
				   </div>
				</nav>
				<message v-if="needRestart" kind="warning">{{ t('needrestart') }}</message>
		   </header>
		<p v-if="!workspace">{{ t('nonexistentws') }}</p>
		<p v-else-if="!application">{{ t('nonexistent') }}</p>
		<iframe v-else-if="url" frameborder="0" name="appframe" :src="url"></iframe>
		<div v-else-if="program" class="loading">
			<details>
				<summary>
				<span v-if="program.process?.exitStatus == 4">{{ t('busy') }}</span>
				<span v-else-if="program.error !== null">{{ t('failed', {reason: program.error}) }}.</span>
				<span v-else-if="program.state == ConductorState.starting">{{ t('starting') }}<br><spinner :big="true"></spinner></span>
				<span v-else-if="program.state == ConductorState.exited">{{ t('exited') }}</span>
				</summary>
				<pre class="log" v-if="program && program.output">{{ program.output }}</pre>
			</details>
		</div>
	</aside>`,
	data: _ => ({
		state: store.state,
		ConductorState: ConductorState,
		autosaveTimer: null,
		strings: translations({
			de: {
				'nonexistent': 'Anwendung existiert nicht.',
				'nonexistentws': 'Projekt existiert nicht.',
				'starting': 'Anwendung wird gestartet…',
				'exited': 'Anwendung wurde beendet.',
				'failed': 'Anwendung konnte nicht ausgeführt werden. (%{reason})',
				'projects': 'Projekte',
				'reset': 'Neustarten',
				'stop': 'Beenden',
				'needrestart': 'Die Änderungen am Projekt werden für diese Anwendung erst sichbar, wenn sie neugestartet wird.',
				'busy': 'Das Projekt wird zurzeit aktualisiert. Die Anwendung kann erst danach gestartet werden.',
				'createVersion': 'Sicherung erstellen',
				},
			en: {
				'nonexistent': 'Application does not exist.',
				'nonexistentws': 'Project does not exist.',
				'starting': 'Starting application…',
				'exited': 'Application finished.',
				'failed': 'Application failed to run. (%{reason})',
				'projects': 'Projects',
				'reset': 'Restart',
				'stop': 'Stop',
				'needrestart': 'Changes made to the project apply to this application only after a restart.',
				'busy': 'The project is being updated currently. This application can only be started afterwards.',
				'createVersion': 'Create new version',
				},
		}),
	}),
	mixins: [i18nMixin],
	components: {
		'workspace-version': WorkspaceVersionComponent,
	},
	created: async function () {
		/* Save immediately before user can do anything */
		await this.createVersion ();
	},
	unmounted: function() {
		if (this.autosaveTimer) {
			clearTimeout (this.autosaveTimer);
		}
	},
	methods: {
		reset: function () {
			this.state.workspaces.resetRunningApplication (this.workspace, this.application);
		},
		terminate: async function () {
			await this.program.terminate ();
		},
		createManualVersion: async function () {
			await this.createVersion('manual-{now:%Y-%m-%dT%H:%M:%S}');
		},
		createVersion: async function (name=null) {
			/* first check when the last backup was created and then create a new
			/* one. Obviously there is a race condition here, but that should be fine.
			/* We can just prune away old backups. */
			let wait = config.autosaveInterval;
			try {
				let latest = null;
				try {
					const repo = await this.state.borg.list (this.workspace);
					const archives = Array.from (repo.archives.values ());
					archives.sort ((a, b) => a.date > b.date ? -1 : 1);
					latest = archives[0];
				} catch (e) {
					if (e instanceof BorgErrorNonexistent) {
						await this.state.borg.init (this.workspace);
					} else {
						throw e;
					}
				}

				const now = new Date ();
				if (latest) {
					console.log ('last backup was', latest.date, 'now', now, 'diff', now-latest.date);
					wait = config.autosaveInterval - (now - latest.date);
				} else {
					console.log ('no latest backup');
				}
				if (name || !latest || (now - latest.date) >= config.autosaveInterval) {
					if (!name) {
						name = 'auto-{now:%Y-%m-%dT%H:%M:%S}';
					}
					const snapshot = await this.state.borg.create (this.workspace, name);
					/* Prune old automatic backups (not the manual ones) */
					await this.state.borg.prune (this.workspace,
							config.autosaveKeep, 'auto-');

					/* Just made a new one */
					wait = config.autosaveInterval;
				}
			} finally {
				/* Add jitter of up to 5 seconds. Obviously this is not a proper
				 * synchronization mechanism, but it works well in practise. */
				const jitter = Math.floor (Math.random ()*5000);
				this.autosaveTimer = setTimeout (
						function () { this.createVersion().then (() => {}) }.bind (this),
						Math.max (0, wait)+jitter);
			}
		},
	},
	computed: {
		/* argument is a string */
		workspace: function() {
			if (this.state.workspaces) {
				return this.state.workspaces.getById (this.wsid);
			}
		},
		application: function () {
			if (!this.state.workspaces) {
				return null;
			}
			const workspace = this.state.workspaces.getById (this.wsid);
			if (!workspace) {
				return null;
			}
			return workspace.applications.filter(elem => elem._id == this.appid)[0];
		},
		url: function () {
			console.debug ('program is %o', this.program);
			if (!this.program || !this.program.url ()) {
				return null;
			}
			const u = new URL (this.program.url ());
			if (this.nextUrl) {
				u.searchParams.append ('next', this.nextUrl);
			}
			return u.toString ();
		},
		program: function () {
			const workspace = this.workspace;
			const application = this.application;
			console.debug ('application changed to %o', application);
			const p = this.state.workspaces.getRunningApplication (workspace, application);
			if (p) {
				return p.conductor;
			}
			console.debug ('starting new instance of', workspace, application);
			this.state.workspaces.start (workspace, application);
			return null;
		},
		/* wheck whether the application’s exec has changed */
		needRestart: function () {
			const p = this.state.workspaces.getRunningApplication (this.workspace, this.application);
			if (!p) {
				/* we don’t know, but probably not */
				return false;
			}
			return p.profilePath != this.workspace.profilePath;
		},
	},
	watch: {
		'program.state': async function () {
			/* go back to workspace if program exited */
			if (this.program && this.program.state == ConductorState.exited && this.program.error === null) {
				console.debug ('program is gone, going back to workspace %o', this.workspace);
				await this.$router.push ({name: 'workspace', params: {wsid: this.workspace.metadata._id}});
			}
		},
	},
};


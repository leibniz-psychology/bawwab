import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';
import { ConductorState } from '../conductor.js';

import '../component/spinner.js';
import '../component/application.js';

export default Vue.extend ({
	props: ['wsid', 'appid', 'nextUrl'],
	template: `<aside class="appoverlay">
		   <header>
				<nav class="pure-g">
				   <div class="pure-u-1-5 back">
						   <router-link :to="{name: 'workspaces'}">{{ t('projects') }}</router-link>
				   </div>
				   <div class="pure-u-3-5 title">
						<action-button v-if="program && program.error !== null" :f="reset" icon="redo">{{ t('reset') }}</action-button>
						<action-button v-if="program && program.state != ConductorState.exited" :f="terminate" icon="stop">{{ t('stop') }}</action-button>
					   <router-link v-if="workspace" :to="{name: 'workspace', params: {wsid: workspace.metadata._id}}"><application-icon :workspace="workspace" :application="application"></application-icon> {{ workspace.metadata.name }}</router-link>
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
				<span v-if="program.error !== null">{{ t('failed', {reason: program.error}) }}.</span>
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
				},
		}),
	}),
	mixins: [i18nMixin],
	methods: {
		reset: function () {
			this.state.workspaces.resetRunningApplication (this.workspace, this.application);
		},
		terminate: async function () {
			await this.program.terminate ();
		}
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
		}
	},
	watch: {
		'program.state': function () {
			/* go back to workspace if program exited */
			if (this.program && this.program.state == ConductorState.exited && this.program.error === null) {
				console.debug ('program is gone, going back to workspace %o', this.workspace);
				this.$router.push ({name: 'workspace', params: {wsid: this.workspace.metadata._id}});
			}
		},
	},
});


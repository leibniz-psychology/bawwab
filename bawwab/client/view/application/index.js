import { store } from '../../app.js';
import { autosaveInterval, autosaveKeep } from '../../config';
import { ConductorState } from '../../conductor.js';
import { BorgErrorNonexistent } from '../../borg.js';
import WorkspaceVersionComponent from '../../component/workspaceVersion';
import template from './template.html';

export default {
	name: 'ApplicationView',
	props: ['wsid', 'appid', 'nextUrl'],
	template: template,
	data: _ => ({
		state: store.state,
		ConductorState: ConductorState,
		autosaveTimer: null,
	}),
	components: {
		'workspace-version': WorkspaceVersionComponent,
	},
	created: async function () {
		/* Save immediately before user can do anything */
		await this.createVersion ();
		if (!this.program) {
			await this.state.workspaces.start (this.workspace, this.application);
		}
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
			let wait = autosaveInterval;
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
					wait = autosaveInterval - (now - latest.date);
				} else {
					console.log ('no latest backup');
				}
				if (name || !latest || (now - latest.date) >= autosaveInterval) {
					if (!name) {
						name = 'auto-{now:%Y-%m-%dT%H:%M:%S}';
					}
					const snapshot = await this.state.borg.create (this.workspace, name);
					/* Prune old automatic backups (not the manual ones) */
					await this.state.borg.prune (this.workspace,
							autosaveKeep, 'auto-');

					/* Just made a new one */
					wait = autosaveInterval;
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
			return p?.conductor;
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


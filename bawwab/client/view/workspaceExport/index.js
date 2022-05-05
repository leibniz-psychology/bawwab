import { store } from '../../app.js';
import template from './template.html';
import "./style.css";

export default {
	name: 'WorkspaceExportView',
	props: ['wsid'],
	template: template,
	data: _ => ({
		state: store.state,
		kind: 'zip',
		path: {},
		supportedFormats: ['zip', 'tar+lzip'],
	}),
	computed: {
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
	},
	methods: {
        run: async function() {
			const kind = this.kind;
			if (!this.path[kind]) {
				const data = await this.workspaces.export (this.kind, this.workspace);
				this.path[kind] = data.path;
			}
			const url = new URL (`/api/filesystem${this.path[kind]}`, window.location.href);
			window.location.assign (url.toString ());
        },
	},
	/* Delete the export file created when leaving the page */
	beforeUnmount: async function () {
		console.debug ('destroying %s', this.path);
		for (let k in this.path) {
			let r = await fetch (`/api/filesystem${this.path[k]}`, {
				'method': 'DELETE'
			});
			if (r.ok) {
				/* this is fine */
			} else {
				console.error ('cannot destroy export %o', r);
			}
		}
	}
};


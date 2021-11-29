import { store } from '../../app.js';
import { privateData } from '../../config';
import template from './template.html';

export default {
	name: 'WorkspaceImportView',
	props: [],
	template: template,
	data: _ => ({
		state: store.state,
		path: [],
		busy: false,
		selectedFile: null,
	}),
	methods: {
		/* cannot make this reactive (i.e. computed method) for some reason */
		validate: function (e) {
			this.selectedFile = e.target.files[0];
		},
        run: async function() {
			this.busy = true;

			const f = this.selectedFile;
			/* XXX do not hardcode homedir */
			const path = `${privateData}/${this.state.user.name}/.cache/${f.name}`;
			const url = new URL (`/api/filesystem${path}`, window.location.href);
			const r = await fetch (url.toString (), {method: 'PUT', body: f});
			const j = await r.json();
			if (r.ok) {
				this.path.push (path);
				const ws = await this.state.workspaces.import (path);
				this.busy = false;
				await this.$router.push ({name: 'workspace', params: {wsid: ws.metadata._id}});
			} else {
				this.busy = false;
				throw Error (j.status);
			}
		},
	},
	/* Delete temporary files created when leaving the page */
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

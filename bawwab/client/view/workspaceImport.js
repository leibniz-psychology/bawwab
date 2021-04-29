import { translations, i18nMixin } from '../i18n.js';
import { store, config } from '../app.js';

export default {
	name: 'WorkspaceImportView',
	props: [],
	template: `<modal icon="users" :title="t('headline')" :closeName="t('close')" :closeLink="{name: 'workspaces'}" :scaling="true">
			<p>{{ t('description') }}</p>
			<p>
				<label for="importFiles">{{ t('fromfile') }}:</label>
				<input type="file" id="importFiles" @change="validate" :disabled="busy"><br>
			</p>
			<template v-slot:buttons>
				<action-button icon="file-import" :f="run" importance="high" :disabled="!valid" class="submit">{{ t('submit') }}</action-button>
			</template>
</modal>`,
	data: _ => ({
		state: store.state,
		path: [],
		valid: false,
		busy: false,
		strings: translations({
			de: {
				'close': 'Abbrechen',
				'headline': 'Projekt importieren',
				'fromfile': 'Aus Datei importieren',
				'description': 'Hier können Projekte, die zuvor aus dem Notebook exportiert wurden, wieder importiert werden. Der Import kann einige Minuten in Anspruch nehmen.',
				'submit': 'Importieren',
				},
			en: {
				'close': 'Cancel',
				'headline': 'Import project',
				'fromfile': 'Import from file',
				'description': 'Here you can import projects that were previously exported from the notebook. The process may take a few minutes.',
				'submit': 'Import',
				},
			}),
	}),
	mixins: [i18nMixin],
	methods: {
		/* cannot make this reactive (i.e. computed method) for some reason */
		validate: function () {
			const filePicker = document.getElementById ('importFiles');
			this.valid = filePicker.length != 1 && this.state.workspaces;
		},
        run: async function() {
			this.busy = true;

			const filePicker = document.getElementById ('importFiles');
			const f = filePicker.files[0];
			/* XXX do not hardcode homedir */
			const path = `${config.privateData}/${this.state.user.name}/.cache/${f.name}`;
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

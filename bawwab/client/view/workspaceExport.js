import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

export default {
	name: 'WorkspaceExportView',
	props: ['wsid'],
	template: `<modal :title="t('headline')" :closeName="t('back')" :closeLink="{name: 'workspace', params: {wsid: workspace.metadata._id}}" :scaling="true" icon="file-export">
<div v-if="workspace">
<p>{{ t('description', {project: workspace.metadata.name}) }}</p>
<label for="kind">{{ t('exportas') }}</label>
<select v-model="kind" name="kind" id="kind" size="0">
<option v-for="format in supportedFormats" :key="format" :value="format">{{ t('kind-' + format) }}</option>
</select>
<p>{{ t('description-' + kind) }}</p>
</div>
<p v-else>{{ t('notfound') }}</p>
<template v-slot:buttons>
	<action-button :f="run" icon="file-export" importance="high">{{ path[kind] ? t('download') : t('submit') }}</action-button>
</template>
</modal>`,
	data: _ => ({
		state: store.state,
		kind: 'zip',
		path: {},
		supportedFormats: ['zip', 'tar+lzip'],
		strings: translations({
			de: {
				'headline': 'Projekt exportieren',
				'description': 'Hier kann das Projekt %{project} in unterschiedlichen Formaten exportiert werden.',
				'kind-zip': 'ZIP-Archiv',
				'description-zip': 'Enthält alle Dateien des Projekts.',
				'kind-tar+lzip': 'LZIP-komprimierter Tarball',
				'description-tar+lzip': 'Enthält alle Dateien des Projekts.',
				'exportas': 'Exportieren als',
				'submit': 'Exportieren',
				'download': 'Herunterladen',
				'notfound': 'Projekt existiert nicht.',
				'back': 'Abbrechen',
				},
			en: {
				'headline': 'Export project',
				'description': 'Here you can export the project %{project} in different formats.',
				'kind-zip': 'ZIP archive',
				'description-zip': 'Contains all files of the project.',
				'kind-tar+lzip': 'LZIP-compressed Tarball',
				'description-tar+lzip': 'Contains all files of the project.',
				'exportas': 'Export as',
				'submit': 'Export',
				'download': 'Download',
				'notfound': 'Project does not exist.',
				'back': 'Back',
				},
			}),
	}),
	mixins: [i18nMixin],
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


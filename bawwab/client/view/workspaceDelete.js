import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

export default {
	name: 'WorkspaceDeleteView',
	props: ['wsid'],
	template: `<modal :title="canDelete ? t('deletetitle') : t('hidetitle')" :closeName="t('cancel')" icon="trash" :closeLink="{name: 'workspace', params: {wsid: workspace.metadata._id}}" :scaling="true">
	<p>{{ canDelete ? t('deletequestion', { name: workspace.metadata.name }) : t('hidequestion', {name: workspace.metadata.name}) }}</p>
	<template v-slot:buttons>
		<action-button :f="deleteWorkspace" icon="trash" importance="high">{{ canDelete ? t('delete') : t('hide') }}</action-button>
	</template>
</modal>`,
	data: _ => ({
		state: store.state,
		strings: translations({
			de: {
				'deletetitle': 'Projekt löschen',
				'hidetitle': 'Projekt verbergen',
				'deletequestion': 'Soll das Projekt %{name} wirklich gelöscht werden?',
				'hidequestion': 'Soll das Projekt %{name} wirklich verborgen werden?',
				'delete': 'Löschen',
				'hide': 'Verbergen',
				'cancel': 'Abbrechen',
				},
			en: {
				'deletetitle': 'Delete project',
				'hidetitle': 'Hide project',
				'deletequestion': 'Do you really want to delete the project %{name}?',
				'hidequestion': 'Do you really want to hide the project %{name}?',
				'delete': 'Delete',
				'hide': 'Hide',
				'cancel': 'Cancel',
				},
			}),
	}),
	mixins: [i18nMixin],
	computed: {
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		permissions: function () {
			return this.workspace?.getPermissions (this.state.user?.name)[0];
		},
		canDelete: function () {
			return this.permissions?.canDelete () ?? false;
		},
	},
	methods: {
        deleteWorkspace: async function() {
			if (this.canDelete) {
				await this.workspaces.delete (this.workspace);
			} else {
				await this.workspaces.ignore (this.workspace);
			}
			await this.$router.push ({name: 'workspaces'});
        },
	}
};


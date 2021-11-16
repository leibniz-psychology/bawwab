import { translations, i18nMixin } from '../../i18n.js';
import { store } from '../../app.js';
import template from './template.html'

export default {
	name: 'WorkspaceDeleteView',
	props: ['wsid'],
	template: template,
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


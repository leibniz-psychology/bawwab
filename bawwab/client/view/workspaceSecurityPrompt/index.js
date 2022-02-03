import { store } from '../../app.js';
import { settingsProp } from '../../utils.js';
import template from './template.html';
import './style.css';

export default {
	props: ['wsid'],
	template: template,
	name: 'WorkspaceSecurityPromptView',
	data: _ => ({
		state: store.state,
		/* application strings */
	}),
	computed: {
		title: function () {
			if (this.isReadOnlyWorkspace) {
				return this.$t('v.workspaceSecurityPrompt.titleCopy');
			} else {
				return this.$t('v.workspaceSecurityPrompt.titleWrite');
			}
		},
		username: function () { return this.state.user?.name; },
		/* Used by settingsProp() */
		settings: function () { return this.state.settings; },
		workspaces: function () { return this.state.workspaces; },
		workspace: function () { return this.workspaces ? this.workspaces.getById(this.wsid) : null; },
		isOwnWorkspace: function () { return this.workspace.owner().includes(this.username) },
		isReadOnlyWorkspace: function () { return !this.workspace.getPermissions(this.username)[0].canWrite(); },
		autocopySharedReadOnly: settingsProp ('autocopySharedReadOnly'),
		dontShowSharedReadOnlyPopUp: settingsProp ('dontShowSharedReadOnlyPopUp'),
		dontShowSharedWriteAccessPopUp: settingsProp ('dontShowSharedWriteAccessPopUp'),
	},
	methods: {
		saveSettings: async function () {
			if (this.isReadOnlyWorkspace && this.autocopySharedReadOnly) {
				await this.copyWorkspace();
				return;
			}
			await this.$router.push({ name: 'workspace', params: { wsid: this.workspace.metadata._id } });
		},
		copyWorkspace: async function () {
			const newws = await this.workspaces.copy(this.workspace);
			newws.metadata.name = this.$t('v.workspaceSecurityPrompt.copyname', { name: newws.metadata.name });
			await this.workspaces.update(newws);
			await this.$router.push({ name: 'workspace', params: { wsid: newws.metadata._id } });
		},
	},
};

import { store } from '../../app.js';
import template from './template.html'
import {getUserIdFromCookie} from "../../matomoHelper";

export default {
	name: 'WorkspaceDeleteView',
	props: ['wsid'],
	template: template,
	data: _ => ({
		state: store.state,
	}),
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
				this.recordProjectDeleted();
				await this.workspaces.delete (this.workspace);
			} else {
				await this.workspaces.ignore (this.workspace);
			}
			await this.$router.push ({name: 'workspaces'});
        },
		recordProjectDeleted() {
			if (this.workspace?.metadata?._id) {
				_paq.push(['trackEvent', 'projects', 'project-deleted', getUserIdFromCookie()]);
			}
		}
	}
};


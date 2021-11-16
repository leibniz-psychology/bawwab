import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'WorkspacePublishView',
	props: ['wsid'],
	template: template,
	data: _ => ({
		state: store.state,

		/* share url for reading (false), writing (true) */
		shareUrl: {false: null, true: null},
		selectedShareUrl: false,
	}),
	computed: {
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		backRoute: function () { return {name: 'workspace', params: {wsid: this.workspace.metadata._id}}; },
	},
	methods: {
		sharePublic: async function () {
			await this.workspaces.share (this.workspace, 'o', false);
			await this.$router.push (this.backRoute);
		},
		unsharePublic: async function () {
			await this.workspaces.unshare (this.workspace, 'o');
			await this.$router.push (this.backRoute);
		},
	}
};


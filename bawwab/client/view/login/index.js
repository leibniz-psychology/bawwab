import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'LoginView',
	props: ['status'],
	template: template,
	data: _ => ({
		state: store.state
		}),
	computed: {
		message: function () {
			var m = this.$t('status-' + this.status);
			return m;
		},
	},
	created: async function () {
        const wsRoute = {name: 'workspaces'};
		if (this.status == 'success') {
            switch (this.state.user.loginStatus) {
                case 'success':
                    await this.$router.push (wsRoute);
                    break;

                case 'termsOfService':
                    await this.$router.push ({name: 'termsPrompt', query: {next: this.$router.resolve (wsRoute).fullPath}});
                    break;

                default:
                    await this.$router.push ({name: 'index'});
                    break;
			}
		}
	},
};

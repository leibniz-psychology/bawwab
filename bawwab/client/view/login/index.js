import { translations, i18nMixin } from '../../i18n.js';
import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'LoginView',
	props: ['status'],
	template: template,
	data: _ => ({
		strings: translations({
			'de': {
				'login': 'Anmelden',
				'status-failure': 'Die Anmeldung war nicht erfolgreich. Bitte versuche es noch einmal.',
				'status-success': 'Angemeldet',
				},
			'en': {
				'login': 'Login',
				'status-failure': 'Login was not successful. Please try again.',
				'status-success': 'Logged in',
				},
			}),
		}),
	computed: {
		message: function () {
			var m = this.t('status-' + this.status, this.t('status-failure'));
			return m;
		},
	},
	created: async function () {
        const wsRoute = {name: 'workspaces'};
		if (this.status == 'success') {
            switch (store.state.user.loginStatus) {
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
	mixins: [i18nMixin],
};

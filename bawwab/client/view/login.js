import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

export default Vue.extend ({
	props: ['status'],
	template: `<div><h2>{{ t('login') }}</h2>
		<p>{{ message }}</p>
	</div>`,
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
		if (this.status == 'success') {
			if (store.haveWorkspaces ()) {
				this.$router.push ({name: 'workspaces'});
			} else {
				this.$router.push ({name: 'index'});
			}
		}
	},
	mixins: [i18nMixin],
});



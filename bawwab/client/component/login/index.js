import { translations, i18nMixin } from '../../i18n.js';
import template from './template.html';

export default {
	name: 'Login',
    props: ['session'],
	data: _ => ({strings: translations ({
		de: {
			'login': 'Anmelden',
			'logout': 'Abmelden',
			'account': 'Benutzerkonto',
			},
		en: {
			'login': 'Login',
			'logout': 'Logout',
			'account': 'Account',
			}})}),
    template: template,
	mixins: [i18nMixin],
	computed: {
		authenticated: function () {
			return this.session && this.session.authenticated ();
		},
		initials: function () {
			if (this.authenticated) {
				const info = this.session.oauthInfo;
				return `${info.given_name[0]}${info.family_name[0]}`;
			}
		}
	},
};
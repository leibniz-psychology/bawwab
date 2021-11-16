import { translations, i18nMixin } from '../../i18n.js';
import { store } from '../../app.js';
import { Settings } from '../../settings';
import { settingsProp } from '../../utils.js';
import template from './template.html';

export default {
	name: 'AccountView',
	template: template,
	data: _ => ({
		state: store.state,
		/* application strings */
		strings: translations ({
			de: {
				'headline': 'Mein Benutzerkonto',
				'delete': 'Benutzerkonto löschen',
				'name': 'Name',
				'email': 'E-Mail-Adresse',
				'unixaccount': 'UNIX-Nutzername',
				'locked': 'Du kannst Dein Konto derzeit nicht löschen.',
				'settings': 'Einstellungen',
				'dontShowReadOnlySharedPopUp': 'Kein Info-Pop-Up für mit Kopierrechten geteilte Projekte anzeigen.',
				'dontShowSharedWriteAccessPopUp': 'Kein Info-Pop-Up für mit Schreibrechten geteilte Projekte anzeigen.',
				'autoCopyReadOnlyShared': 'Mit Kopierrechten geteilte Projekte automatisch kopieren. Ich verstehe die Risiken!'
				},
			en: {
				'headline': 'My account',
				'delete': 'Delete account',
				'name': 'Name',
				'email': 'Email address',
				'unixaccount': 'UNIX account name',
				'locked': 'You cannot delete your account at this time.',
				'settings': 'Settings',
				'dontShowReadOnlySharedPopUp': 'Don\'t show info-pop-up for projects shared with copy rights.',
				'dontShowSharedWriteAccessPopUp': 'Don\'t show info-pop-up for projects shared with write rights.',
				'autoCopyReadOnlyShared': 'Automatically copy projects shared with copy rights. I understand the risks!'
				},
			}),
	}),
	computed: {
		oauthInfo: function () {
			return this.state.session && this.state.session.oauthInfo;
		},
		canDelete: function () {
			return this.state.user && this.state.user.loginStatus == 'success';
		},
		username: function () { return this.state.user?.name; },
		/* used by settingsProp */
		settings: function () { return this.state.settings; },
		autocopySharedReadOnly: settingsProp ('autocopySharedReadOnly'),
		dontShowSharedReadOnlyPopUp: settingsProp ('dontShowSharedReadOnlyPopUp'),
		dontShowSharedWriteAccessPopUp: settingsProp ('dontShowSharedWriteAccessPopUp'),
	},
	methods: {
		mailto: function (a) {
			return `mailto:${a}`;
		},
	},
	mixins: [i18nMixin],
};


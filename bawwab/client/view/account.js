import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';
import { Settings } from '../settings';
import { settingsProp } from '../utils.js';

export default {
	name: 'AccountView',
	template: `<div>
	<h2>{{ t('headline') }}</h2>
	<dl>
		<dt>{{ t('name') }}</dt>
		<dd>{{ oauthInfo.given_name }} {{ oauthInfo.family_name }}</dd>

		<dt>{{ t('email') }}</dt>
		<dd><a :href="mailto(oauthInfo.email)">{{ oauthInfo.email }}</a></dd>

		<dt>{{ t('unixaccount') }}</dt>
		<dd v-if="state.user">{{ state.user.name }}</dd>
		<dd v-else>–</dd>
	</dl>
	<h3>{{ t('settings') }}</h3>
	<div class="settings-checkboxes">
		<div>
			<input id="autocopy" type="checkbox" name="autocopy" v-model="autocopySharedReadOnly">
			<label for="autocopy">{{ t('autoCopyReadOnlyShared') }}</label>
		</div>
		<div>
			<input id="not-again" type="checkbox" name="not-again" v-model="dontShowSharedReadOnlyPopUp">
			<label for="not-again">{{ t('dontShowReadOnlySharedModal') }}</label>
		</div>
	</div>
	<div v-if="canDelete">
		<h3>{{ t('delete') }}</h3>
		<p>
			<router-link class="btn" :to="{name: 'accountDelete'}"><i class="fas fa-trash"></i> {{ t('delete') }}</router-link>
		</p>
	</div>
</div>`,
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
				'dontShowReadOnlySharedModal': 'Kein Info-Pop-Up für mit Kopierrechten geteilte Projekte anzeigen.',
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
				'dontShowReadOnlySharedModal': 'Don\'t show info-pop-up for projects shared with copy rights.',
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
	},
	methods: {
		mailto: function (a) {
			return `mailto:${a}`;
		},
	},
	mixins: [i18nMixin],
};


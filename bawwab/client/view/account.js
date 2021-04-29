import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

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
				},
			en: {
				'headline': 'My account',
				'delete': 'Delete account',
				'name': 'Name',
				'email': 'Email address',
				'unixaccount': 'UNIX account name',
				'locked': 'You cannot delete your account at this time.',
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
	},
	methods: {
		mailto: function (a) {
			return `mailto:${a}`;
		},
	},
	mixins: [i18nMixin],
};


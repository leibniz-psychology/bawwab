import { translations, i18nMixin } from '../i18n.js';

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
    template: `<li v-if="session === null || !session.authenticated ()">
		<a href="/api/session/login">{{ t('login') }}</a></li>
		<li v-else>
			<dropdown class="usermenu">
				<template v-slot:button><span class="initials">{{ initials }} <i class="fas fa-caret-down"></i></span></template>
				<template v-slot:default>
					<ul>
						<li><router-link :to="{name: 'account'}">{{ t('account') }}</router-link></li>
						<li><router-link :to="{name: 'logout'}">{{ t('logout') }}</router-link></li>
					</ul>
				</template>
			</dropdown>
		</li>`,
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

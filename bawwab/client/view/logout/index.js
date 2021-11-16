import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'LogoutView',
	template: template,
	data: _ => ({
		done: false,
		}),
	computed: {
		ssoLogoutUrl: function () {
			const resolved = this.$router.resolve ({name: 'index'});
			const redirectUrl = new URL (resolved.href, window.location.href);
			const u = new URL ('https://sso.leibniz-psychology.org/auth/realms/ZPID/protocol/openid-connect/logout');
			u.searchParams.append ('redirect_uri', redirectUrl);
			return u;
		},
	},
	created: async function () {
		await store.state.ready.wait ();

		await store.state.session.destroy ();
		await store.init ();
		this.done = true;
	},
};

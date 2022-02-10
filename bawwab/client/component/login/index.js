import template from './template.html';
import './style.css';

export default {
	name: 'Login',
    props: ['session'],
	data: _ => ({
	}),
    template: template,
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

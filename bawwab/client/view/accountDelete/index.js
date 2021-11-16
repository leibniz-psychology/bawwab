import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'AccountDeleteView',
	template: template,
	data: _ => ({
		state: store.state,
	}),
	methods: {
		deleteAccount: async function () {
			let r = await fetch ('/api/user', {
				'method': 'DELETE'
			});
			if (r.ok) {
				this.state.user = null;
				await this.state.session.destroy ();
				await this.$router.push ({name: 'index'});
			} else {
				console.error (r);
			}
		}
	},
};


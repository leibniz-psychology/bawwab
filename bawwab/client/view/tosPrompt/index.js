import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'TermsOfServicePromptView',
	data: _ => ({
		state: store.state,
		allTerms: null,
		checkedTerms: [],
		}),
    template: template,
	created: async function () {
		if (!this.mustAccept) {
			await this.cont ();
		} else {
			this.allTerms = await store.getTermsOfService ();
		}
	},
	computed: {
		termsForCurrentLanguage: function () {
			return this.allTerms?.filter (t => t.language == this.$i18n.locale).sort (this.sort);
		},
		accepted: function () {
			/* JavaScript apparently has no set intersections */
			return this.termsForCurrentLanguage?.reduce ((v, t) => v && this.checkedTerms.includes (t.id), true);
		},
		mustAccept: function () {
			return this.state.user?.loginStatus == 'termsOfService';
		},
	},
	methods: {
		acceptText: function (kind) {
			const target = this.$router.resolve ({name: {
				tos: 'terms',
				privacy: 'privacy'}[kind]});
			return this.$t (`v.tosPrompt.agreeTo-${kind}`, {target: target.fullPath});
		},
		sort: function (a, b) {
			if (a.kind == 'tos' && b.kind == 'privacy') {
				return -1;
			} else if (b.kind == 'tos' && a.kind == 'privacy') {
				return 1;
			} else {
				return 0;
			}
		},
		cont: async function () {
			if (this.accepted || !this.mustAccept) {
				if (this.mustAccept) {
					await store.initUser (true);
					await store.initWorkspaces ();
				}
				const next = this.$router.currentRoute.value.query?.next ?? {name: 'index'};
				await this.$router.push (next);
			} else {
				/* this cannot happen, the button is disabled */
				await this.$router.push ({name: 'logout'});
			}
		},
	},
};


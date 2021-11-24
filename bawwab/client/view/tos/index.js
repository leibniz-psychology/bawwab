import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'TermsOfServiceView',
	props: ['kind'],
	data: _ => ({
		state: store.state,
		allTerms: null,
		}),
	template: template,
	created: async function () {
		this.allTerms = await store.getTermsOfService ();
	},
	computed: {
		terms: function () {
			return this.allTerms?.filter (t => t.language == this.$i18n.locale && t.kind == this.kind)[0];
		},
	},
	methods: {
		kindToHeading: function (k) {
			return this.$t (`v.tos.kind_${k}`);
		},
	},
};


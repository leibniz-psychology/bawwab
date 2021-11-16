import { translations, i18nMixin } from '../../i18n.js';
import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'TermsOfServiceView',
	props: ['kind'],
	data: _ => ({
		state: store.state,
		allTerms: null,
		strings: translations ({
			de: {
				'kind_tos': 'PsychNotebook Nutzungsbedingungen',
				'kind_privacy': 'Datenschutzhinweise',
				'dateformat': 'de-DE',
				},
			en: {
				'kind_tos': 'PsychNotebook Terms of Use',
				'kind_privacy': 'Data Privacy Note',
				'dateformat': 'en-US',
				},
			}),
		}),
	template: template,
	mixins: [i18nMixin],
	created: async function () {
		this.allTerms = await store.getTermsOfService ();
	},
	computed: {
		terms: function () {
			return this.allTerms?.filter (t => t.language == this.language && t.kind == this.kind)[0];
		},
	},
	methods: {
		kindToHeading: function (k) {
			return this.t (`kind_${k}`);
		},
		formatDate: function (d) {
			return new Intl.DateTimeFormat (this.t('dateformat'), {day: 'numeric', month: 'long', year: 'numeric'}).format(d);
		},
	},
};


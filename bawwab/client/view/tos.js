import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

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
	template: `<div class="tos">
		<template v-if="terms">
			<h2>{{ kindToHeading(terms.kind) }}</h2>
			<p>{{ formatDate(terms.effective) }}</p>
			<commonmark :safe="false" :level="2">{{ terms.content }}</commonmark>
		</template>
	</div>`,
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


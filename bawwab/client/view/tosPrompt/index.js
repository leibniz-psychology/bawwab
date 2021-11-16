import { translations, i18nMixin } from '../../i18n.js';
import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'TermsOfServicePromptView',
	data: _ => ({
		state: store.state,
		allTerms: null,
		checkedTerms: [],
		strings: translations ({
			de: {
				'dateformat': 'de-DE',
				'close': 'Abbrechen',
				'accept': 'Weiter',
				'welcome': 'Hallo, wir freuen uns, dass Du hier bist!',
				'acceptToContinue': 'PsychNotebook ist eine kostenlose Open-Source-Plattform des ZPIDs. Wir stehen für Open Science, d.h. den freien Zugang zu wissenschaftlichen Ergebnissen und deren Reproduzierbarkeit. Bitte lies unsere Nutzungsbedingungen und unsere Datenschutzhinweise bevor Du fortfährst.',
				'agreeTo-tos': 'Ich bestätige hiermit, dass ich die <a target="_blank" href="%{target}">Nutzungsbedingungen</a> von PsychNotebook gelesen und verstanden habe.',
				'agreeTo-privacy': 'Die <a target="_blank" href="%{target}">Datenschutzhinweise</a> habe ich zur Kenntnis genommen.',
				},
			en: {
				'dateformat': 'en-US',
				'close': 'Cancel',
				'accept': 'Continue',
				'welcome': 'Hi, we are glad you are here!',
				'acceptToContinue': 'PsychNotebook is a free open source platform provided by ZPID. We stand for open science, that is, free access to scientific results and their reproducibility. Please read our terms and conditions and our privacy policy before you continue.',
				'agreeTo-tos': 'I hereby confirm that I have read and understood the <a target="_blank" href="%{target}">terms of use</a> of PsychNotebook.',
				'agreeTo-privacy': 'I have read PsychNotebook’s <a target="_blank" href="%{target}">policy regarding data privacy</a>.',
				},
			}),
		}),
    template: template,
	mixins: [i18nMixin],
	created: async function () {
		if (!this.mustAccept) {
			await this.cont ();
		} else {
			this.allTerms = await store.getTermsOfService ();
		}
	},
	computed: {
		termsForCurrentLanguage: function () {
			return this.allTerms?.filter (t => t.language == this.language).sort (this.sort);
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
			return this.t (`agreeTo-${kind}`, {target: target.fullPath});
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


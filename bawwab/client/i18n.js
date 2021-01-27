import i18n from './external/i18n.js';
import { store } from './app.js';

/* Create translation objects from Maps
 */
export function translations (args) {
	let strings = {};
	for (let k in args) {
		strings[k] = i18n.create ({ values: args[k] });
	}
	return strings;
};

/* Translation mixin for Vue components, adds a method .t(), which can be used
 * for translations.
 */
export const i18nMixin = {
	methods: {
		t: function (...args) { if (this.strings) { return this.strings[this.language] (...args); } else { return '<missing>' } },
	},
	data: _ => ({ state: store.state, strings: translations ({de: {}, en: {}})}),
	computed: {
		language: function () { return this.state.language; },
	},
};


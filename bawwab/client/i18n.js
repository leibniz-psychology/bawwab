import { createI18n } from 'vue-i18n';
/* Unfortunately Weblate does not support multiple files per component,
 * which means we have to put all translations into a single json file
 * (per language). */
import de from './messages/de.json';
import en from './messages/en.json';

/* Set up translation support */
export default createI18n({
	locale: 'en',
	fallbackLocale: 'en',
	messages: { de, en },
	datetimeFormats: {
		'en': {
			short: {
				year: 'numeric', month: 'long', day: 'numeric'
				},
			full: {
				timeStyle: 'full', dateStyle: 'full',
				},
			},
		'de': {
			short: {
				year: 'numeric', month: 'long', day: 'numeric'
				},
			full: {
				timeStyle: 'full', dateStyle: 'full',
				},
			},
		},
});


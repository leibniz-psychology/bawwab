/* Unfortunately Weblate does not support multiple files per component,
 * which means we have to put all translations into a single json file
 * (per language). */

import { createI18n } from 'vue-i18n';

/* Set up translation support */
const i18n = createI18n({
	locale: 'ud',
	fallbackLocale: 'ud',
	/* Declare supported languages by setting empty messages */
	messages: { de: {}, en: {} },
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

async function loadLanguage (lang) {
	const langs = {
		de: () => import ('./messages/de.json'),
		en: () => import ('./messages/en.json'),
		};
	if (!langs[lang]) {
		throw new Error ('unsupported language');
	}
	const data = await langs[lang]();
	i18n.global.setLocaleMessage (lang, data);
}

export async function setLanguage (newLang) {
	if (!newLang) {
		newLang = window.localStorage.getItem ('language');
	}
	if (!newLang) {
		newLang = navigator.language?.split ('-')[0];
	}
	if (!newLang) {
		newLang = 'en';
	}

	await loadLanguage (newLang);
	i18n.global.locale = newLang;
	window.localStorage.setItem ('language', newLang);
}

setLanguage ().then (() => {});

export default i18n;


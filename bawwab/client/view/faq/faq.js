import { translations, i18nMixin } from '../../i18n.js';
import docDE from "./faq-content-de.md";
import docEN from "./faq-content-en.md";

export default {
	name: 'FaqView',
	template: `<div class="faq"><commonmark :safe="false" :level="2">{{ t('content') }}</commonmark></div>`,
	data: _ => ({
		/* application strings */
		strings: translations ({
			de: {
				content: docDE,
				},
			en: {
				content: docEN,
				},
			}),
	}),
	mixins: [i18nMixin],
};


import {i18nMixin, translations} from '../../i18n.js';
import docDE from "./faq-content-de.md";
import docEN from "./faq-content-en.md";
import FaqSideNav from "./faqSideNav";

export default {
	name: 'FaqView',
	template: `<div class="faq">
<div class="faq-sideNav"><faq-side-nav></faq-side-nav></div>
<div class="faq-content"><commonmark :safe="false" :addlevel="1">{{ t('content') }}</commonmark></div>
</div>`,
	components: {
		FaqSideNav,
	},
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


import {i18nMixin, translations} from '../../i18n.js';
import docDE from "./faq-content-de.md";
import docEN from "./faq-content-en.md";
import FaqSideNav from "../../component/faqSideNav";
import template from './template.html';

export default {
	name: 'FaqView',
	template: template,
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


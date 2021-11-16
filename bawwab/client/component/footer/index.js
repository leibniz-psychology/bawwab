import { translations, i18nMixin } from '../../i18n.js';
import sitemap from './sitemap.json';
import template from './template.html';

export default {
	name: 'Footer',
	template: template,
    data: _ => ({
		open: false,
		strings: translations ({
			de: {
				'offerby': 'Ein Angebot von',
				'learnmore': 'Erfahre mehr über uns!',
				'questions': 'Hast Du Fragen?',
				'questionsBody': 'Schreib uns eine E-Mail. Wir helfen Dir gern.',
				'contact': 'Kontakt',
				'followus': 'Folge uns.',
				'followusBody': 'Auf Twitter und Facebook informieren wir Dich über Neuigkeiten aus dem ZPID.',
				'termsofservice': 'Nutzungsbedingungen',
				'software': 'Software',
				'imprint': 'Datenschutzhinweise',
				'leibnizLogo': 'https://www.lifp.de/assets/images/Leibniz-Gemeinschaft_Logo.svg',
				},
			en: {
				'offerby': 'A service provided by',
				'learnmore': 'Learn more about us!',
				'questions': 'Have a question?',
				'questionsBody': 'Send us an email. We will be happy to help you.',
				'contact': 'Contact',
				'followus': 'Follow us on social media.',
				'followusBody': 'Get the latest ZPID news on Twitter and Facebook.',
				'termsofservice': 'Terms of Use',
				'software': 'Software',
				'imprint': 'Data Privacy Note',
				'leibnizLogo': 'https://www.lifp.de/assets/images/Logo_Leibniz_Association.svg',
			},
		}),
		}),
	computed: {
		sitemap: function () {
			return sitemap[this.language];
		},
	},
	methods: {
		afterOpen: function () {
			this.$el.scrollIntoView ({behavior: 'smooth'});
		}
	},
	mixins: [i18nMixin],
};

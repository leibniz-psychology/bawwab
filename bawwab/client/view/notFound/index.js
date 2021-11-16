import { translations, i18nMixin } from '../../i18n.js';
import template from './template.html';

export default {
	name: 'NotFoundView',
	template: template,
	data: _ => ({
		strings: translations({
			'de': {
				'notfound': 'Nicht gefunden',
				},
			'en': {
				'notfound': 'Not found',
				},
			}),
		}),
	mixins: [i18nMixin],
};


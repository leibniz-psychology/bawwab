import { translations, i18nMixin } from '../i18n.js';

export default {
	template: `<div><h2>{{ t('notfound') }}</h2></div>`,
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


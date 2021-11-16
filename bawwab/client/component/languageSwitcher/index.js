/* Language switcher using local browser storage to save user’s choice
 */

import template from './template.html';

export default {
	name: 'LanguageSwitcher',
	/* XXX: remove languages prop */
	props: ['state', 'languages'],
	template: template,
	methods: {
		switchTo: function (l) {
			if (this.$i18n.availableLocales.includes (l)) {
				console.debug ('switching to language', l);
				this.$i18n.locale = l;
				window.localStorage.setItem('language', l);
			}
		},
		isActive: function (l) {
			if (this.$i18n.locale == l) {
				return 'active';
			} else {
				return '';
			}
		}
	},
	created: function () {
		const lang = window.localStorage.getItem ('language');
		const browserLang = navigator.language?.split ('-')[0];
		this.switchTo (lang ?? browserLang ?? 'en');
	},
};

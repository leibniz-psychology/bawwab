/* Language switcher using local browser storage to save user’s choice
 */

import template from './template.html';
import { setLanguage } from '../../i18n';

export default {
	name: 'LanguageSwitcher',
	/* XXX: remove languages prop */
	props: ['state', 'languages'],
	template: template,
	methods: {
		switchTo: async function (l) {
			await setLanguage (l);
		},
		isActive: function (l) {
			if (this.$i18n.locale == l) {
				return 'active';
			} else {
				return '';
			}
		}
	},
};

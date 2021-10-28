import { translations, i18nMixin } from '../i18n.js';
import { ref } from 'vue/dist/vue.esm-bundler.js';

/* Use a global time reference, so we only need one event callback for
 * all of them and they all update at the same time. Update every minute,
 * because that’s our displayed accuracy. */
let now = ref (new Date ());
const nowInterval = setInterval (function () { now.value = new Date (); }, 60*1000);

export default {
	name: 'naturalAgo',
	props: ['date'],
	data: _ => ({
		strings: translations ({
			de: {
				'now': 'eben gerade',
				'minutes': [
					[0, 0, 'vor %n Minuten'],
					[1, 1, 'vor %n Minute'],
					[2, null, 'vor %n Minuten'],
					],
				'hours': [
					[0, 0, 'vor %n Stunden'],
					[1, 1, 'vor %n Stunde'],
					[2, null, 'vor %n Stunden'],
					],
				'days': [
					[0, 0, 'vor %n Tagen'],
					[1, 1, 'gestern'],
					[2, null, 'vor %n Tagen'],
					],
				'weeks': [
					[0, 0, 'vor %n Wochen'],
					[1, 1, 'letzte Woche'],
					[2, null, 'vor %n Wochen'],
					],
				'months': [
					[0, 0, 'vor %n Monaten'],
					[1, 1, 'letzten Monat'],
					[2, null, 'vor %n Monaten'],
					],
				},
			en: {
				'now': 'just now',
				'minutes': [
					[0, 0, '%n minutes ago'],
					[1, 1, '%n minute ago'],
					[2, null, '%n minutes ago'],
					],
				'hours': [
					[0, 0, '%n hours ago'],
					[1, 1, '%n hour ago'],
					[2, null, '%n hours ago'],
					],
				'days': [
					[0, 0, '%n days ago'],
					[1, 1, 'yesterday'],
					[2, null, '%n days ago'],
					],
				'weeks': [
					[0, 0, '%n weeks ago'],
					[1, 1, 'last week'],
					[2, null, '%n weeks ago'],
					],
				'months': [
					[0, 0, '%n months ago'],
					[1, 1, 'last month'],
					[2, null, '%n months ago'],
					],
				},
			}),
	}),
	mixins: [i18nMixin],
	template: `<span :title="absdate">{{ formattedDelta (delta) }}</span>`,
	computed: {
		delta: function () {
			return this.date ? now.value - this.date : null;
		},
		absdate: function () {
			return Intl.DateTimeFormat (this.state.language,
					{timeStyle: 'full', dateStyle: 'full'}).format (this.date);
		},
	},
	methods: {
		/* Lazily format a time delta. Only return the most significant unit (days, hours, minutes) */
		formattedDelta: function (d) {
			if (!d) {
				return '';
			}
			const units = [
				[1000*60*60*24*30, 'months'],
				[1000*60*60*24*7, 'weeks'],
				[1000*60*60*24, 'days'],
				[1000*60*60, 'hours'],
				[1000*60, 'minutes']];
			for (const [div, kind] of units) {
				const value = Math.floor (d/div);
				if (value >= 1) {
					return this.t(kind, value);
				}
			}
			return this.t('now');
		}
	},
};


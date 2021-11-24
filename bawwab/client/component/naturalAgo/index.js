import { ref } from 'vue/dist/vue.esm-bundler.js';
import template from './template.html';

/* Use a global time reference, so we only need one event callback for
 * all of them and they all update at the same time. Update every minute,
 * because that’s our displayed accuracy. */
let now = ref (new Date ());
const nowInterval = setInterval (function () { now.value = new Date (); }, 60*1000);

export default {
	name: 'naturalAgo',
	props: ['date'],
	template: template,
	computed: {
		delta: function () {
			return this.date ? now.value - this.date : null;
		},
		absdate: function () {
			return this.$d (this.date, 'full');
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
					return this.$tc('c.naturalAgo.' + kind, value);
				}
			}
			return this.$t('c.naturalAgo.now');
		}
	},
};


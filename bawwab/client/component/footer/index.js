import sitemap from './sitemap.json';
import template from './template.html';
import './style.css';

export default {
	name: 'Footer',
	template: template,
    data: _ => ({
		open: false,
		}),
	computed: {
		sitemap: function () {
			return sitemap[this.$i18n.locale];
		},
	},
	methods: {
		afterOpen: function () {
			this.$el.scrollIntoView ({behavior: 'smooth'});
		}
	},
};

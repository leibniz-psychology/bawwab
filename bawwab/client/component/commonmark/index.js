import { Parser, HtmlRenderer } from 'commonmark';
import template from './template.html';

export default {
	name: 'CommonmarkComponent',
	props: ['addlevel', 'safe'],
	/* XXX: We should actually use a render function here
	 * (https://v3.vuejs.org/guide/render-function.html), but that’d require
	 * writing a commonmark renderer from scratch. On the upside, we could use
	 * router-link components. */
	template: template,
	computed: {
		rendered: function () {
			const reader = new Parser();
			const writer = new HtmlRenderer({safe: this.safe ?? true});
			const parsed = reader.parse (this.$slots.default()[0].children);

			/* transform headlines, so they appear below main headline, which is h2 already */
			const walker = parsed.walker();
			let event, node;

			while ((event = walker.next())) {
				node = event.node;
				if (event.entering && node.type === 'heading') {
					node.level = Math.min (6, node.level+(this.addlevel ?? 0));
				}
			}

			return writer.render(parsed);
		},
	}
};


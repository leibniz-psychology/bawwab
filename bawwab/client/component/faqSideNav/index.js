import {Parser} from "commonmark";
import template from './template.html';
import './style.css';

export default {
	name: 'FaqSideNav',
	/* The markdown text to extract headings from */
	props: ['text'],
	template: template,
	data: _ => ({
		hideNav: true,
		subListShown: new Set (),
		/* application strings */
	}),
	computed: {
		quickNavigator: function () {
			return document.getElementById("faq-toc");
		},
		tocData: function () {
			let rawTocData = [];
			const reader = new Parser();
			const parsed = reader.parse(this.text);

			const walker = parsed.walker();
			let event, node;

			let domParser = new DOMParser();
			while ((event = walker.next())) {
				node = event.node;
				if (event.entering && node.type === 'heading') {
					if (node.level === 1 || node.level > 3) {
						continue;
					}
					rawTocData.push({
						text: node.firstChild.literal,
						level: node.level,
						anchor: domParser.parseFromString(node?.firstChild?.next?.literal, "text/html")
							.getElementsByTagName("a")[0]
							?.getAttribute("id"),
						parent: null,
						children: [],
					});
				}
			}
			return this.levelTocData(rawTocData);
		},
	},
	methods: {
		//transforms the flat array of headings into a tree-like structure
		levelTocData: function (tocData) {
			//dummy-root-node, old trick to reduce number of edge-cases with tree-like structures
			let result = {
				level: 0,
				children: [tocData[0]],
			};
			let previous = tocData[0];
			previous.parent = result;
			for (let i = 1; i < tocData.length; i++) {
				const date = tocData[i];
				if (date.level > previous.level) {
					previous.children.push(date);
					date.parent = previous;
				} else if (date.level === previous.level) {
					previous.parent.children.push(date);
					date.parent = previous.parent;
				} else if (date.level < previous.level) {
					let climber = previous.parent;
					while (date.level <= climber.level) {
						climber = climber.parent;
					}
					climber.children.push(date);
					date.parent = climber;
				}
				previous = date;
			}
			return result.children;
		},
		toggleSubListShown: function (anchor) {
			if (this.subListShown.has (anchor)) {
				this.subListShown.delete (anchor);
			} else {
				this.subListShown.add (anchor);
			}
		},
		smoothScrollIntoView: function ($event) {
			$event.preventDefault();
			this.hideSideNav();
			document.querySelector($event.target.getAttribute('href')).scrollIntoView({
				behavior: 'smooth'
			});
		},
		hideSideNav: function () {
			this.hideNav = true;
		},
		showSideNav: function () {
			this.hideNav = false;
		},
		toggleSideNav: function () {
			if (this.hideNav) {
				this.showSideNav();
			} else {
				this.hideSideNav();
			}
		},
		expanderClass: function (anchor) {
			return 'faq-toc_collaptor fas fa-angle-' + (this.subListShown.has (anchor) ? 'down' : 'right');
		},
	},
};


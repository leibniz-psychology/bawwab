import {i18nMixin, translations} from '../../i18n.js';
import docDE from "./faq-content-de.md";
import docEN from "./faq-content-en.md";
import {Parser} from "commonmark";

export default {
	name: 'FaqSideNav',
	template: `<div id="quick-navigator" class="qn--container" :class="{'qn--hide': hideNav}" v-click-outside="hideSideNav">
	<ul class="qn--list">
		<li v-for="item in tocData" 
			:key="item.anchor" 
			class="qn--item qn--top-level-item" 
			:class="{'qn--collaptor-item':item.children.length > 0}">
			<a class="qn--link" :href="'#'+item.anchor" @click="smoothScrollIntoView($event)">{{ item.text }}</a>
			<i v-if="item.children.length > 0" class="qn--collaptor fas fa-angle-right" @click="toggleSubListShown(item.anchor, $event)"></i>
			<transition name="transition-slide">
				<ul v-if="item.children.length > 0 && subListShown[item.anchor]" class="qn--inner-list">
					<li v-for="innerItem in item.children" :key="innerItem.anchor" class="qn--item qn--second-level-item">
						<a class="qn--link" :href="'#'+innerItem.anchor" @click="smoothScrollIntoView($event)">{{ innerItem.text }}</a>
					</li>
				</ul>
			</transition>
		</li>
	</ul>
	<div id="qn--slider" class="qn--slider" @click="toggleSideNav">
		<span class="qn--text">{{ t('toc') }}</span>
	</div>
</div>`,
	data: _ => ({
		hideNav: true,
		subListShown: [],
		/* application strings */
		strings: translations({
			de: {
				doc: docDE,
				toc: "Inhaltsverzeichnis",
			},
			en: {
				doc: docEN,
				toc: "Table of Contents"
			},
		}),
	}),
	mixins: [i18nMixin],
	mounted: function () {
		for (let item of this.tocData) {
			if (item.children.length > 0) {
				this.subListShown[item.anchor] = false;
			}
		}
	},
	computed: {
		quickNavigator: function () {
			return document.getElementById("quick-navigator");
		},
		tocData: function () {
			let rawTocData = [];
			const reader = new Parser();
			const parsed = reader.parse(this.t('doc'));

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
		toggleSubListShown: function (anchor, $event) {
			this.subListShown[anchor] = !this.subListShown[anchor];

			$event.target.classList.toggle("fa-angle-right");
			$event.target.classList.toggle("fa-angle-down");
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
		}
	},
};




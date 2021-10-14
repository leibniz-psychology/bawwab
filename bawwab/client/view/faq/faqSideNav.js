import { translations, i18nMixin } from '../../i18n.js';
import navDE from "./faq-nav-de.md";
import navEN from "./faq-nav-en.md";
import { slideToggle } from "../../effects";

export default {
	name: 'FaqSideNav',
	template: `<div id="quick-navigator" class="qn--container" v-click-outside="hideSideNav">
  <ul class="qn--list" v-html="sideNavItemMarkup()">
  </ul>
  <div id="qn--slider" class="qn--slider">
		<span class="qn--text">{{ t('toc') }}</span>
	</div>
</div>`,
	mounted: function () {
		const collaptorItems = this.quickNavigator.getElementsByClassName("qn--collaptor-item");
		const hideSideNav = this.hideSideNav;

		//smooth scrolling to content
		this.quickNavigator.querySelectorAll('a[href^="#"]').forEach(anchor => {
			anchor.addEventListener('click', function (e) {
				e.preventDefault();
				hideSideNav();
				document.querySelector(this.getAttribute('href')).scrollIntoView({
					behavior: 'smooth'
				});
			});
		});

		//collapsible second-level-items
		for (const collaptorItem of collaptorItems) {
			const collaptor = collaptorItem.getElementsByClassName("qn--collaptor")[0];
			collaptor.addEventListener("click", () => {
				slideToggle(collaptorItem.nextElementSibling);
				collaptor.classList.toggle("fa-angle-right");
				collaptor.classList.toggle("fa-angle-down");
			});
		}

		this.quickNavigator.style.left = this.navigatorOffset + "px";
		this.quickNavigatorSlider.addEventListener('click', this.toggleSideNav);
	},
	computed: {
		quickNavigator: function () { return document.getElementById("quick-navigator"); },
		quickNavigatorSlider: function () { return document.getElementById("qn--slider"); },
		navigatorOffset: function () { return - this.quickNavigator.clientWidth + this.quickNavigatorSlider.clientWidth;},
	},
	methods: {
		sideNavItemMarkup: function () {
			let navItems = this.t('nav').split(/\r?\n/).map((line) => {
				let item = {};
				const matches = line.match(/(\s*)-\s*\[(.*)\]\s*\((.*)\)/);
				if (!matches) {
					return null;
				}
				item.secondLevel = matches[1].length > 0;
				item.text = matches[2];
				item.href = matches[3];
				return item;
			}).filter((item) => item !== null);

			let navMarkup = ``;
			let lastWasSecondLevel = false;
			for (let i = 0; i < navItems.length; i++){
				const navItem = navItems[i];
				if (navItem.secondLevel) {
					navMarkup += `<li class="qn--item qn--second-level-item"><a class="qn--link" href="` + navItem.href + `">` + navItem.text + `</a></li>`;
				} else if (!navItem.secondLevel) {
					if (lastWasSecondLevel) {
						navMarkup += `</ul>`;
					}
					if (navItems[i + 1] && navItems[i + 1].secondLevel) {
						navMarkup += `<li class="qn--item qn--top-level-item qn--collaptor-item"><a class="qn--link" href="` + navItem.href + `">` + navItem.text + `</a><i class="qn--collaptor fas fa-angle-right"></i></li>`;
						navMarkup += `<ul class="qn--inner-list">`;
					} else {
						navMarkup += `<li class="qn--item qn--top-level-item"><a class="qn--link" href="` + navItem.href + `">` + navItem.text + `</a></li>`;
					}
				}

				lastWasSecondLevel = navItem.secondLevel;
			}
			return navMarkup;
		},
		hideSideNav: function() {
			this.quickNavigator.style.left = this.navigatorOffset + "px";
		},
		showSideNav: function() {
			this.quickNavigator.style.left = "0px";
		},
		toggleSideNav: function() {
			if (!this.quickNavigator.style.left || this.quickNavigator.style.left === "0px") {
				this.hideSideNav();
			} else {
				this.showSideNav();
			}
		}
	},
	data: _ => ({
		/* application strings */
		strings: translations ({
			de: {
				nav: navDE,
				toc: "Inhaltsverzeichnis",
			},
			en: {
				nav: navEN,
				toc: "Table of Contents"
			},
		}),
	}),
	mixins: [i18nMixin],
};




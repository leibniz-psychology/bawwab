/* Language switcher using local browser storage to save user’s choice
 */
Vue.component ('language-switcher', {
	props: ['state', 'languages'],
	template: `<ul class="topline-nav">
		<li v-for="l in languages"><a @click="switchTo(l)" :class="isActive(l)">{{ l }}</a></li>
		</ul>`,
	methods: {
		switchTo: function (l) {
			if (this.languages.includes (l)) {
				console.debug ('switching to language', l);
				Vue.set (this.state, 'language', l);
				window.localStorage.setItem('language', l);
			}
		},
		isActive: function (l) {
			if (this.state.language == l) {
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
});


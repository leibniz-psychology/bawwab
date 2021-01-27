import spinnerSvg from '../img/spinner.svg';

Vue.component ('spinner', {
	props: ['big'],
	template: `<img :src="path" :class="cls">`,
	computed: {
		cls() {
			return 'spinner' + (this.big ? ' big' : '');
		},
		path() {
			return '/assets/' + spinnerSvg;
		}
	},
});


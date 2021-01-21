Vue.component ('spinner', {
	props: ['big'],
	template: `<img src="/assets/img/spinner.svg" :class="cls">`,
	computed: {
		cls() {
			return 'spinner' + (this.big ? ' big' : '');
		},
	},
});


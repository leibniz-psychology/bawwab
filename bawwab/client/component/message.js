export default {
	name: 'Message',
	props: ['kind'],
	data: function () { return {visible: true} },
	template: `<div :class="divclass" v-show="visible">
<i :class="iconclass"></i>
<slot></slot>
<a class="close" @click="hide"><i class="fa fa-window-close"></i></a>
</div>`,
	computed: {
		iconclass: function () {
			const kindToIcon = {
				warning: 'exclamation-triangle',
				info: 'info',
				};
			return "icn fa fa-" + kindToIcon[this.kind];
		},
		divclass: function () {
			return 'message ' + (this.kind ? this.kind : 'info');
		},
	},
	methods: {
		hide: function () {
			this.visible = false;
		},
	}
};

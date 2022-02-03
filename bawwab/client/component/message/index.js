import template from './template.html';
import './style.css';

export default {
	name: 'Message',
	props: ['kind'],
	data: function () { return {visible: true} },
	template: template,
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

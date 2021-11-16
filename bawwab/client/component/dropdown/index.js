import template from './template.html';

export default {
	name: 'Dropdown',
    template: template,
	methods: {
		close: function () {
			this.$el.open = false;
		},
	}
};


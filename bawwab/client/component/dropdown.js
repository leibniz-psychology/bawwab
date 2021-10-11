export default {
	name: 'Dropdown',
    template: `<details class="dropdown" v-click-outside="close">
				<summary>
					<slot name="button"></slot>
				</summary>
				<slot></slot>
			</details>`,
	methods: {
		close: function () {
			this.$el.open = false;
		},
	}
};


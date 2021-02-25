Vue.component('action-button', {
	props: ['icon', 'f', 'importance', 'disabled'],
	data: function () { return {busy: false, ret: null} },
	template: `<button v-on:click="clicked" :class="btnclass" :disabled="disabled || busy"><i :class="iconclass"></i> <slot></slot></button>`,
	computed: {
		iconclass: function () {
			if (this.ret) {
				if (this.ret instanceof Error) {
					return "fas fa-exclamation-triangle";
				} else {
					return 'fas fa-check';
				}
			} else if (this.busy) {
				return "fas fa-spin fa-spinner";
			} else {
				return "fas fa-" + this.icon;
			}
		},
		btnclass: function () {
			return 'btn ' + (this.importance ? this.importance : 'low');
		},
	},
	methods: {
		clicked: async function () {
			if (!this.busy) {
				this.ret = null;

				this.busy = true;
				try {
					this.ret = await this.f ();
				} catch (e) {
					this.ret = e;
					this.busy = false;
					throw e;
				}
				this.busy = false;
			}
		},
	}
});


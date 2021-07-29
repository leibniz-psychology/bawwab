/*	Simple modal layout
 */
export default {
	name: 'Modal',
	props: ['icon', 'title', 'closeName', 'closeLink', 'scaling'],
	template: `<div class="modal">
		<div :class="frameClass">
			<div class="icon">
				<h2><i :class="'fas fa-' + icon"></i></h2>
			</div>
			<div class="content">
				<h2>{{ title }}</h2>
				<div class="userContent">
					<slot></slot>
				</div>
				<div class="buttons">
					<slot name="buttons"></slot>
					<router-link :to="closeLink" v-if="closeName" class="btn low">{{ closeName }}</router-link>
				</div>
			</div>
			<div class="close">
				<a class="close" @click="close"><i class="fa fa-window-close"></i></a>
			</div>
		</div>
	</div>`,
	computed: {
		frameClass: function() {
			return 'frame' + (this.scaling ? ' scaling' : ' fixed');
		},
	},
	/* Vue cannot handle key events on <body>, so register our our handler */
	created: function() {
		document.addEventListener('keydown', this.handleKeydown);
	},
	unmounted: function() {
		document.removeEventListener('keydown', this.handleKeydown);
	},
	methods: {
		close: async function () {
			await this.$router.push (this.closeLink);
		},
		handleKeydown: function (event) {
			if (event.defaultPrevented) {
				return;
			}

			switch (event.key) {
				case "Esc":
				case "Escape":
					this.close ();
					break;

				default:
					return;
			}

			event.preventDefault();
		}
	},
};


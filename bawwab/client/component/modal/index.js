/*	Simple modal layout
 */
import template from './template.html';
import './style.css';

export default {
	name: 'Modal',
	props: ['icon', 'title', 'closeName', 'closeLink', 'scaling'],
	template: template,
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


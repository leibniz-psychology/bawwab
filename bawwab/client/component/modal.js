/*	Simple modal layout
 */
Vue.component ('modal', {
	props: ['icon', 'title', 'closeName', 'closeLink', 'scaling'],
	template: `<transition name="fade">
	<div class="modal">
		<div :class="frameClass">
			<div class="icon">
				<h2><i :class="iconStyle"></i></h2>
			</div>
			<div class="content">
				<h2>{{ title }}</h2>
				<div class="userContent">
					<slot></slot>
				</div>
				<div class="buttons">
					<slot name="buttons"></slot>
					<router-link :to="closeLink" class="btn low">{{ closeName }}</router-link>
				</div>
			</div>
		</div>
	</div>
	</transition>`,
	computed: {
		iconStyle: function () {
			return `fas fa-${this.icon}`;
		},
		frameClass: function() {
			return 'frame' + (this.scaling ? ' scaling' : ' fixed');
		},
	},
});



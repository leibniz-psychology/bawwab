import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'ApplicationItem',
    props: ['workspace', 'application'],
	data: _ => ({
		state: store.state,
		}),
    template: template,
	computed: {
		name() {
			let name = this.application[`name[${this.$i18n.locale}]`];
			if (!name) {
				name = this.application.name;
			}
			return name;
		},
		description() {
			let desc = this.application[`description[${this.$i18n.locale}]`];
			if (!desc) {
				desc = this.application.description;
			}
			return desc;
		},
		cls () {
			return 'fas ' + (this.state.workspaces.getRunningApplication (this.workspace, this.application) === undefined ? 'fa-play' : 'fa-external-link-square-alt');
		}
	}
};


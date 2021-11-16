import { translations, i18nMixin } from '../../i18n.js';
import { store } from '../../app.js';
import template from './template.html';

export default {
	name: 'ApplicationItem',
    props: ['workspace', 'application'],
	mixins: [i18nMixin],
	data: _ => ({
		state: store.state,
		strings: translations({
			de: {
				'run': 'Starten',
				},
			en: {
				'run': 'Run',
				},
			}),
		}),
    template: template,
	computed: {
		name() {
			let name = this.application[`name[${this.language}]`];
			if (!name) {
				name = this.application.name;
			}
			return name;
		},
		description() {
			let desc = this.application[`description[${this.language}]`];
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


import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

/* Display desktop icon for application */
export const ApplicationIconComponent = {
	name: 'ApplicationIcon',
    props: ['workspace', 'application', 'height'],
    template: `<img :src="icon" :style="style">`,
	computed: {
		icon() {
			return this.application.icon ? `/api/filesystem${this.workspace.path}/.guix-profile/share/icons/hicolor/scalable/apps/${this.application.icon}.svg?inline=1` : null;
		},
		style() {
			return `height: ${this.height}; vertical-align: middle;`;
		}
	},
};

export const ApplicationItemComponent = {
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
    template: `<div class="pure-g application">
		<div class="pure-u-md-4-5 pure-u-1">
			<application-icon :workspace="workspace" :application="application" height="3em"></application-icon>
			{{ name }}. {{ description }}
		</div>
		<div class="pure-u-md-1-5 pure-u-1 actions">
		<router-link :to="{name: 'application', params: {wsid: workspace.metadata._id, appid: application._id}}" class="btn medium">
			<i :class="cls"></i> {{ t('run') }}
		</router-link>
		</div></div>`,
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


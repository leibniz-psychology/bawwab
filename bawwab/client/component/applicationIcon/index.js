import template from './template.html';

/* Display desktop icon for application */
export default {
	name: 'ApplicationIcon',
    props: ['workspace', 'application', 'height'],
    template: template,
	computed: {
		icon() {
			return this.application.icon ? `/api/filesystem${this.workspace.path}/.guix-profile/share/icons/hicolor/scalable/apps/${this.application.icon}.svg?inline=1` : null;
		},
		style() {
			return `height: ${this.height}; vertical-align: middle;`;
		}
	},
};


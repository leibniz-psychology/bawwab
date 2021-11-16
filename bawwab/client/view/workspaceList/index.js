import { translations, i18nMixin } from '../../i18n.js';
import { store } from '../../app.js';
import { queryParamProp } from '../../utils.js';
import Workspace from '../../workspace.js';
import { copy } from "../../workspaceUtil";
import template from './template.html';

export default {
	name: 'WorkspaceListView',
	template: template,
	data: _ => ({
		state: store.state,
		name: '',
		strings: translations({
			de: {
				'copyname': 'Kopie von %{name}', /* name after copying a project */
				'projects': 'Projekte',
				'description': 'Hier können Projekte eingerichtet und aufgerufen werden. Projekte sind Sammlungen von Analyseskripten, Daten und anderen Materialien.',
				'projectname': 'Projektname',
				'create': 'Neues Projekt',
				'share': 'Teilen',
				'copy': 'Kopieren',
				'delete': 'Löschen',
				'publish': 'Veröffentlichen',
				'export': 'Exportieren',
				'manage': 'Pakete verwalten',
				'unnamed': 'Unbenanntes Projekt',
				'myprojects': 'Meine Projekte',
				'sharedprojects': 'Geteilte Projekte',
				'publicprojects': 'Öffentliche Projekte',
				'thtitle': 'Titel',
				'thdescription': 'Beschreibung',
				'thapplications': 'Anwendungen',
				'thactions': 'Aktionen',
				'import': 'Projekt importieren',
				},
			en: {
				'copyname': 'Copy of %{name}', /* name after copying a project */
				'projects': 'Projects',
				'description': 'Projects can be set up and accessed here. Projects are collections of analysis scripts, data, and other materials.',
				'projectname': 'Project name',
				'create': 'New project',
				'share': 'Share',
				'copy': 'Copy',
				'delete': 'Delete',
				'publish': 'Publish',
				'export': 'Export',
				'manage': 'Manage packages',
				'unnamed': 'Unnamed project',
				'myprojects': 'My projects',
				'sharedprojects': 'Shared projects',
				'publicprojects': 'Public projects',
				'thtitle': 'Title',
				'thdescription': 'Description',
				'thapplications': 'Applications',
				'thactions': 'Actions',
				'import': 'Import project',
				},
			}),
		}),
	mixins: [i18nMixin],
	mounted: function () {
	},
	computed: {
		workspaces: function () { return this.state.workspaces; },
		disabled: function() { return !this.state.workspaces; },
		username: function () { return this.state.user?.name; },
		filteredWorkspaces: function () {
			const filterFunc = {
				mine: w => w.getPermissions (this.username)[0].canShare (),
				shared: w => w.getPermissions (this.username)[1] == 'group',
				world: w => w.getPermissions (this.username)[1] == 'other' || w.isPublic,
				};
			const searchFunc = function (w) {
				const s = this.filtertext;
				if (s) {
					const sl = s.toLowerCase ();
					const searchFields = ['name', 'description'];
					return searchFields.reduce ((last, name) => last || w.metadata[name]?.toLowerCase().indexOf (sl) != -1, false);
				} else {
					return true;
				}
			}.bind (this);
			if (!this.disabled) {
				const f = w => [filterFunc[this.filter], searchFunc].reduce ((last, g) => last && g(w), true)
				return this.state.workspaces.all().filter (f).sort (Workspace.compareName);
			} else {
				return [];
			}},
		filter: queryParamProp ('filter', 'mine'),
		filtertext: queryParamProp ('search', ''),
	},
	methods: {
		copy,
        createWorkspace: async function() {
			const w = await this.state.workspaces.create (this.name);
			await this.$router.push ({name: 'workspace', params: {wsid: w.metadata._id}});
        },
		formatDate: function (d) {
			return new Intl.DateTimeFormat ('de-DE', {day: 'numeric', month: 'long', year: 'numeric'}).format(d);
		},
		goTo: async function (wsid) {
			await this.$router.push ({name: 'workspace', params: {wsid: wsid}});
		},
	}
};


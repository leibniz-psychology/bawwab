import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';
import Workspace from '../workspace.js';

import '../component/application.js';

export default Vue.extend ({
	template: `<div class="workspace-list">
		<h2>{{ t('projects') }}</h2>
		<div class="actionbar" v-if="!disabled">
			<div class="left" style="max-width: 50em">
				<p>{{ t('description') }}</p>
			</div>
			<div class="right">
				<router-link class="btn low" :to="{name: 'workspaceImport'}"><i class="fas fa-file-import"></i> {{ t('import') }}</router-link>
				<action-button icon="plus-square" :f="createWorkspace" importance="high">{{ t('create') }}</action-button>
			</div>
		</div>
		<form class="filter">
		<!--<input type="search" id="filtersearch" v-model="filtertext">-->
		<div>
			<input type="radio" name="filter" value="mine" id="filtermine" v-model="filter">
			<label for="filtermine">{{ t('myprojects') }}</label>
		</div>
		<div>
			<input type="radio" name="filter" value="shared" id="filtershared" v-model="filter">
			<label for="filtershared">{{ t('sharedprojects') }}</label>
		</div>
		</form>
		<table class="workspaces pure-table pure-table-striped pure-table-horizontal" v-if="filteredWorkspaces.length > 0">
		<thead>
			<tr>
				<th class="title">{{ t('thtitle') }}</th>
				<th class="description">{{ t('thdescription') }}</th>
				<th class="actions">{{ t('thactions') }}</th>
			</tr>
		</thead>
		<tbody>
		<tr v-for="w in filteredWorkspaces" :key="w.metadata._id">
			<td class="title">
				<router-link :to="{name: 'workspace', params: {wsid: w.metadata._id}}">
					<span v-if="w.metadata.name">{{ w.metadata.name }}</span>
					<span v-else class="placeholder">{{ t('unnamed') }}</span>
				</router-link>
			</td>
			<td class="description">
				<router-link :to="{name: 'workspace', params: {wsid: w.metadata._id}}">
					<span v-if="w.metadata.description">{{ w.metadata.description }}</span>
					<span v-else>&nbsp;</span>
				</router-link>
			</td>
			<td class="actions">
				<ul>
					<li v-for="a in w.runnableApplications ()" :key="a._id">
						<router-link :to="{name: 'application', params: {wsid: w.metadata._id, appid: a._id}}">
							<application-icon :workspace="w" :application="a" height="1.5em"></application-icon>
						</router-link>
					</li>
				</ul>
			</td>
		</tr>
		</tbody>
		</table>
	</div>`,
	data: _ => ({
		state: store.state,
		name: '',
		filter: 'mine',
		filtertext: '',
		strings: translations({
			de: {
				'projects': 'Projekte',
				'description': 'Hier können Projekte eingerichtet und aufgerufen werden. Projekte sind Sammlungen von Analyseskripten, Daten und anderen Materialien.',
				'projectname': 'Projektname',
				'create': 'Neues Projekt',
				'unnamed': 'Unbenanntes Projekt',
				'myprojects': 'Meine Projekte',
				'sharedprojects': 'Geteilte Projekte',
				'thtitle': 'Titel',
				'thdescription': 'Beschreibung',
				'thactions': 'Aktionen',
				'import': 'Projekt importieren',
				},
			en: {
				'projects': 'Projects',
				'description': 'Projects can be set up and accessed here. Projects are collections of analysis scripts, data, and other materials.',
				'projectname': 'Project name',
				'create': 'New project',
				'unnamed': 'Unnamed project',
				'myprojects': 'My projects',
				'sharedprojects': 'Shared projects',
				'thtitle': 'Title',
				'thdescription': 'Description',
				'thactions': 'Actions',
				'import': 'Import project',
				},
			}),
		}),
	mixins: [i18nMixin],
	computed: {
		disabled: function() { return !this.state.workspaces; },
		filteredWorkspaces: function () {
			const filterFunc = {
				mine: w => w.canShare (),
				shared: w => !w.canShare(),
				};
			const searchFunc = function (w) {
				const s = this.filtertext;
				if (s) {
					const sl = s.toLowerCase ();
					const searchFields = ['name', 'description'];
					return searchFields.reduce ((last, name) => last || w.metadata[name].toLowerCase().indexOf (sl) != -1, false);
				} else {
					return true;
				}
			}.bind (this);
			if (!this.disabled) {
				const f = w => [filterFunc[this.filter], searchFunc].reduce ((last, f) => last && f(w), true)
				return this.state.workspaces.all().filter (f).sort (Workspace.compareName);
			} else {
				return [];
			}},
	},
	methods: {
        createWorkspace: async function() {
			const w = await this.state.workspaces.create (this.name);
			this.$router.push ({name: 'workspace', params: {wsid: w.metadata._id}});
        },
		formatDate: function (d) {
			return new Intl.DateTimeFormat ('de-DE', {day: 'numeric', month: 'long', year: 'numeric'}).format(d);
		},
		goTo(wsid) {
			this.$router.push ({name: 'workspace', params: {wsid: wsid}});
		}
	}
});


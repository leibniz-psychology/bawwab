import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';
import { queryParamProp } from '../utils.js';
import Workspace from '../workspace.js';
import { copy } from "../workspaceUtil";

export default {
	name: 'WorkspaceListView',
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
		<div>
			<input type="radio" name="filter" value="world" id="filterworld" v-model="filter">
			<label for="filterworld">{{ t('publicprojects') }}</label>
		</div>
		</form>
		<table class="workspaces pure-table pure-table-striped pure-table-horizontal" v-if="filteredWorkspaces.length > 0">
		<thead>
			<tr>
				<th class="title">{{ t('thtitle') }}</th>
				<th class="description">{{ t('thdescription') }}</th>
				<th class="applications">{{ t('thapplications') }}</th>
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
			<td class="applications">
				<ul>
					<li v-for="a in w.runnableApplications (username)" :key="a._id">
						<router-link :to="{name: 'application', params: {wsid: w.metadata._id, appid: a._id}}">
							<application-icon :workspace="w" :application="a" height="1.5em"></application-icon>
						</router-link>
					</li>
				</ul>
			</td>
			<td class="actions">
				<ul class="actions-container" v-if="w.getPermissions (this.username)[0].canShare ()">
					<li class="action-container">
						<router-link class="action-button btn small" :to="{name: 'workspaceShare', params: {wsid: w.metadata._id}}" aria-label="share"><i class="fas fa-share"></i></router-link>
						<span class="action-tooltip popup">{{ t('share') }}</span>
					</li>
					<li class="action-container">
						<action-button class="action-button btn small" icon="copy" :f="() => copy(w)" aria-label="copy"></action-button>
						<span class="action-tooltip popup">{{ t('copy') }}</span>
					</li>
					<li class="action-container">
						<router-link class="action-button btn small" :to="{name: 'workspaceDelete', params: {wsid: w.metadata._id}}" aria-label="delete"><i class="fas fa-trash"></i></router-link>
						<span class="action-tooltip popup">{{ t('delete') }}</span>
					</li>
					<li><dropdown>
						<template v-slot:button>
							<i class="btn small fas fa-ellipsis-h"></i>
						</template>
						<template v-slot:default>
							<ul>
								<li><router-link class="btn small" :to="{name: 'workspacePublish', params: {wsid: w.metadata._id}}">
									<i class="fas fa-globe"></i> {{ t('publish') }}
								</router-link></li>
								<li><router-link class="btn small" :to="{name: 'workspaceExport', params: {wsid: w.metadata._id}}">
									<i class="fas fa-file-export"></i> {{ t('export') }}
								</router-link></li>
								<li><router-link class="btn small" :to="{name: 'workspacePackages', params: {wsid: w.metadata._id}}">
									<i class="fas fa-box"></i> {{ t('manage') }}
								</router-link></li>
							</ul>
						</template>
					</dropdown></li>
				</ul>
			</td>
		</tr>
		</tbody>
		</table>
	</div>`,
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


import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

import '../component/application.js';

export default Vue.extend ({
	props: ['wsid'],
	template: `<div>
		<div class="workspaceItem" v-if="workspace">
		<div class="actionbar">
		<ul class="left">
			<li><router-link :to="{name: 'workspaces'}">{{ t('back') }}</router-link></li>
		</ul>
		<ul class="right">
			<li v-if="editable"><action-button icon="save" :f="save" importance="high">{{ t('save') }}</action-button></li>
			<li v-if="editable"><action-button icon="window-close" :f="discard" importance="low">{{ t('cancel') }}</action-button></li>
			<li v-if="!editable && workspace.canWrite ()"><action-button icon="edit" :f="makeTitleEditable" importance="medium">{{ t('edit') }}</action-button></li>
			<li><router-link class="btn" v-if="workspace.canRun ()" :to="{name: 'workspacePackages', params: {wsid: workspace.metadata._id}}"><i class="fas fa-box"></i> {{ t('editpackages') }}</router-link></li>
			<li><router-link class="btn" v-if="workspace.canShare ()" :to="{name: 'workspaceShare', params: {wsid: workspace.metadata._id}}"><i class="fas fa-share"></i> {{ t('share') }}</router-link></li>
			<li><router-link class="btn" v-if="workspace.canRead ()" :to="{name: 'workspaceExport', params: {wsid: workspace.metadata._id}}"><i class="fas fa-file-export"></i> {{ t('export') }}</router-link></li>
			<li><action-button v-if="workspace.canRead()" icon="copy" :f="copy">{{ t('copy') }}</action-button></li>
			<li><router-link class="btn low" :to="{name: 'workspaceDelete', params: {wsid: workspace.metadata._id}}"><i class="fas fa-trash"></i> {{ workspace.canDelete() ? t('delete') : t('hide') }}</router-link></li>
		</ul>
		</div>

		<h3 class="title">
			<input type="text" v-if="editable" :placeholder="t('projectname')" :value="name">
			<span v-else-if="hasName" v-text="name"></span>
			<span v-else class="placeholder" @click="makeTitleEditable">{{ t('noTitle') }}</span>
		</h3>

		<ul class="metadata">
			<li class="owners">
				<i class="fa fa-user"></i>
				{{ t('ownedby') }}
				{{ workspace.owner () }}
			</li>
			<li v-if="sharedWith.length > 0" class="shared">
			<i class="fa fa-users"></i>
			{{ t('sharedwith') }}
			<ul>
				<li v-for="[k, v] of sharedWith">
				{{ k }} ({{ permissionsToHuman (v) }})
				<action-button v-if="workspace.canShare()" icon="trash" :f="_ => deleteShare (k)" importance="small"></action-button>
				</li>
			</ul>
			</li>
		</ul>

		<p class="description">
			<textarea v-if="editable" :placeholder="t('projectdescription')" v-text="description"></textarea>
			<span v-else-if="hasDescription" v-text="description"></span>
			<span v-else class="placeholder" @click="makeDescriptionEditable">{{ t('noDescription') }}</span>
		</p>

		<div class="applications">
	<application-item
		v-for="a in workspace.runnableApplications()"
		:application="a"
		:workspace="workspace"
		:key="a._id"></application-item>
	</div>
	</div>
		<p v-else>{{ t('nonexistent') }}</p></div>`,
	data: _ => ({
		state: store.state,
		editable: false,
		strings: translations({
			de: {
				'nonexistent': 'Projekt existiert nicht.',
				'copyname': 'Kopie von %{name}', /* name after copying a project */
				'save': 'Speichern',
				'cancel': 'Verwerfen',
				'edit': 'Bearbeiten',
				'share': 'Teilen',
				'export': 'Exportieren',
				'copy': 'Kopieren',
				'delete': 'Löschen',
				'hide': 'Verbergen',
				'back': 'Zurück zur Übersicht',
				'projectname': 'Name des Projekts',
				'sharedwith': 'Geteilt mit Gruppen',
				'ownedby': 'Gehört',
				'projectdescription': 'Beschreibung des Projekts',
				'readonly': 'nur Lesen',
				'readwrite': 'Lesen und Schreiben',
				'noaccess': 'kein Zugriff',
				'noTitle': 'Klicken, um einen Titel hinzuzufügen',
				'noDescription': 'Klicken, um eine Beschreibung hinzuzufügen.',
				'editpackages': 'Pakete verwalten',
				},
			en: {
				'nonexistent': 'Project does not exist.',
				'copyname': 'Copy of %{name}', /* name after copying a project */
				'save': 'Save',
				'cancel': 'Cancel',
				'edit': 'Edit',
				'share': 'Share',
				'export': 'Export',
				'copy': 'Copy',
				'delete': 'Delete',
				'hide': 'Hide',
				'back': 'Back to projects',
				'projectname': 'Name of the project',
				'sharedwith': 'Shared with',
				'ownedby': 'Owned by',
				'projectdescription': 'Description of the project',
				'readonly': 'read-only',
				'readwrite': 'read and write',
				'noaccess': 'no access',
				'noTitle': 'Click to add a title',
				'noDescription': 'Click to add a description.',
				'editpackages': 'Manage packages',
				},
			}),
	}),
	mixins: [i18nMixin],
	computed: {
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		name: function () { return this.workspace.metadata.name },
		hasName: function () { return this.editable || this.workspace.metadata.name },
		description: function () { return this.workspace.metadata.description },
		hasDescription: function () { return this.editable || this.workspace.metadata.description },
		sharedWith: function () { return Object.entries (this.workspace.permissions).filter (([k, v]) => (!v.includes ('t'))) },

	},
	methods: {
        save: async function () {
			const name = this.$el.querySelector ('.title input').value;
			const description = this.$el.querySelector ('.description textarea').value;
			const w = this.workspace;

			Vue.set (w.metadata, 'name', name);
			Vue.set (w.metadata, 'description', description);
            await this.workspaces.update (w);

			this.editable = false;
		},
		deleteShare: async function (group) {
			await this.workspaces.unshare (this.workspace, group);
		},
		copy: async function () {
			const newws = await this.workspaces.copy (this.workspace);
			Vue.set (newws.metadata, 'name', this.t('copyname', {name: newws.metadata.name}));
            await this.workspaces.update (newws);
			/* then go there */
			this.$router.push ({name: 'workspace', params: {wsid: newws.metadata._id}});
		},
		makeEditable: async function (focus) {
			this.editable = true;
			if (focus) {
				/* make sure the elements are rendered */
				await Vue.nextTick ();
				console.log ('focus is', focus, this.$el, this.$el.querySelector (focus));
				this.$el.querySelector (focus).focus ();
			}
		},
		makeTitleEditable: function () {
			this.makeEditable('.title input');
		},
		makeDescriptionEditable: function () {
			this.makeEditable('.description textarea');
		},
		discard: async function () {
			this.editable = false;
		},
		permissionsToHuman: function (p) {
			const canRead = p.includes ('r');
			const canWrite = p.includes ('w');
			if (canRead && canWrite) {
				return this.t('readwrite');
			} else if (canRead) {
				return this.t('readonly');
			}
			return this.t('noaccess');
		},
	}
});


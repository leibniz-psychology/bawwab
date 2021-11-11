import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';
import { nextTick } from 'vue/dist/vue.esm-bundler.js';
import { copy } from "../workspaceUtil";
import { Settings } from '../settings';

export default {
	name: 'WorkspaceShowView',
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
			<li v-if="!editable && canEditMeta"><action-button icon="edit" :f="makeTitleEditable" importance="medium">{{ t('edit') }}</action-button></li>
			<li><router-link class="btn" v-if="permissions.canRun ()" :to="{name: 'workspacePackages', params: {wsid: workspace.metadata._id}}"><i class="fas fa-box"></i> {{ t('editpackages') }}</router-link></li>
			<li><router-link class="btn" v-if="permissions.canShare ()" :to="{name: 'workspaceShare', params: {wsid: workspace.metadata._id}}"><i class="fas fa-share"></i> {{ t('share') }}</router-link></li>
			<li><router-link class="btn" v-if="permissions.canShare ()" :to="{name: 'workspacePublish', params: {wsid: workspace.metadata._id}}"><i class="fas fa-globe"></i> {{ t('publish') }}</router-link></li>
			<li><router-link class="btn" v-if="permissions.canRead ()" :to="{name: 'workspaceExport', params: {wsid: workspace.metadata._id}}"><i class="fas fa-file-export"></i> {{ t('export') }}</router-link></li>
			<li><action-button v-if="permissions.canRead()" icon="copy" :f="copy" class="copy">{{ t('copy') }}</action-button></li>
			<li><router-link class="btn low" :to="{name: 'workspaceDelete', params: {wsid: workspace.metadata._id}}"><i class="fas fa-trash"></i> {{ permissions.canDelete() ? t('delete') : t('hide') }}</router-link></li>
		</ul>
		</div>

		<h3 class="title">
			<input type="text" v-if="editable" :placeholder="t('projectname')" :value="name">
			<span v-else-if="hasName" v-text="name"></span>
			<span v-else-if="canEditMeta" class="placeholder" @click="makeTitleEditable">{{ t('noTitle') }}</span>
		</h3>

		<ul class="metadata">
			<li class="owners" v-if="owners.length > 0">
				<i class="fa fa-user"></i>
				{{ t('ownedby') }}
				<span v-for="o of owners">
					{{ o }}
				</span>
			</li>
			<li v-if="sharedWith.length > 0" class="shared">
			<i class="fa fa-users"></i>
			{{ t('sharedwith') }}
			<ul>
				<li v-for="[k, v] of sharedWith">
				{{ k }} ({{ permissionsToHuman (v) }})
				<action-button v-if="permissions.canShare()" icon="trash" :f="_ => deleteShare (k)" importance="small"></action-button>
				</li>
			</ul>
			</li>

			<li v-if="workspace.isPublic" class="public">
			<i class="fa fa-globe"></i>
			{{ t('publicproject') }}
			</li>
		</ul>

		<p class="description">
			<textarea v-if="editable" :placeholder="t('projectdescription')" v-text="description"></textarea>
			<span v-else-if="hasDescription" v-text="description"></span>
			<span v-else-if="canEditMeta" class="placeholder" @click="makeDescriptionEditable">{{ t('noDescription') }}</span>
		</p>

		<div class="applications">
	<application-item
		v-for="a in workspace.runnableApplications(username)"
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
				'publish': 'Veröffentlichen',
				'export': 'Exportieren',
				'copy': 'Kopieren',
				'delete': 'Löschen',
				'hide': 'Verbergen',
				'back': 'Zurück zur Übersicht',
				'projectname': 'Name des Projekts',
				'sharedwith': 'Geteilt mit Gruppen',
				'publicproject': 'Öffentliches Projekt',
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
				'publish': 'Publish',
				'export': 'Export',
				'copy': 'Copy',
				'delete': 'Delete',
				'hide': 'Hide',
				'back': 'Back to projects',
				'projectname': 'Name of the project',
				'sharedwith': 'Shared with',
				'publicproject': 'Public project',
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
	mounted: async function () {
		if (!this.workspace || this.isOwnWorkspace) {
			return;
		}

		const firstVisit = !this.settings.get(this.workspaceAlreadyVisitedKey);
		if (!firstVisit) {
			return;
		}

		//if user specified to skip the pop-up, his autocopy-setting is the only thing that still matters
		const dontShowPopUp = (this.isReadOnlyWorkspace && this.settings.get('dontShowSharedReadOnlyPopUp'))
			|| (!this.isReadOnlyWorkspace && this.settings.get('dontShowSharedWriteAccessPopUp'));
		if (dontShowPopUp) {
			const autocopy = this.settings.get('autocopySharedReadOnly');
			if (autocopy && this.isReadOnlyWorkspace) {
				/* click the button, so there will be visual feedback */
				const copyButton = this.$el.querySelector ('.actionbar .copy');
				copyButton.click ();
			}
			await this.setWorkspaceVisited();
		} else {
			await this.setWorkspaceVisited();
			await this.$router.push({ name: 'workspaceSecurityPrompt', params: { wsid: this.workspace.metadata._id } });
		}
	},
	computed: {
		settings: function () {
			return this.state.settings;
		},
		workspaces: function () { return this.state.workspaces; },
		username: function () { return this.state.user?.name; },
		workspace: function () {
			return this.workspaces?.getById (this.wsid);
		},
		isOwnWorkspace: function () { return this.workspace.owner().includes(this.username) },
		permissions: function () {
			return this.workspace?.getPermissions (this.username)[0];
		},
		name: function () { return this.workspace.metadata.name },
		hasName: function () { return this.editable || this.workspace.metadata.name },
		description: function () { return this.workspace.metadata.description },
		hasDescription: function () { return this.editable || this.workspace.metadata.description },
		/* owners without us */
		owners: function () { return this.workspace.owner ().filter (name => name != this.username); },
		/* XXX: this is accidentally quadratic, assuming username==groupname */
		sharedWith: function () { return Object.entries (this.workspace.permissions.group).filter (([k, v]) => this.owners.indexOf (k) == -1 && k != this.username) },
		/* user can edit project metadata */
		canEditMeta: function () { return this.permissions.canWrite (); },
		isReadOnlyWorkspace: function () { return !this.permissions.canWrite(); },
		workspaceAlreadyVisitedKey: function () { return `alreadyVisited${this.workspace.metadata._id}`; }
	},
	methods: {
		setWorkspaceVisited: async function () {
			this.settings.set (this.workspaceAlreadyVisitedKey, true);
			await this.settings.sync();
		},
		save: async function () {
			const name = this.$el.querySelector ('.title input').value;
			const description = this.$el.querySelector ('.description textarea').value;
			const w = this.workspace;

			w.metadata.name = name;
			w.metadata.description = description;
			await this.workspaces.update (w);

			this.editable = false;
		},
		deleteShare: async function (group) {
			await this.workspaces.unshare (this.workspace, `g:${group}`);
		},
		copy,
		makeEditable: async function (focus) {
			if (!this.canEditMeta) {
				return;
			}
			this.editable = true;
			if (focus) {
				/* make sure the elements are rendered */
				await nextTick ();
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
			const canRead = p.canRead ();
			const canWrite = p.canWrite ();
			if (canRead && canWrite) {
				return this.t('readwrite');
			} else if (canRead) {
				return this.t('readonly');
			}
			return this.t('noaccess');
		},
	}
};


import { translations, i18nMixin } from '../../i18n.js';
import { store } from '../../app.js';
import { nextTick } from 'vue/dist/vue.esm-bundler.js';
import { copy } from "../../workspaceUtil";
import { Settings } from '../../settings';
import template from './template.html';

export default {
	name: 'WorkspaceShowView',
	props: ['wsid'],
	template: template,
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

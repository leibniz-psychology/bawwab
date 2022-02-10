import { store } from '../../app.js';
import { queryParamProp, CancelledError } from '../../utils.js';
import { BorgErrorNonexistent } from '../../borg.js';
import { nextTick } from 'vue/dist/vue.esm-bundler.js';
import NaturalAgoComponent from '../naturalAgo';
import ChangeProxy from '../../changeProxy.js';
import template from './template.html';
import './style.css';

export default {
	name: 'WorkspaceVersion',
	props: ['wsid'],
	data: _ => ({
		state: store.state,
		cancel: null,
		/* name of the backup that is currently editable */
		editable: [],
		/* input models */
		newName: {},
		newComment: {},
		/* name of the backup to highlight */
		highlight: null,
		selected: [],
		selectAll: false,
	}),
	template: template,
	components: {
		'ago': NaturalAgoComponent,
	},
	created: async function () {
		await this.state.ready.wait ();
		await this.state.borg.list (this.workspace);
	},
	computed: {
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		repository: function () { return this.state.borg.get (this.workspace.path); },
		nonexistent: function () { return this.repository instanceof BorgErrorNonexistent; },
		archivesMap: function () {
			if (!this.repository || this.repository instanceof Error) {
				return this.repository;
			} else {
				const m = new Map ();
				this.repository.archives.forEach (function (v, k) {
					m.set (k, new ChangeProxy (v));
				});
				return m;
			}
		},
		archives: function () {
			if (!this.archivesMap || this.archivesMap instanceof Error) {
				return this.archivesMap;
			} else {
				const v = Array.from (this.archivesMap.values ());
				/* Sort by date, latest one first */
				v.sort ((a, b) => a.date > b.date ? -1 : 1);
				return v;
			}
		},
		noElementSelected: function () {
			return !(this.selected.length > 0 && this.editable.length == 0);
		},
		restoreDisabled: function () {
			return !(this.selected.length == 1 && this.editable.length == 0);
		},
	},
	methods: {
		renameAuto: function (s, empty=false) {
			if (s.startsWith ('auto-')) {
				return this.$t('c.workspaceVersion.autogenerated');
			} else if (s.startsWith ('manual-')) {
				return this.$t('c.workspaceVersion.manual');
			} else {
				return s;
			}
		},
		makeEditable: async function (newname) {
			/* Must be a copy, so selection does not change editability */
			this.editable = Array.from (this.selected);
		},
		versionFromName: function (name) {
			return this.archivesMap.get (name);
		},
		rename: async function () {
			const changed = [];
			for (const n of this.editable) {
				const v = this.versionFromName (n);
				if (!v) {
					continue;
				}
				changed.push (v);
			}
			/* As soon as we start editing, archivesMap is updated and returns new Proxy objects with old values. So we have to save all modified BorgArchive objects first and then apply the changes. Urgh. */
			for (const v of changed) {
				/* first change the comment, then the name. Otherwise we have to remember to use the new name. */
				if (v.comment != v._.comment) {
					await this.state.borg.changeComment (this.workspace, v._, v.comment);
				}
				if (v.name != v._.name) {
					await this.state.borg.rename (this.workspace, v._, v.name);
				}
				/* The change is applied to the model by the repo operations above */
				v.reset ();
			}
			this.editable = [];
			this.selected = [];
			this.highlight = null;
		},
		restoreSelected: async function () {
			const restoreName = this.selected[0];
			await this.state.borg.extract (this.workspace, this.versionFromName (restoreName));
			this.selected = [];
			this.highlight = restoreName;
		},
		/* We cannot call this method “delete” for some reason. It will
		 * behave weirdly. Maybe it collides with some builtin? */
		removeSelected: async function () {
			await this.state.borg.delete (this.workspace, this.selected.map (this.versionFromName));
			this.editable = [];
			this.selected = [];
			this.highlight = null;
		},
	},
	watch: {
		selectAll: function () {
			if (this.selectAll) {
				this.selected = this.archives.map (v => v.name);
			} else {
				this.selected = [];
			}
		},
	},
};


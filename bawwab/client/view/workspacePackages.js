import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

import '../component/spinner.js';
import '../component/modal.js';

export default Vue.extend ({
	props: ['wsid'],
	data: _ => ({
		searching: false,
		searchId: null,
		/* Package state cache, list of {p: <package>, state: <state>} */
		packages: [],
		packageFilter: ['installed', 'add', 'remove'],
		/* Currently applying changes */
		busy: false,
		strings: translations ({
			de: {
				'apply': [
					[0, 0, 'Keine Änderungen'],
					[1, 1, '%n Änderung anwenden'],
					[2, null, '%n Änderungen anwenden'],
					],
				'undo': 'Rückgängig',
				'packageStateInstalled': 'Installiert',
				'packageStateAdd': 'Wird hinzugefügt',
				'packageStateRemove': 'Wird entfernt',
				'removePackage': 'Entfernen',
				'addPackage': 'Installieren',
				'searchPackage': 'Paket suchen',
				'upgrade': 'Alle Pakete aktualisieren',
				'cancel': 'Abbrechen',
				'title': 'Pakete verwalten',
				'nopackages': 'Keine Pakete gefunden',
				},
			en: {
				'apply': [
					[0, 0, 'No changes'],
					[1, 1, 'Apply %n change'],
					[2, null, 'Apply %n changes'],
					],
				'undo': 'Undo',
				'packageStateInstalled': 'Installed',
				'packageStateAdd': 'Will be added',
				'packageStateRemove': 'Will be removed',
				'removePackage': 'Remove',
				'addPackage': 'Install',
				'searchPackage': 'Search package',
				'upgrade': 'Upgrade all packages',
				'cancel': 'Cancel',
				'title': 'Manage packages',
				'nopackages': 'No packages found',
				},
			}),
	}),
	mixins: [i18nMixin],
    template: `<modal :title="t('title')" :closeName="t('back')" icon="box" :closeName="t('cancel')" :closeLink="{name: 'workspace', params: {wsid: workspace.metadata._id}}" :scaling="false">
		<div class="packageSearch">
			<input type="search" :placeholder="t('searchPackage')" :disabled="busy" v-model="search">
			<spinner v-show="searching"></spinner>
		</div>
		<div class="packages" v-if="filteredPackages.length > 0">
			<div v-for="ps of filteredPackages" class="package">
				<div class="left">
				<p><strong class="name">{{ ps.p.name }}</strong> <small class="version">{{ ps.p.version }}</small></p>
				<p class="state">
					<span v-if="ps.state.add">{{ t('packageStateAdd') }}</span>
					<span v-else-if="ps.state.remove">{{ t('packageStateRemove') }}</span>
					<span v-else-if="ps.state.installed">{{ t('packageStateInstalled') }}</span>
					<action-button v-if="ps.state.add || ps.state.remove" icon="undo" :disabled="busy" :f="_ => undoPackageAction(ps)">{{ t('undo') }}</action-button>
				</p>
				<p v-if="ps.p.synopsis">{{ ps.p.synopsis }}</p>
				</div>
				<div class="right">
				<action-button v-if="!ps.state.installed && !ps.state.add" icon="plus" :disabled="busy" :f="_ => addPackage(ps)">{{ t('addPackage') }}</action-button>
				<action-button v-if="ps.state.installed && !ps.state.remove" icon="trash" :disabled="busy" :f="_ => removePackage(ps)">{{ t('removePackage') }}</action-button>
				</div>
			</div>
		</div>
		<p v-else>{{ t('nopackages') }}</p>
	<template v-slot:buttons>
		<action-button icon="check" :f="doPackageModify" :disabled="!haveModifications" :importance="haveModifications ? 'high' : 'low'">{{ t('apply', packageTransforms.length) }}</action-button>
		<action-button icon="sync" :f="doPackageUpgrade" :disabled="busy" importance="medium">{{ t('upgrade') }}</action-button>
	</template>
</modal>`,
	computed: {
		haveModifications: function () { return this.packageTransforms.length > 0; },
		filteredPackages: function () {
			function compare (a, b) {
				/* changed packages at the top */
				if ((a.state.add || a.state.remove) && !(b.state.add || b.state.remove)) {
					return -1;
				} else if (!(a.state.add || a.state.remove) && (b.state.add || b.state.remove)) {
					return 1;
				} else {
					/* if there’s a relevance score, sort by it */
					if (a.p.relevance && b.p.relevance) {
						return b.p.relevance - a.p.relelance;
					} else {
						return a.p.name.localeCompare (b.p.name);
					}
				}
			}
			return this.packages.filter (ps => this.packageFilter.reduce ((accum, f) => accum || ps.state[f], false)).sort (compare);
		},
		packageTransforms: function() {
			return this.packages.reduce (function (accum, ps) {
				const ret = [];
				if (ps.state.remove) {
					ret.push ('-' + ps.p.name);
				} else if (ps.state.add) {
					ret.push ('+' + ps.p.name);
				}
				return accum.concat (ret);
			}, []);
		},
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		/* inspired by https://stackoverflow.com/a/60786867 */
		search: {
			get () {
				return this.$route.query.search;
			},
			set (value) {
				this.$router.replace ({
					query: {
						...this.$route.query,
						search: value
					}
				});
				this.runSearch ();
			}
		},
	},
    methods: {
		doPackageUpgrade: async function () {
			this.busy = true;
			try {
				await this.state.workspaces.packageUpgrade (this.workspace);
				this.$router.push ({name: 'workspace', params: {wsid: this.workspace.metadata._id}});
			} finally {
				this.busy = false;
			}
			this.packageFilter = ['installed', 'add', 'remove'];
			this.search = '';
		},
		doPackageModify: async function () {
			this.busy = true;
			try {
				await this.state.workspaces.packageModify (this.workspace, this.packageTransforms);
				this.$router.push ({name: 'workspace', params: {wsid: this.workspace.metadata._id}});
			} finally {
				this.busy = false;
			}
			this.packageFilter = ['installed', 'add', 'remove'];
			this.search = '';
		},
		addPackage: function (ps) {
			if (!ps.state.installed) {
				ps.state.add = true;
			}
			ps.state.remove = false;
		},
		removePackage: function (ps) {
			if (ps.state.installed) {
				ps.state.remove = true;
			}
			ps.state.add = false;
		},
		undoPackageAction: function (ps) {
			ps.state.add = false;
			ps.state.remove = false;
		},
		mergePackageList (l, state) {
			for (const p of l) {
				/* XXX: match version too? */
				const ps = this.packages.find (ps => ps.p.name == p.name);
				if (!ps) {
					const s = Object.assign ({installed: false, add: false, remove: false, fromSearch: false}, state);
					this.packages.push ({state: s, p: p});
				} else {
					Object.assign (ps.state, state);
					Object.assign (ps.p, p);
				}
			}
		},
		runSearch: function () {
			const minSearchLen = 3;
			const debounceMs = 350;
			if (this.search.length >= minSearchLen) {
				if (this.searchId) {
					window.clearTimeout (this.searchId);
					this.searchId = null;
				}
				/* simple debounce */
				this.searchId = window.setTimeout (function () {
					/* we cannot cancel search, so store the expression and compare it later */
					const searchFor = this.search;
					this.searching = true;
					this.packages.map (function (ps) { ps.state.fromSearch = false });
					this.state.workspaces.packageSearch (this.workspace, this.search)
						.then (function (ret) {
							/* only apply changes if the expression is still
							 * the same, otherwise forget results */
							console.log ('got packages', ret);
							if (this.search == searchFor) {
								this.mergePackageList (ret, {fromSearch: true});
								this.packageFilter = ['fromSearch'];
								this.searching = false;
							}
						}.bind (this));
				}.bind (this), debounceMs);
			} else {
				this.packageFilter = ['installed', 'add', 'remove'];
				this.packages.map (function (ps) { ps.state.fromSearch = false });
			}
		},

    },
	created: function () {
		console.log ('updating package cache');
		this.packages = [];
		this.mergePackageList (this.workspace.packages, {installed: true});
		this.runSearch ();
	},
	watch: {
		workspace: function () {
			/* reset package view */
			console.log ('updating package cache');
			this.packages = [];
			this.mergePackageList (this.workspace.packages, {installed: true});
		},
	}
});


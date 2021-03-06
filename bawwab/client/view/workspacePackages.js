import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';
import { queryParamProp, CancelledError } from '../utils.js';

export default {
	name: 'WorkspacePackagesView',
	props: ['wsid'],
	data: _ => ({
		state: store.state,
		cancel: null,
		searching: false,
		searchId: null,
		/* Package state cache, list of {p: <package>, state: <state>} */
		packages: [],
		packageFilter: ['installed', 'add', 'remove'],
		defaultPackageFilter: ['add', 'remove'],
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
				'close': 'Schließen',
				'title': 'Pakete verwalten',
				'nopackages': 'Keine Pakete gefunden',
				'description': 'Hier können Pakete zum Projekt hinzugefügt werden. Um das R-Paket <em>beispiel</em> zu suchen, verwende <kbd>^r-beispiel</kbd>.',
				'searchFailed': 'Die Suche ist fehlgeschlagen. Bitte versuche es erneut.',
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
				'close': 'Close',
				'title': 'Manage packages',
				'nopackages': 'No packages found',
				'description': 'Here you can add packages to your project. Use <kbd>^r-package</kbd> to search for R packages only.',
				'searchFailed': 'The search failed. Please try again.',
				},
			}),
	}),
	mixins: [i18nMixin],
    template: `<modal :title="t('title')" icon="box" :closeName="t('close')" :closeLink="{name: 'workspace', params: {wsid: workspace.metadata._id}}" :scaling="false">
		<p v-html="t('description')"></p>
		<div class="packageSearch">
			<input type="search" :placeholder="t('searchPackage')" :disabled="busy" v-model="search">
		</div>
		<p v-if="searchFailed">{{ t('searchFailed') }}</p>
		<p v-else-if="searching === true"><spinner></spinner></p>
		<div class="packages" v-else-if="filteredPackages.length > 0">
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
				<!-- Package removal is disabled by request. -->
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
	beforeRouteLeave: async function (to, from) {
		if (this.cancel) {
			this.cancel (new CancelledError ());
		}
		return true;
	},
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
		search: queryParamProp ('search', ''),
		searchFailed: function () { return this.searching instanceof Error },
	},
    methods: {
		doPackageUpgrade: async function () {
			this.busy = true;
			try {
				await this.state.workspaces.packageUpgrade (this.workspace);
			} finally {
				this.busy = false;
			}
			this.packageFilter = this.defaultPackageFilter;
			this.search = '';
		},
		doPackageModify: async function () {
			let cancelled = false;
			this.busy = true;
			try {
				/* Make the promise “cancellable”, although packageModify is
				 * not really cancelled, we just ignore its results. */
				await Promise.race ([
						this.state.workspaces.packageModify (this.workspace, this.packageTransforms),
						new Promise (function (resolve, reject) { this.cancel = reject }.bind (this))]);
				await this.$router.push ({name: 'workspace', params: {wsid: this.workspace.metadata._id}});
			} catch (e) {
				if (e instanceof CancelledError) {
					cancelled = true;
				} else {
					/* pass */
				}
			} finally {
				this.busy = false;
				this.cancel = null;
			}
			if (!cancelled) {
				this.packageFilter = this.defaultPackageFilter;
				/* this must be conditional, since it modifies the route and
				 * cancellation also modifies the route */
				this.search = '';
			}
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
		queueSearch: function (debounceMs=350) {
			const minSearchLen = 3;
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
					this.state.workspaces.packageSearch (this.workspace, this.search.split (' '))
						.then (function (ret) {
							/* only apply changes if the expression is still
							 * the same, otherwise forget results */
							console.debug ('got packages', ret);
							if (this.search == searchFor) {
								this.mergePackageList (ret, {fromSearch: true});
								this.packageFilter = ['fromSearch'];
								this.searching = false;
							}
						}.bind (this), function (e) {
							console.error ('search failed', e);
							if (this.search == searchFor) {
								this.searching = e;
							}
						}.bind (this));
				}.bind (this), debounceMs);
			} else {
				this.searching = false;
				this.packageFilter = this.defaultPackageFilter;
				this.packages.map (function (ps) { ps.state.fromSearch = false });
			}
		},

    },
	created: function () {
		console.debug ('updating package cache');
		this.packages = [];
		this.mergePackageList (this.workspace.packages, {installed: true});
		this.queueSearch (0);
	},
	watch: {
		workspace: function () {
			/* reset package view */
			console.debug ('updating package cache');
			this.packages = [];
			this.mergePackageList (this.workspace.packages, {installed: true});
		},
		search: function () {
			this.queueSearch ();
		},
	},
};


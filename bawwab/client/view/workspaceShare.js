import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

import '../component/spinner.js';
import '../component/modal.js';

export default Vue.extend ({
	props: ['wsid'],
	template: `<modal icon="users" :title="t('sharetitle')" :closeName="t('close')" :closeLink="{name: 'workspace', params: {wsid: workspace.metadata._id}}" :scaling="true">
			<select v-model="selectedShareUrl" name="shareKind" size="0">
			<option selected="selected" :value="false" class="read">{{ t('read') }}</option>
			<option :value="true" class="write">{{ t('write') }}</option>
			</select>
			<p>{{ shareMeaning }}</p>
			<div v-if="shareUrl[selectedShareUrl]">
				<label for="shareUrl">{{ t('sharelink') }}</label>
				<div class="textbutton">
					<input type="text" v-model="shareUrl[selectedShareUrl]" id="shareUrl" readonly="readonly">
					<action-button :f="_ => copyToClipboard(shareUrl[selectedShareUrl])" icon="copy" importance="high">{{ t('copy') }}</action-button>
				</div>
			</div>
			<spinner v-else></spinner>
		</modal>`,
	data: _ => ({
		state: store.state,

		/* share url for reading (false), writing (true) */
		shareUrl: {false: null, true: null},
		selectedShareUrl: false,

		strings: translations({
			de: {
				'cancel': 'Abbrechen',
				'sharetitle': 'Projekt teilen',
				'share': 'Teilen',
				'close': 'Schließen',
				'copy': 'Kopieren',
				'read': 'Nur Lesen',
				'readMeaning': 'Der Benutzer kann das Projekt nur kopieren.',
				'write': 'Schreibzugriff',
				'writeMeaning': 'Der Benutzer kann das Projekt kopieren, Anwendungen starten und alle Daten ändern oder löschen.',
				'sharelink': 'Teile den folgenden Link',
				},
			en: {
				'cancel': 'Cancel',
				'sharetitle': 'Share project',
				'share': 'Share',
				'close': 'Close',
				'copy': 'Copy',
				'read': 'Read-only',
				'readMeaning': 'The user can only copy this project.',
				'write': 'Write access',
				'writeMeaning': 'The user can copy the project, start applications and modify or delete all data.',
				'sharelink': 'Share the link below',
				},
			}),
	}),
	mixins: [i18nMixin],
	computed: {
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		shareMeaning: function () {
			if (!this.selectedShareUrl) {
				return this.t ('readMeaning');
			} else {
				return this.t ('writeMeaning');
			}
		}
	},
	created: async function() {
		/* async resolve both actions */
		const keys = [false, true];
		const values = await Promise.all (keys.map (function (isWrite) {
			return this.workspaces.shareAction (this.workspace, isWrite);
		}.bind (this)));
		for (let i = 0; i < keys.length; i++) {
			const isWrite = keys[i];
			const token = values[i];
			const ident = 'share-' + (isWrite ? 'write' : 'readonly');
			this.shareUrl[isWrite] = new URL (`/action/${token}#${ident}`, window.location.href);
		}
	},
	methods: {
		copyToClipboard: async function(text) {
			if (navigator.clipboard) {
				const ret = await navigator.clipboard.writeText (text);
				return true;
			} else {
				throw Error ('unsupported');
			}
		},
	}
});




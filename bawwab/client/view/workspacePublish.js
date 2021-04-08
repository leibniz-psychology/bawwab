import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

export default {
	props: ['wsid'],
	template: `<modal icon="globe" :title="t('title')" :closeName="t('cancel')" :closeLink="backRoute" :scaling="true">
			<p>{{ t('explain') }}</p>
			<template v-slot:buttons>
				<action-button v-if="!workspace.isPublic" icon="globe" :f="sharePublic" importance="high">{{ t('sharepublic') }}</action-button>
				<action-button v-else icon="globe" :f="unsharePublic" importance="high">{{ t('unsharepublic') }}</action-button>
			</template>
		</modal>`,
	data: _ => ({
		state: store.state,

		/* share url for reading (false), writing (true) */
		shareUrl: {false: null, true: null},
		selectedShareUrl: false,

		strings: translations({
			de: {
				'title': 'Projekt veröffentlichen',
				'cancel': 'Abbrechen',
				'explain': 'Öffentliche Projekte können von allen Nutzern kopiert werden. Die Veröffentlichung eines Projekts kann rückgängig gemacht werden, Kopien anderer Nutzer bleiben davon unberührt.',
				'sharepublic': 'Projekt veröffentlichen',
				'unsharepublic': 'Veröffentlichung widerrufen',
				},
			en: {
				'title': 'Publish project',
				'cancel': 'Cancel',
				'explain': 'Public projects can be copied by all users. It is possible to edit and retract published projects but copies made by other users will remain unaffected.',
				'sharepublic': 'Enable public access',
				'unsharepublic': 'Revoke public access',
				},
			}),
	}),
	mixins: [i18nMixin],
	computed: {
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		backRoute: function () { return {name: 'workspace', params: {wsid: this.workspace.metadata._id}}; },
	},
	methods: {
		sharePublic: async function () {
			await this.workspaces.share (this.workspace, 'o', false);
			this.$router.push (this.backRoute);
		},
		unsharePublic: async function () {
			await this.workspaces.unshare (this.workspace, 'o');
			this.$router.push (this.backRoute);
		},
	}
};


import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';
import { settingsProp } from '../utils.js';

export default {
	props: ['wsid'],
	template: `<modal icon="users" :title="title" :closeLink="{name: 'workspace', params: {wsid: workspace?.metadata._id}}" :scaling="true">
	<div class="share-prompt-info">
		<i class="fas fa-question-circle inline-icon"></i>
		<router-link class="info-link" :to="{name: 'faq'}">{{ t('explainLink') }}</router-link>
	</div>
	<div class="share-prompt-risks">
		<div class="share-prompt-warning">
			<i class="fas fa-exclamation-triangle inline-icon"></i>
			<span class="danger">{{ t('warning') }}</span>
		</div>
		<div class="more-information">{{ t('warningExplanation') }}</div>
	</div>
	<hr class="horizontal-ruler">
	<div class="share-prompt-options">
		<div class="share-prompt-checkboxes">
			<div v-if="isReadOnlyWorkspace">
				<input id="autocopy" type="checkbox" name="autocopy" v-model="autocopySharedReadOnly">
				<label for="autocopy" v-html="t('autoCopy')"></label>
			</div>
			<div v-if="isReadOnlyWorkspace">
				<input id="not-again" type="checkbox" name="not-again" v-model="dontShowSharedReadOnlyPopUp">
				<label for="not-again">{{ t('dontShowAgain') }}</label>
			</div>
			<div v-if="!isReadOnlyWorkspace">
				<input id="not-again" type="checkbox" name="not-again" v-model="dontShowSharedWriteAccessPopUp">
				<label for="not-again">{{ t('dontShowAgain') }}</label>
			</div>
		</div>
		<div>{{ t('changeSettingsNotice') }}</div>
	</div>
	<template v-slot:buttons>
		<action-button :f="saveSettings" importance="high">{{ t('saveSettings') }}</action-button>
	</template>
</modal>`,
	name: 'WorkspaceSecurityPromptView',
	data: _ => ({
		state: store.state,
		/* application strings */
		strings: translations({
			de: {
				'copyname': 'Kopie von %{name}', /* name after copying a project */
				'titleCopy': 'Jemand hat Kopierrechte für ein Projekt mit dir geteilt!',
				'titleWrite': 'Jemand hat Schreibrechte für ein Projekt mit dir geteilt!',
				'explainLink': 'Was heißt das?',
				'warning': 'Bitte nutze/kopiere dieses Projekt nur, wenn du die teilende Person kennst und ihr vertraust!',
				'warningExplanation': 'PsychNotebook kann technisch nicht sicherstellen, dass geteilte Projekte keinen Schadcode enthalten.',
				'autoCopy': 'Kopiere Projekte in Zukunft automatisch. Ich verstehe das Risiko und klicke nur noch auf Links vertrauenswürdiger Personen.',
				'dontShowAgain': 'Dieses Fenster in Zukunft nicht mehr zeigen!',
				'changeSettingsNotice': 'Falls Du hier festlegst, dass du dieses Fenster in Zukunft nicht mehr sehen möchtest, kannst du diese Einstellungen über dein Benutzerkonto später wieder ändern.',
				'saveSettings': 'OK', /* XXX: this is a terrible choice, use go to project or copy or … */
				'cancel': 'Schließen',
			},
			en: {
				'copyname': 'Copy of %{name}',
				'titleCopy': 'Someone shared copy access for a project with you!',
				'titleWrite': 'Someone shared write access for a project with you!',
				'explainLink': 'What does that mean?',
				'warning': 'Please only use/copy this project if you know and trust the person sharing it!',
				'warningExplanation': 'PsychNotebook cannot technically ensure that shared projects do not contain malicious code.',
				'autoCopy': 'Copy projects automatically in the future. I understand the risk and will only follow trustworthy links from now on.',
				'dontShowAgain': 'Do not show this window in the future!',
				'changeSettingsNotice': 'If you specify here that you do not want to see this window in the future, you can change these settings again later via your user account.',
				'saveSettings': 'OK',
				'cancel': 'Close',
			},
		}),
	}),
	computed: {
		title: function () {
			if (this.isReadOnlyWorkspace) {
				return this.t('titleCopy');
			} else {
				return this.t('titleWrite');
			}
		},
		username: function () { return this.state.user?.name; },
		/* Used by settingsProp() */
		settings: function () { return this.state.settings; },
		workspaces: function () { return this.state.workspaces; },
		workspace: function () { return this.workspaces ? this.workspaces.getById(this.wsid) : null; },
		isOwnWorkspace: function () { return this.workspace.owner().includes(this.username) },
		isReadOnlyWorkspace: function () { return !this.workspace.getPermissions(this.username)[0].canWrite(); },
		autocopySharedReadOnly: settingsProp ('autocopySharedReadOnly'),
		dontShowSharedReadOnlyPopUp: settingsProp ('dontShowSharedReadOnlyPopUp'),
		dontShowSharedWriteAccessPopUp: settingsProp ('dontShowSharedWriteAccessPopUp'),
	},
	methods: {
		saveSettings: async function () {
			if (this.isReadOnlyWorkspace && this.autocopySharedReadOnly) {
				await this.copyWorkspace();
				return;
			}
			await this.$router.push({ name: 'workspace', params: { wsid: this.workspace.metadata._id } });
		},
		copyWorkspace: async function () {
			const newws = await this.workspaces.copy(this.workspace);
			newws.metadata.name = this.t('copyname', { name: newws.metadata.name });
			await this.workspaces.update(newws);
			await this.$router.push({ name: 'workspace', params: { wsid: newws.metadata._id } });
		},
	},
	mixins: [i18nMixin],
};

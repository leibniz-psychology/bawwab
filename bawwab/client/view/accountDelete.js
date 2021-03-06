import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

export default {
	name: 'AccountDeleteView',
	template: `<modal icon="trash" :title="t('delete')" :closeName="t('cancel')" :closeLink="{name: 'account'}" :scaling="true">
	<p>{{ t('deletequestion') }}</p>
	<template v-slot:buttons>
		<action-button :f="deleteAccount" icon="trash" importance="high">{{ t('dodelete') }}</action-button>
	</template>
</modal>`,
	data: _ => ({
		state: store.state,
		/* application strings */
		strings: translations ({
			de: {
				'delete': 'Benutzerkonto löschen',
				'deletequestion': 'Möchtest Du Dein Benutzerkonto und alle gespeicherten Daten wirklich löschen? Die Aktion kann nicht rückgängig gemacht werden.',
				'dodelete': 'Unwiderruflich löschen',
				'cancel': 'Abbrechen',
				},
			en: {
				'headline': 'My account',
				'delete': 'Delete account',
				'deletequestion': 'Do you want to delete your account and all data? This cannot be undone.',
				'dodelete': 'Delete permanently',
				'cancel': 'Cancel',
				},
			}),
	}),
	methods: {
		deleteAccount: async function () {
			let r = await fetch ('/api/user', {
				'method': 'DELETE'
			});
			if (r.ok) {
				this.state.user = null;
				await this.state.session.destroy ();
				await this.$router.push ({name: 'index'});
			} else {
				console.error (r);
			}
		}
	},
	mixins: [i18nMixin],
};


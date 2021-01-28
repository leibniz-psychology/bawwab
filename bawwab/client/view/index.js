import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

export default Vue.extend ({
	template: `<div>
	<p>{{ t('description') }}</p>
	<p v-if="state.user === null">
		<a class="btn high" href="/api/session/login">{{ t('login') }}</a>
	</p>
	<p v-else-if="haveWorkspaces"><router-link class="btn high" :to="{name: 'workspaces'}">{{ t('toprojects') }}</router-link></p>
</div>`,
	data: _ => ({
		state: store.state,
		/* application strings */
		strings: translations ({
			de: {
				'description': 'PsychNotebook ist eine web-basierte Plattform für die Planung und Analyse von Studien aus dem Gebiet der Psychologie und verwandter Disziplinen.',
				'login': 'Anmelden',
				'toprojects': 'Zu meinen Projekten',
				},
			en: {
				'description': 'PsychNotebook is a web-based platform for planning and analyzing studies in the field of psychology and related disciplines.',
				'login': 'Login',
				'toprojects': 'Go to my projects',
				},
			}),
	}),
	computed: {
		haveWorkspaces: function () {
			return store.haveWorkspaces ();
		},
	},
	mixins: [i18nMixin],
});


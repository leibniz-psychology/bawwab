import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

export default {
	name: 'IndexView',
	template: `<div class="landingpage">
	<h2>{{ t('description') }}</h2>
	<div class="overview">
		<div class="left-photo">
		</div>
		<div class="mission" v-html="t('mission')">
		</div>
		<div class="features" v-html="t('features')">
		</div>
		<div class="right-photo">
		</div>
	</div>
	<p class="goto">
		<a v-if="state.user === null" class="btn high" href="/api/session/login">{{ t('login') }}</a>
		<router-link v-else-if="haveWorkspaces" class="btn high" :to="{name: 'workspaces'}">{{ t('toprojects') }}</router-link>
	</p>
</div>`,
	data: _ => ({
		state: store.state,
		/* application strings */
		strings: translations ({
			de: {
				'description': 'PsychNotebook ist eine Online-Plattform für die Planung und Analyse von Studien aus der Psychologie und verwandten Disziplinen.',
				'mission': `<h3>Unser Auftrag</h3>

<p>Wir wollen Dir Werkzeuge für Open Science (offene Wissenschaft) geben!</p>

<dl>
	<dt>Bildung</dt>
	<dd>Lehre und lerne, wie man geskriptete Analysen erstellt und versteht.</dd>
	<dt>Kollaboration</dt>
	<dd>Teile Deine Projekte öffentlich oder mit Deinen Kolleginnen/Kollegen.</dd>
	<dt>Reproduzierbarkeit</dt>
	<dd>Exportiere Dein Projekt mit allen Abhängigkeiten zur Archivierung.</dd>
</dl>`,
				'features': `<h3>Funktionen</h3>

<p>
Anmelden und direkt mit dem Programmieren beginnen – ohne Installation.<br>
Teile Deine Projekte – als Kopie oder zur Bearbeitung.<br>
Erstelle, kopiere und adaptiere öffentliche Projekte.<br>
Exportiere Dein Projekt reproduzierbar.
</p>`,
				'login': 'Anmelden',
				'toprojects': 'Zu meinen Projekten',
				},
			en: {
				'description': 'PsychNotebook is an online platform for planning and analyzing studies in psychology and related disciplines.',
				'mission': `<h3>Our mission</h3>

<p>Providing you with the tools to practice open science!</p>

<dl>
	<dt>Education</dt>
	<dd>Learn and instruct others on how to understand and create scripted analyses.</dd>
	<dt>Collaboration</dt>
	<dd>Share your projects with your peers or publicly.</dd>
	<dt>Reproducibility</dt>
	<dd>Export your project dependencies for archiving.</dd>
</dl>`,
				'features': `<h3>Features</h3>

<p>
Log in and start coding. No set up required.<br>
Share your projects – as a copy or for editing.<br>
Create, copy and adapt public projects.<br>
Export your project in a reproducible way.
</p>`,
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
};


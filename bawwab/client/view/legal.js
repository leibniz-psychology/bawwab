import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

/* XXX: we should do better and provide attribution to the main software
 * components we are using */
export default Vue.extend ({
	template: `<div>
	<h2>{{ t('headline') }}</h2>
	<h3 id="impressum">{{ t('imprint') }}</h3>
	<address><p>
	<strong>{{ t('instituteName') }}</strong><br>
	Universitätsring 15, 54296 Trier<br>
	Telefon: +49 (0)651 201-2877<br>
	Fax: +49 (0)651 201-2071<br>
	E-Mail: info(at)leibniz-psychology.org
	</p></address>
	<h3 id="softwarelizenzen">{{ t('softwareLicenses') }}</h3>
	<p v-html="t('softwareLicensesBody')"></p>
</div>`,
	data: _ => ({
		state: store.state,
		/* application strings */
		strings: translations ({
			de: {
				'headline': 'Rechtliche Informationen',
				'imprint': 'Impressum',
				'instituteName': 'Leibniz-Institut für Psychologie (ZPID)',
				'softwareLicenses': 'Softwarelizenzen',
				'softwareLicensesBody': 'Diese Plattform bietet Zugriff auf RStudio Server, welche unter den Bedingungen der <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">GNU Affero General Public License Version 3</a> zur Verfügung gestellt wird. Den Quelltext von RStudio Server findest Du <a href="https://github.com/rstudio/rstudio/">auf GitHub</a>. Unsere Änderungen daran sind in unserem <a href="https://github.com/leibniz-psychology/guix-zpid">guix-Kanal</a> einsehbar.',
				},
			en: {
				'headline': 'Legal notice',
				'imprint': 'Imprint',
				'instituteName': 'Leibniz Institute for Psychology (ZPID)',
				'softwareLicenses': 'Software licenses',
				'softwareLicensesBody': 'This platform provides access to RStudio Server, released under the terms of the <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">GNU Affero General Public License Version 3</a>. The source code is available <a href="https://github.com/rstudio/rstudio/">on GitHub</a>. Our changes are made public via our <a href="https://github.com/leibniz-psychology/guix-zpid">guix channel</a>.',
				},
			}),
	}),
	mixins: [i18nMixin],
});


import { translations, i18nMixin } from '../i18n.js';

Vue.component ('dynamic-footer', {
	template: `<footer>
      <div class="footer-stripe-contact">
        <div class="wrapped pure-g">
          <div class="pure-u-md-1-2 pure-u-1">
            <div class="pure-g">
              <div class="pure-u-md-2-3 pure-u-1">
                <h3>
                  {{ t('questions') }}
                </h3>
                <p>
                  {{ t('questionsBody') }}
                </p>
              </div>
              <div class="pure-u-md-1-3 pure-u-1">
                <div class="ft-contact-btn">
                  <a href="mailto:psychnotebook@leibniz-psychology.org"
                       class="btn high">{{ t('contact') }}</a>
                </div>
              </div>
            </div>
          </div>
          <div class="pure-u-md-1-2 pure-u-1">
            <div class="pure-g">
              <div class="pure-u-md-2-3 pure-u-1">
                <h3>
					{{ t('followus') }}
                </h3>
                <p>
					{{ t('followusBody') }}
                </p>
              </div>
              <div class="pure-u-1-3">
                <ul class="social-line">
                  <li>
                    <a href="https://twitter.com/ZPID"><img src=
                    "https://www.lifp.de/assets/images/twitter.svg"
                         alt="Twitter"></a>
                  </li>
                  <li class="facebook">
                    <a href=
                    "https://www.facebook.com/ZPID.LeibnizZentrum/"><img src=
                    "https://www.lifp.de/assets/images/facebook.svg"
                         alt="facebook"></a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="footer-stripe-navi">
        <div class="wrapped pure-g">
          <div class="pure-u-md-1-4 pure-u-1" v-for="col in sitemap">
            <h3>
              {{ col.name }}
            </h3>
            <ul>
              <li v-for="link in col.links">
                <a :href="link[1]">{{ link[0] }}</a>
              </li>
            </ul>
          </div>
          <div class="pure-u-md-1-4 pure-u-1">
            <h3>
              leibniz-psychology.org
            </h3>
            <address>
              <p>
				Leibniz-Institut für Psychologie (ZPID)<br>
                Universitätsring 15<br>
                54296 Trier
              </p>
              <p>
                T. +49 (0)651 201-2877<br>
                F. +49 (0)651 201-2071<br>
                M. <a href="mailto:psychnotebook@leibniz-psychology.org"
                   title="E-Mail senden">psychnotebook(at)leibniz-psychology.org</a>
              </p>
            </address>
          </div>
        </div>
      </div>
      <div class="footer-stripe-imprint">
        <div class="wrapped pure-g">
          <div class="pure-u-sm-4-5 pure-u-1">
            <ul class="logos">
              <li>
                <a href="#"><img :src="t('leibnizLogo')"
                     style="height: 5em"
                     alt="Leibniz-Gemeinschaft"></a>
              </li>
            </ul>
          </div>
          <div class="pure-u-sm-1-5 pure-u-1">
            <ul class="links">
			<li><router-link :to="{name: 'terms'}">{{ t('termsofuse') }}</router-link> </li>
			  <li><router-link :to="{name: 'legal', hash: '#softwarelizenzen'}">{{ t('licenses') }}</router-link></li>
              <li><router-link :to="{name: 'legal', hash: '#impressum'}">{{ t('imprint') }}</router-link></li>
            </ul>
          </div>
        </div>
      </div>
    </footer>`,
    data: _ => ({
		strings: translations ({
			de: {
				'questions': 'Haben Sie Fragen?',
				'questionsBody': 'Schreiben Sie uns eine E-Mail. Wir helfen Ihnen gern.',
				'contact': 'Kontakt',
				'followus': 'Folgen Sie uns.',
				'followusBody': 'Auf Twitter und Facebook informieren wir Sie über Neuigkeiten aus dem ZPID.',
				'termsofuse': 'Nutzungsbedingungen',
				'licenses': 'Softwarelizenzen',
				'imprint': 'Impressum/Datenschutz',
				'leibnizLogo': 'https://www.lifp.de/assets/images/Leibniz-Gemeinschaft_Logo.svg',
				},
			en: {
				'questions': 'Have a question?',
				'questionsBody': 'Send us an email. We will be happy to help you.',
				'contact': 'Contact',
				'followus': 'Follow us on social media.',
				'followusBody': 'Get the latest ZPID news on Twitter and Facebook.',
				'termsofuse': 'Terms of use',
				'licenses': 'Software licensing',
				'imprint': 'Legal notice/data privacy',
				'leibnizLogo': 'https://www.lifp.de/assets/images/Logo_Leibniz_Association.svg',
			},
		}),
		}),
	computed: {
		sitemap: function () {
			const data = {
				'de': [{"name": "Angebote", "links": [["Informieren/Recherchieren", "https://leibniz-psychology.org/angebote/informierenrecherchieren/"], ["Studien pr\u00e4-registrieren", "https://leibniz-psychology.org/angebote/studien-prae-registrieren/"], ["Studien planen", "https://leibniz-psychology.org/angebote/studien-planen/"], ["Daten erheben", "https://leibniz-psychology.org/angebote/daten-erheben/"], ["Daten analysieren", "https://leibniz-psychology.org/angebote/daten-analysieren/"], ["Archivieren", "https://leibniz-psychology.org/angebote/archivieren/"], ["Ver\u00f6ffentlichen", "https://leibniz-psychology.org/angebote/veroeffentlichen/"], ["Jobs", "https://leibniz-psychology.org/angebote/jobs/"], ["Events", "https://leibniz-psychology.org/angebote/events/"], ["Mediathek", "https://leibniz-psychology.org/angebote/mediathek/"]]}, {"name": "Forschung", "links": [["Forschungsliteralit\u00e4t", "https://leibniz-psychology.org/forschung/forschungsliteralitaet/"], ["Forschungssynthesen", "https://leibniz-psychology.org/forschung/forschungssynthesen/"], ["Big Data", "https://leibniz-psychology.org/forschung/big-data/"]]}, {"name": "Institut", "links": [["\u00dcber uns", "https://leibniz-psychology.org/institut/ueber-uns/"], ["Entwicklung", "https://leibniz-psychology.org/institut/entwicklung/"], ["Leitung", "https://leibniz-psychology.org/institut/leitung/"], ["Mitarbeitende", "https://leibniz-psychology.org/institut/mitarbeitende/"], ["Organe", "https://leibniz-psychology.org/institut/organe/"], ["Kooperationspartner", "https://leibniz-psychology.org/institut/kooperationspartner/"], ["Karrierem\u00f6glichkeiten", "https://leibniz-psychology.org/institut/karrieremoeglichkeiten/"], ["Drittmittelprojekte", "https://leibniz-psychology.org/institut/drittmittelprojekte/"], ["Ver\u00f6ffentlichungen", "https://leibniz-psychology.org/institut/veroeffentlichungen/"]]}],
				'en': [{"name": "Services", "links": [["Information search", "https://leibniz-psychology.org/en/services/information-search/"], ["Preregistration", "https://leibniz-psychology.org/en/services/preregistration/"], ["Study planning", "https://leibniz-psychology.org/en/services/study-planning/"], ["Data collection", "https://leibniz-psychology.org/en/services/data-collection/"], ["Data analysis", "https://leibniz-psychology.org/en/services/data-analysis/"], ["Archiving", "https://leibniz-psychology.org/en/services/archiving/"], ["Publication", "https://leibniz-psychology.org/en/services/publication/"], ["Jobs", "https://leibniz-psychology.org/en/services/jobs/"], ["Events", "https://leibniz-psychology.org/en/services/events/"], ["Media Center", "https://leibniz-psychology.org/en/services/media-center/"]]}, {"name": "Research", "links": [["Research literacy", "https://leibniz-psychology.org/en/research/research-literacy/"], ["Research synthesis", "https://leibniz-psychology.org/en/research/research-synthesis/"], ["Big data", "https://leibniz-psychology.org/en/research/big-data/"]]}, {"name": "Institute", "links": [["About", "https://leibniz-psychology.org/en/institute/about/"], ["Development", "https://leibniz-psychology.org/en/institute/development/"], ["Leadership", "https://leibniz-psychology.org/en/institute/leadership/"], ["Staff", "https://leibniz-psychology.org/en/institute/staff/"], ["Boards", "https://leibniz-psychology.org/en/institute/boards/"], ["Cooperation partners", "https://leibniz-psychology.org/en/institute/cooperation-partners/"], ["Career opportunities", "https://leibniz-psychology.org/en/institute/career-opportunities/"], ["Third-party funded projects", "https://leibniz-psychology.org/en/institute/third-party-funded-projects/"], ["Publications", "https://leibniz-psychology.org/en/institute/publications/"]]}],
				};
			return data[this.language];
		},
	},
	mixins: [i18nMixin],
});


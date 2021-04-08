import { translations, i18nMixin } from '../i18n.js';
import sitemap from '../sitemap.json';

export default {
	name: 'Footer',
	template: `<footer>
      <div class="footer-stripe-open" @click="open=!open">
		  <p>{{ t('offerby') }}
			<img src="https://leibniz-psychology.org/fileadmin/docs/img/leibniz_psychology.svg"
				     alt="Logo Leibniz Psychology">
			{{ t('learnmore') }}</p>
			<p class="arrow-open" v-if="!open">⌄</p>
			<p class="arrow-close" v-else>⌃</p>
      </div>
		<transition name="resize" @after-enter="afterOpen">
      <div class="footer-stripe-contact" v-show="open">
        <div class="wrapped pure-g">
          <div class="pure-u-lg-1-2 pure-u-1">
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
          <div class="pure-u-lg-1-2 pure-u-1">
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
	</transition>
		<transition name="resize">
      <div class="footer-stripe-navi" v-show="open">
        <div class="wrapped pure-g">
          <div class="pure-u-lg-1-4 pure-u-md-1-2 pure-u-1" v-for="col in sitemap">
            <h3>
              {{ col.name }}
            </h3>
            <ul>
              <li v-for="link in col.links">
                <a :href="link[1]">{{ link[0] }}</a>
              </li>
            </ul>
          </div>
          <div class="pure-u-lg-1-4 pure-u-md-1-2 pure-u-1">
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
	</transition>
      <div class="footer-stripe-imprint">
        <div class="wrapped pure-g">
          <div class="pure-u-sm-1-5 pure-u-1">
            <ul class="logos">
              <li>
                <img :src="t('leibnizLogo')" style="height: 5em" alt="Leibniz-Gemeinschaft">
              </li>
            </ul>
          </div>
          <div class="pure-u-sm-4-5 pure-u-1">
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
		open: false,
		strings: translations ({
			de: {
				'offerby': 'Ein Angebot von',
				'learnmore': 'Erfahren Sie mehr über uns!',
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
				'offerby': 'A service provided by',
				'learnmore': 'Learn more about us!',
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
			return sitemap[this.language];
		},
	},
	methods: {
		afterOpen: function () {
			this.$el.scrollIntoView ({behavior: 'smooth'});
		}
	},
	mixins: [i18nMixin],
};

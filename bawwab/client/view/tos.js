import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';

export default Vue.extend ({
	props: ['next'],
	template: `<div><h2>Nutzungsbedingungen</h2>
		<p>Zurzeit keine Nutzungsbedingungen hinterlegt.</p>
	</div>`,
});

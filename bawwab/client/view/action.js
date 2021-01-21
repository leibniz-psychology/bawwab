import { translations, i18nMixin } from '../i18n.js';
import { store, whoami } from '../app.js';
import { getResponse } from '../helper.js';
import Workspace from '../workspace.js';

import '../component/spinner.js';

export default Vue.extend ({
	props: ['token'],
	template: `<div>
	<h2>{{ t('headline') }}</h2>
	<p v-if="running">{{ t('pleasewait') }} <spinner></spinner></p>
	<p v-else>{{ t(message) }}</p>
</div>`,
	data: _ => ({
		running: true,
		message: null,
		state: store.state,
		strings: translations({
			'de': {
				'headline': 'Aktion ausführen',
				'pleasewait': 'Einen Moment bitte…',
				'done': 'Ausgeführt!',
				'error': 'Ein Fehler ist aufgetreten.',
				},
			'en': {
				'headline': 'Run action',
				'pleasewait': 'Just a second…',
				'done': 'Done!',
				'error': 'An error occurred.',
				},
			}),
		}),
	created: async function () {
		await this.state.ready.wait ();

	 	console.log ('executing action', this.token);
	 	const r = await fetch ('/api/action/' + this.token);
	 	try {
	 		const a = await getResponse (r);
	 		console.log ('got action', a);
	 		switch (a.name) {
	 			case 'run': {
	 				console.log ('got run action');
	 				const p = await this.state.processes.get (await this.state.processes.run (null, this.token));
	 				console.log ('got program', p);
	 				const newws = new Workspace (await p.getObject (), whoami);
	 				const ret = await p.wait ();
	 				if (ret == 0) {
	 					this.state.workspaces.workspaces.push (newws);
	 					this.message = 'done';
	 					this.$router.push ({name: 'workspace', params: {wsid: newws.metadata._id}});
	 				} else {
	 					throw Error ('unhandled');
	 				}
	 				break;
	 			}
	 		}
	    } catch (e) {
			console.log ('failed', e);
			if (e.message == 'unauthenticated') {
				const url = new URL ('/api/session/login', window.location.href);
				const next = new URL (this.$route.fullPath, window.location.href);
				next.hash = '';
				url.searchParams.append ('next', next.toString ());
				console.log (url.toString ());
				document.location = url.toString ();
			} else {
				this.message = 'error';
			}
	    } finally {
	 	   this.running = false;
	    }
	},
	mixins: [i18nMixin],
});


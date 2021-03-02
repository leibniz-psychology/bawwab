import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';
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

	 	console.debug ('executing action %s', this.token);
	 	const r = await fetch ('/api/action/' + this.token);
	 	try {
	 		const a = await getResponse (r);
	 		console.debug ('got action %o', a);
	 		switch (a.name) {
	 			case 'run': {
	 				console.debug ('got run action');
	 				const p = await this.state.processes.get (await this.state.processes.run (null, this.token));
	 				console.debug ('got program %o', p);
	 				const newws = new Workspace (await p.getObject ());
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
			console.error ('failed: %o', e);
			if (e.message == 'unauthenticated') {
				const url = new URL ('/api/session/login', window.location.href);
				const next = new URL (this.$route.fullPath, window.location.href);
				next.hash = '';
				url.searchParams.append ('next', next.toString ());
				console.debug ('unauthicanted, going to %o', url.toString ());
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


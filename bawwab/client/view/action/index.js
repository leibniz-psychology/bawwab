import { store } from '../../app.js';
import { getResponse } from '../../helper.js';
import { run as emrun } from '../../eventManager.js';
import Workspace from '../../workspace.js';
import template from './template.html';

export default {
	name: 'ActionView',
	props: ['token'],
	template: template,
	data: _ => ({
		running: true,
		message: null,
		state: store.state,
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
					const newws = await emrun ('workspaces.joinShared', null, null, this.token);
					this.message = 'v.action.done';
					await this.$router.push ({name: 'workspace', params: {wsid: newws.metadata._id}});
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
				this.message = 'v.action.' + e.message;
			}
	    } finally {
	 	   this.running = false;
	    }
	},
};


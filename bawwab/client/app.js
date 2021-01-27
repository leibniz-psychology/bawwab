/* Copyright 2019–2021 Leibniz Institute for Psychology
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import AsyncNotify from './asyncNotify.js';
import EventManager from './eventManager.js';
import ProcessManager from './processManager.js';
import router from './routing.js';
import Session from './session.js';
import { translations, i18nMixin } from './i18n.js';
import User from './user.js';
import Workspaces from './workspaces.js';

import './directive/clickOutside.js';
/* used my app.html */
import './component/message.js';
import './component/footer.js';
import './component/actionButton.js';
import './component/languageSwitcher.js';
import './component/login.js';

/* also bundle CSS files */
import './css/style.css';

/* XXX: load config from server */
export const config = Object.freeze ({
	publicData: '/storage/public',
	privateData: '/storage/home',
	});

export function whoami () {
	if (store.state.user) {
		return store.state.user.name;
	} else {
		return null;
	}
}

export const store = {
	state: {
		processes: null,
		events: null,
		session: null,
		user: null,
		workspaces: null,
		/* current language */
		language: 'de',

		/* notify when the store is fully initialized */
		ready: new AsyncNotify (),
	},

	async init () {
		this.state.session = await Session.get ();

		/* needs a valid session */
		const url = new URL ('/api/process/notify', window.location.href);
		this.state.processes = new ProcessManager (url);

		this.state.events = new EventManager (this.state.processes);

		try {
			this.state.user = await User.get ();
		} catch (e) {
			if (e.message == 'nonexistent' && this.state.session.authenticated()) {
				this.state.user = await User.create (this.state.session.oauthInfo);
			} else {
				/* just accept the fact */
				this.state.user = null;
			}
		}

		if (this.state.user && this.state.user.canLogin) {
			this.state.workspaces = new Workspaces (this.state.events, this.state.user);
		} else {
			this.state.workspaces = null;
		}
		/* event manager must be started before we can run programs, otherwise
		 * .fetch() below deadlocks. */
		this.state.events.start ();

		if (this.state.workspaces) {
			try {
				/* allow only updating project list */
				await this.state.events.setAllowedHandler (/^workspaces.fetch$/);
				await this.state.workspaces.fetch ();
			} catch (e) {
				this.state.workspaces = null;
				throw e;
			}
		}
		/* allow all events */
		await this.state.events.setAllowedHandler (/.*/);

		await this.state.ready.notify ();
	},

	haveWorkspaces: function () {
		return this.state.workspaces !== null;
	},
};

const app = new Vue({
    el: '#app',
    data: _ => ({
		state: store.state,
		loading: true,
		strings: translations ({
			de: {
				'nav.projects': 'Projekte',
				'loading': 'Einen Moment bitte…',
				'locked': 'Dein Benutzerkonto ist zurzeit gesperrt. Bitte melde Dich per E-Mail bei <a href="mailto:%{mail}">%{mail}</a>.',
				},
			en: {
				'nav.projects': 'Projects',
				'loading': 'Just a second…',
				'locked': 'Your account is locked right now. Please contact <a href="mailto:%{mail}">%{mail}</a> via email.',
			},
		}),
		}),
    created: async function () {
		try {
			await store.init ();
		} finally {
			this.loading = false;
		}
	},
	computed: {
		fullscreen: function () {
			return this.$route.matched[0].components.overlay;
		},
		htmlClass: function () {
			return this.fullscreen ? 'fullscreen' : '';
		},
		haveWorkspaces: function () {
			return store.haveWorkspaces ();
		},
		isLockedOut: function () {
			return this.state.user && !this.state.user.canLogin;
		},
		supportMail: function () {
			return 'psychnotebook@leibniz-psychology.org';
		},
		motd: function () {
			return this.state.user ? this.state.user.motd : null;
		},
	},
	watch: {
		/* this is a little hacky, so we can tell the browser to hide scrollbars */
		htmlClass: {immediate: true, handler: function () {
			document.documentElement.className = 'magenta ' + this.htmlClass;
		}},
	},
	router: router,
	mixins: [i18nMixin],
});


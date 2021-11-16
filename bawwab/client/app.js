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
import { getResponse } from './helper.js';
import User from './user.js';
import Workspaces from './workspaces.js';
import BorgBackup from './borg.js';
import './directive/clickOutside.js';
import './css/style.css';

/* The default module does not include template compiling
 * XXX: figure out how to configure esbuild correctly to do this replacement */
import { createApp, reactive } from 'vue/dist/vue.esm-bundler.js';
/* XXX: Would be nice if we could use it, but esbuild messes up order currently.*/
/*import 'purecss/build/pure.css';
import 'purecss/build/grids-responsive.css';*/

/* XXX: load config from server */
export const config = Object.freeze ({
	publicData: '/storage/public',
	privateData: '/storage/home',
	autosaveInterval: 10*60*1000, /* ms */
	/* Make sure to keep at least 1 hour of autosaves by adjusting secondly */
	autosaveKeep: {secondly: 6, hourly: 12, daily: 14},
});

export function whoami () {
	if (store.state.user) {
		return store.state.user.name;
	} else {
		return null;
	}
}

export const store = {
	state: reactive ({
		processes: null,
		events: null,
		session: null,
		user: null,
		workspaces: null,
		borg: null,
		settings: null,
		/* current language */
		language: 'en',
		/* cache for terms of service. Hash prefix is reserved for private
		 * props. */
		'#termsOfService': null,

		/* notify when the store is fully initialized */
		ready: new AsyncNotify (),
	}),

	async init () {
		this.state.session = await Session.get ();

		/* needs a valid session */
		const url = new URL ('/api/process/notify', window.location.href);
		this.state.processes = new ProcessManager (url);

		this.state.events = new EventManager (this.state.processes);
		/* event manager must be started before we can run programs, otherwise
		 * workspaces.fetch() below deadlocks. */
		this.state.events.start ();
		this.state.borg = new BorgBackup (this.state.events);

		await this.initUser ();
		await this.initWorkspaces ();
		await this.initSettings ();

		await this.state.ready.notify ();
	},

	async initUser (acceptTos) {
		try {
			this.state.user = await User.get (acceptTos);
		} catch (e) {
			if (e.message == 'nonexistent' && this.state.session.authenticated()) {
				try {
					this.state.user = await User.create (this.state.session.oauthInfo);
				} catch (e) {
					/* if creating a user fails the back-end must be broken */
					this.state.user = null;
				}
			} else {
				/* just accept the fact */
				this.state.user = null;
			}
		}
	},

	async initWorkspaces () {
		if (this.state.user && this.state.user.loginStatus == 'success') {
			this.state.workspaces = new Workspaces (this.state.events, this.state.user);
		} else {
			this.state.workspaces = null;
		}

		if (this.state.workspaces) {
			try {
				/* allow only updating project list */
				await this.state.events.setAllowedHandler (/^workspaces\.fetch$/);
				await this.state.workspaces.fetch ();
			} catch (e) {
				this.state.workspaces = null;
				throw e;
			}
		}
		/* allow all events, but do so in the background, so we don’t block
		 * this method */
		this.state.events.setAllowedHandler (/.*/).then (function () {});
	},

	async initSettings () {
		if (this.state.user && this.state.user.loginStatus === 'success') {
			this.state.settings = await Settings.load (this.state.user.name);
		}
	},

	haveWorkspaces: function () {
		return this.state.workspaces !== null;
	},

	async getTermsOfService () {
		const cached = this.state['#termsOfService'];
		if (cached === null) {
			/* XXX: make sure we don’t fetch it twice */
			const r = await fetch ('/api/tos');
			const terms = await getResponse (r);
			for (const t of terms) {
				t.effective = new Date (t.effective);
			}
			this.state['#termsOfService'] = terms;
		}
		return this.state['#termsOfService'];
	}
};

const app = createApp ({
    name: 'NotebookApp',
    data: _ => ({
		state: store.state,
		loading: true,
		strings: translations ({
			de: {
				'nav.projects': 'Projekte',
				'loading': 'Einen Moment bitte…',
				'locked': 'Dein Benutzerkonto ist zurzeit gesperrt. Bitte melde Dich per E-Mail bei <a href="mailto:%{mail}">%{mail}</a>.',
				'help': 'Hilfe',
				},
			en: {
				'nav.projects': 'Projects',
				'loading': 'Just a second…',
				'locked': 'Your account is locked right now. Please contact <a href="mailto:%{mail}">%{mail}</a> via email.',
				'help': 'Help',
			},
		}),
		}),
    created: async function () {
		try {
			await store.init ();
			/* the initial beforeEach fires before we’re done here */
			if (this.state.user?.loginStatus == 'termsOfService' && this.$router.currentRoute.value.meta.requireAuth) {
				const ret = await this.$router.push ({name: 'termsPrompt', query: {next: this.$router.currentRoute.value.fullPath}});
			}
		} finally {
			this.loading = false;
		}
	},
	computed: {
		fullscreen: function () {
			return this.$route.matched.length > 0 ? this.$route.matched[0].components.overlay : false;
		},
		htmlClass: function () {
			return this.fullscreen ? 'fullscreen' : '';
		},
		haveWorkspaces: function () {
			return store.haveWorkspaces ();
		},
		isLockedOut: function () {
			return this.state.user && this.state.user.loginStatus == 'permissionDenied';
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
	mixins: [i18nMixin],
});

router.onError (function (err) {
	console.debug ('router threw error', err);
});
router.beforeEach (async function (to, from) {
	console.log ('called before handler with', to, from, store.state.user);
	/* XXX: should async get the user here */
	if (store.state.user?.loginStatus == 'termsOfService' && to.meta.requireAuth) {
		console.debug ('Require terms of service, redirecting', to);
		return {name: 'termsPrompt', query: {next: to.fullPath}};
	}
	console.debug ('accept navigation');
	return true;
});
app.use (router);

/* register components with this app */
import ActionButtonComponent from './component/actionButton';
import FooterComponent from './component/footer';
import LanguageSwitcherComponent from './component/languageSwitcher';
import LoginComponent from './component/login';
import MessageComponent from './component/message';
import ModalComponent from './component/modal';
import SpinnerComponent from './component/spinner';
import CommonmarkComponent from './component/commonmark';
import DropdownComponent from './component/dropdown';
import { ApplicationIconComponent, ApplicationItemComponent } from './component/application';
app.component ('action-button', ActionButtonComponent);
app.component ('dynamic-footer', FooterComponent);
app.component ('language-switcher', LanguageSwitcherComponent);
app.component ('login-item', LoginComponent);
app.component ('message', MessageComponent);
app.component ('modal', ModalComponent);
app.component ('spinner', SpinnerComponent);
app.component ('application-icon', ApplicationIconComponent);
app.component ('application-item', ApplicationItemComponent);
app.component ('commonmark', CommonmarkComponent);
app.component ('dropdown', DropdownComponent);
import ClickOutsideDirective from './directive/clickOutside.js';
import {Settings} from "./settings";
app.directive ('click-outside', ClickOutsideDirective);

app.mount ('#app');


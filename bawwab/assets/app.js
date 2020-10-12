/* Yes, this is a mess. */

/* turn HTTP response into a meaningful exception */
async function getResponse (r) {
	const j = await r.json ();
	if (r.ok) {
		return j;
	} else if (r.status == 403 && (j.status == 'no_tos' || j.status == 'new_tos')) {
		throw Error ('need_tos');
	} else if (j.status) {
		throw Error (j.status);
	}
	throw Error ('bug');
}

function randomId () {
	const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'.split ('');
	const len = 16;
	const a = [];
	for (let i = 0; i < len; i++) {
		const elem = alphabet[Math.round (Math.random () * alphabet.length)];
		a.push (elem);
	}
	return a.join ('');
}

/* Abstracting a running program using RPC
 */
class Program {
	constructor(rpc, token) {
		this.rpc = rpc;
		/* identifier used to distinguish messages for this program */
		this.token = token;
		this.stdoutBuf = '';
		this.stderrBuf = '';
		this.exitStatus = null;
		this.exitSignal = null;
	}

	/* Check if the program is still running. XXX: should be async?
	 */
	running () {
		return this.exitStatus === null;
	}

	/* Process incoming messages.
	 */
	async handleMessages () {
		const msg = await this.rpc.receive (this.token);
		switch (msg.method) {
			case 'notifyProcessData':
				console.log ('got more data for', msg.kind, msg.data);
				switch (msg.kind) {
					case 'stdout':
						this.stdoutBuf += msg.data;
						break;
					case 'stderr':
						this.stderrBuf += msg.data;
						break;
					default:
						throw Error (['unknownKind', msg]);
						break;
				}
				break;

			case 'notifyProcessExit':
				this.exitStatus = msg.status;
				this.exitSignal = msg.signal;
				break;

			default:
				throw Error (['unknownMessage', msg]);
				break;
		}
	}

	/* Get a single JSON object (i.e. line) from stdout.
	 */
	async getObject () {
		let pos = -1;
		while (true) {
			pos = this.stdoutBuf.indexOf ('\n');
			if (pos != -1) {
				/* got it */
				break;
			}
			if (!this.running () && pos == -1) {
				/* no more data */
				return null;
			}
			console.log ('not found newline, waiting for more data');
			await this.handleMessages ();
		}
		const o = JSON.parse (this.stdoutBuf.slice (0, pos));
		this.stdoutBuf = this.stdoutBuf.slice (pos+1);
		return o;
	}

	/* Collect all JSON objects from stdout and return them.
	 */
	async getAllObjects () {
		const ret = [];
		let o = null;
		while ((o = await this.getObject ()) !== null) {
			ret.push (o);
		}
		return ret;
	}

	/* Wait for process to exit.
	 */
	async wait () {
		while (this.running ()) {
			await this.handleMessages ();
		}
		return this.exitStatus;
	}
}

/* RPC websocket API abstraction, wrapping message-based websocket into async
 * API.
 */
class Rpc {
	constructor(url) {
		url.protocol = url.protocol == 'http:' ? 'ws:' : 'wss:';
		console.log ('connecting to', url);
		this.socket = new WebSocket (url);
		this.waiting = new Map ();
		this.receiveBuffer = new Map ();
		this.sendBuffer = [];

		this.socket.addEventListener ('open', this.onOpen.bind (this));
		this.socket.addEventListener ('message', this.onMessage.bind (this));
	}

	/* Connection was opened.
	 */
	onOpen (event) {
		console.log ('socket is now open', this);
		this.sendBuffer.forEach (msg => this.socket.send (JSON.stringify (msg)));
	}

	/* A message was received from the server.
	 */
	onMessage (event) {
		const data = JSON.parse (event.data);
		const token = data.token;
		console.log ('got message with token', token);
		if (this.waiting.has (token)) {
			/* if someone is waiting, forward directly */
			console.log ('forwarding message', token, 'to waiting clients', this.waiting);
			this.waiting.get (token).forEach (f => f(data));
		} else {
			/* otherwise store, so we do not lose it; XXX: obviously this does
			 * not handle backpressure correctly */
			console.log ('no one is waiting for', token, 'storing.')
			const buf = this.receiveBuffer;
			if (!buf.has (token)) {
				buf.set (token, []);
			}
			buf.get (token).push (data);
		}
	}

	/* send a message to server */
	send (msg) {
		const token = randomId ();
		msg.token = token;
		console.log ('sending', msg, 'to', this.socket);
		if (this.socket.readyState == 1) {
			this.socket.send (JSON.stringify (msg));
		} else {
			this.sendBuffer.push (msg);
		}
		return token;
	}

	/* Get the next message for token.
	 */
	async receive (token) {
		const buf = this.receiveBuffer;
		let p = null;
		if (buf.has (token)) {
			/* resolve immediately */
			console.log ('have stored message for', token);
			const data = buf.shift ();
			p = new Promise ((resolve, reject) => {
				resolve (data);
			});
		} else {
			/* wait */
			console.log ('waiting for message for', token);
			p = new Promise ((resolve, reject) => {
				if (!this.waiting.has (token)) {
					this.waiting.set (token, []);
				}
				/* don’t call resolve, but queue it into waiting list */
				this.waiting.get (token).push (resolve);
			});
		}
		return p;
	}

	/* Send a ping to the server and check it responds correctly.
	 */
	async ping () {
		const i = randomId ();
		const token = this.send ({method: 'ping', extradata: i})
		const resp = await this.receive (token);
		return resp.extradata == i;
	}

	/* Run an application and on success return a Program.
	 */
	async run (command=null, action=null) {
		const payload = {method: 'run'};
		if (command && action) {
			console.log ('both command and action given', command, action);
			throw Error ('bug');
		} else if (command) {
			payload.command = command;
			console.log ('starting run() with command', command);
		} else if (action) {
			console.log ('starting run() with action', action);
			payload.action = action;
		}
		const token = this.send (payload);
		const p = new Program (this, token);
		const resp = await this.receive (token);
		if (resp.status == 'ok') {
			return p;
		}
		throw Error (resp.status);
	}
}

/* Conductor tunnel/program state
 */
const ConductorState = Object.freeze ({
	starting: 0,
	live: 1, /* program is accessible to the user */
	exited: 2,
});

/* Special treatment for conductor Program’s
 */
class ConductorClient {
	constructor(process) {
		this.process = process;
		this.config = null;
		/* Merged stdout/stderr of the proxied application, as sent by
		 * conductor */
		this.output = '';
		this.state = ConductorState.starting;
		this.error = null;
	}

	/* Return URL for this proxied program
	 */
	url () {
		if (this.config === null) {
			return null;
		}
		/* assume the first url is ok */
		return document.location.protocol + '//' + this.config.urls[0] + '/_conductor/auth/' + this.config.auth;
	}

	/* Run until the program exits.
	 */
	async run () {
		while (true) {
			const msg = await this.process.getObject ();
			if (msg === null) {
				/* make sure the process is dead */
				const ret = await this.process.wait ();
				if (ret != 0) {
					throw Error (ret);
				} else {
					return;
				}
			} else {
				switch (msg.state) {
					case 'data':
						/* just merge stdout/stderr */
						this.output += msg.data;
						break;

					case 'live':
						this.config = msg.config;
						this.state = ConductorState.live;
						break;

					case 'exit':
						this.config = null;
						if (msg.status != 0) {
							this.error = 'client_application';
						}
						this.state = ConductorState.exited;
						break;

					case 'failed':
						this.error = msg.reason;
						this.state = ConductorState.exited;
						break;
				}
			}
		}
	}
}

/* A single workspace.
 */
class Workspace {
	constructor (o, whoami) {
		Object.assign (this, o);
		this.whoami = whoami;
	}

	/* Compare workspace names for .sort()
	 */
	static compareName (a, b) {
		const x = a.metadata.name ? a.metadata.name.toLowerCase () : '',
			y = b.metadata.name ? b.metadata.name.toLowerCase () : '';
		if (x == y) {
			return 0;
		} else if (x > y) {
			return 1;
		} else {
			return -1;
		}
	}

	myPermissions () {
		const me = this.whoami ();
		const [k, v] = Object.entries (this.permissions).filter (([k, v]) => k == me)[0];
		return v;
	}

	/* Retrive the owner of this workspace.
	 */
	owner () {
		/* XXX: assuming there can only be one owner */
		console.log (this.permissions);
		const l = Object.entries (this.permissions).filter (([k, v]) => v.includes ('T'));
		if (l.length == 0) {
			return null;
		}
		return l[0][0];
	}

	/* Current user is allowed to read files of this project.
	 */
	canRead () {
		return this.myPermissions ().includes ('r');
	}

	/* Current user is allowed to write files of this project.
	 */
	canWrite () {
		return this.myPermissions ().includes ('w');
	}

	/* Current user can run applications.
	 */
	canRun () {
		return this.canWrite ();
	}

	/* Current user can share project with other users. (Only owner can.)
	 */
	canShare () {
		return this.myPermissions ().includes ('T');
	}

	/* Current user can delete files. In theory having 'w' is enough, but don’t
	 * advertise it. */
	canDelete () {
		return this.canShare ();
	}

	/* All applications runnable in the web client
	 */
	runnableApplications () {
		const ret = [];
		if (!this.canRun ()) {
			return ret;
		}
		for (const a of this.applications) {
			const interfaces = a.interfaces ? a.interfaces.split (',') : [];
			if (interfaces.some (x => x.indexOf ('org.leibniz-psychology.conductor') == 0)) {
				ret.push (a);
			}
		}
		return ret;
	}
}

/* XXX: load config from server */
const config = Object.freeze ({
	publicData: '/storage/public',
	privateData: '/storage/home',
	});

function whoami () {
	if (store.state.user) {
		return store.state.user.name;
	} else {
		return null;
	}
}

/* Simple async notification
 */
class AsyncNotify {
	constructor (getArgs) {
		this.waiting = [];
		this.getArgs = getArgs;
		this.notified = false;
	}

	/* Notify (unblock) all waiting clients
	 */
	async notify () {
		this.notified = true;
		const args = this.getArgs ();
		for (let i = 0; i < this.waiting.length; i++) {
			const f = this.waiting[i];
			await f (args);
		}
		this.waiting = [];
	}

	/* Block again
	 */
	reset () {
		this.notified = false;
	}

	/* Async wait for notification
	 */
	wait () {
		if (this.notified) {
			/* resolve immediately */
			return new Promise (function (resolve, reject) {
				resolve (this.getArgs ());
			}.bind (this));
		} else {
			/* queue */
			return new Promise (function (resolve, reject) {
				this.waiting.push (resolve);
			}.bind (this));
		}
	}
}

/* Server session
 */
class Session {
	constructor (name, oauthInfo) {
		this.name = name;
		this.oauthInfo = oauthInfo;
	}

	static async get () {
		const r = await fetch ('/api/session');
		const j = await r.json();
		if (r.ok) {
			return new Session (j.name, j.oauthInfo);
		} else {
			throw Error (session.status);
		}
	}

	async destroy () {
		const r = await fetch ('/api/session', {
			'method': 'DELETE'
		});
		if (r.ok) {
			this.name = null;
			this.oauthInfo = null;
		} else {
			console.log(r);
			throw Error ('nope');
		}
	}

	/* Is the session currently authenticated against OAuth?
	 */
	authenticated () {
		return this.oauthInfo !== null;
	}
}

/* Unix user
 */
class User {
	constructor (name) {
		this.name = name;
	}

	static async get () {
		const r = await fetch ('/api/user');
		const j = await r.json ();
		if (r.ok) {
			return new User (j.name);
		} else {
			throw Error (j.status);
		}
	}

	static async create (info) {
		const r = await postData ('/api/user', {
				firstName: info.given_name,
				lastName: info.family_name,
				username: info.preferred_username,
				email: info.email,
				orcid: info.orcid,
				});
		const j = await r.json ();
		if (r.ok) {
			return new User (j.name);
		} else {
			throw Error (j.status);
		}
	}
}

class Workspaces {
	constructor (rpc, user) {
		this.rpc = rpc;
		this.user = user;
		this.loading = false;
		this.workspaces = [];
	}

	/* Run RPC workspace command
	 */
	async runRpcWith (ws, args) {
		let command = ['workspace', '-f', 'json'];
		if (ws) {
			command = command.concat (['-d', ws.path]);
		}
		if (args) {
			command = command.concat (args);
		}
		const p = await this.rpc.run (command);
		const workspaces = await p.getAllObjects ();
		const ret = await p.wait ();
		if (ret == 0) {
			return workspaces.map (o => new Workspace (o, whoami));
		} else {
			throw Error ('unhandled');
		}
	}

	async fetch () {
		try {
			this.loading = true;
			this.workspaces = await this.runRpcWith (null, [
					'list',
					'-s', config.publicData,
					'-s', config.privateData,
					]);
		} catch (e) {
			this.workspaces = [];
			throw e;
		} finally {
			this.loading = false;
		}
	}

	async create (name) {
		const ws = await this.runRpcWith (null, [
				'-d', `${config.publicData}/${this.user.name}`,
				'create',
				name,
				]);
		this.workspaces.push (ws[0]);
		return ws[0];
	}

	async update (ws) {
		const args = ['modify'];
		for (const k in ws.metadata) {
			args.push (`${k}=${ws.metadata[k]}`);
		}
		const newws = await this.runRpcWith (ws, args);
		this.replace (ws, newws[0]);
		return newws[0];
	}

	async delete (ws) {
		const p = await this.rpc.run (['trash', '--', ws.path]);
		const ret = await p.wait ();
		if (ret == 0) {
			this.workspaces = this.workspaces.filter(elem => elem.path != ws.path);
		} else {
			throw Error ('unhandled');
		}
		return true;
	}

	/* share workspace with a group
	 */
	async share (ws, group, isWrite) {
		const args = ['share', group];
		if (isWrite) {
			args.push ('-w');
		}
		const newws = await this.runRpcWith (ws, args);
		this.replace (ws, newws[0]);
		return newws[0];
	}

	/* Implicitly share a workspace through an action link
	 */
	async shareAction (ws, isWrite) {
		const command = ['workspace', '-d', ws.path, '-f', 'json', 'share', '{user}'];
		if (isWrite) {
			command.push ('-w');
		}
		const r = await postData('/api/action', {
				name: 'run',
				command: command,
				validFor: 7*24*60*60,
				usesRemaining: 100,
				});
		const action = await getResponse (r);
		return action.token;
	}

	async unshare (ws, group) {
		const args = ['share', '-x', group];
		const newws = await this.runRpcWith (ws, args);
		this.replace (ws, newws[0]);
		return newws[0];
	}

	async ignore (ws) {
		const args = ['ignore'];
		await this.runRpcWith (ws, args);
		this.workspaces = this.workspaces.filter(elem => elem.path != ws.path);
	}

	async copy (ws) {
		const args = ['copy', `${config.publicData}/${this.user.name}/`];
		const newws = await this.runRpcWith (ws, args);
		this.workspaces.push (newws[0]);
		return newws[0];
	}

	getById (wid) {
		return this.workspaces.filter(elem => elem.metadata._id == wid)[0];
	}

	all () {
		return this.workspaces;
	}

	replace (oldws, newws) {
		this.workspaces = this.workspaces.map (oldws => oldws.path == newws.path ? newws : oldws);
	}
}

class LockedOutError extends Error {
	constructor(...params) {
		super(...params);
	}
}

const store = {
	state: {
		rpc: null,
		session: null,
		user: null,
		workspaces: null,
		/* running applications */
		applications: new Map (),
		/* current language */
		language: 'de',

		/* notify when the store is fully initialized */
		ready: new AsyncNotify (_ => store),
	},

	async init () {
		this.state.session = await Session.get ();

		/* RPC needs a valid session */
		const url = new URL ('/api/rpc', window.location.href);
		this.state.rpc = new Rpc (url);

		try {
			this.state.user = await User.get ();
		} catch (e) {
			if (e == 'nonexistent' && this.state.session.authenticated()) {
				this.state.user = await User.create (this.state.session.oauthInfo);
			} else {
				/* just accept the fact */
				this.state.user = null;
			}
		}
		if (this.state.user) {
			this.state.workspaces = new Workspaces (this.state.rpc, this.state.user);
			try {
				await this.state.workspaces.fetch ();
			} catch (e) {
				if (e == 'locked_out') {
					this.state.workspaces = new LockedOutError ();
				} else {
					this.state.workspaces = null;
					throw e;
				}
			}
		}

		await this.state.ready.notify ();
	},

	startApplication: async function(w, a) {
		const p = await this.state.rpc.run (['workspace', '-d', w.path, 'run', a._id]);
		const c = new ConductorClient (p);
		const k = w.metadata._id + '+' + a._id;
		this.state.applications.set (k, c);
		c.run ().then (function () { this.state.applications.delete (k); }.bind (this));
		return c;
	},

	/* XXX: Move this to a user property that indicates we can run SSH commands */
	haveWorkspaces: function () {
		return this.state.workspaces && !(this.state.workspaces instanceof Error);
	},
};

function postData(url = '', data = {}) {
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
}

/* Create translation objects from Maps
 */
function translations (args) {
	let strings = {};
	for (let k in args) {
		strings[k] = i18n.create ({ values: args[k] });
	}
	return strings;
}

/* Translation mixin for Vue components, adds a method .t(), which can be used
 * for translations.
 */
const i18nMixin = {
	methods: {
		t: function (...args) { if (this.strings) { return this.strings[this.language] (...args); } else { return '<missing>' } },
	},
	data: _ => ({ state: store.state, strings: translations ({de: {}, en: {}})}),
	computed: {
		language: function () { return this.state.language; },
	},
};

Vue.component ('spinner', {
	props: ['big'],
	template: `<img src="/assets/img/spinner.svg" :class="cls">`,
	computed: {
		cls() {
			return 'spinner' + (this.big ? ' big' : '');
		},
	},
});

/* Language switcher using local browser storage to save user’s choice
 */
Vue.component ('language-switcher', {
	props: ['state', 'languages'],
	template: `<ul class="topline-nav">
		<li v-for="l in languages"><a @click="switchTo(l)" :class="isActive(l)">{{ l }}</a></li>
		</ul>`,
	methods: {
		switchTo: function (l) {
			Vue.set (this.state, 'language', l);
			window.localStorage.setItem('language', l);
		},
		isActive: function (l) {
			if (this.state.language == l) {
				return 'active';
			} else {
				return '';
			}
		}
	},
	created: function () {
		const lang = window.localStorage.getItem ('language');
		if (lang) {
			this.switchTo (lang);
		}
	},
});

Vue.component('action-button', {
	props: ['icon', 'f', 'importance'],
	data: function () { return {busy: false, ret: null} },
	template: `<button v-on:click="clicked" :class="btnclass"><i :class="iconclass"></i> <slot></slot></button>`,
	computed: {
		iconclass: function () {
			if (this.ret) {
				if (this.ret instanceof Error) {
					return "fas fa-exclamation-triangle";
				} else {
					return 'fas fa-check';
				}
			} else if (this.busy) {
				return "fas fa-spin fa-spinner";
			} else {
				return "fas fa-" + this.icon;
			}
		},
		btnclass: function () {
			return 'btn ' + (this.importance ? this.importance : 'low');
		},
	},
	methods: {
		clicked: async function () {
			if (!this.busy) {
				this.ret = null;

				this.busy = true;
				try {
					this.ret = await this.f ();
				} catch (e) {
					this.ret = e;
					this.busy = false;
					throw e;
				}
				this.busy = false;
			}
		},
	}
});

/* XXX Rename to something more sensible? workspace-details? */
Vue.component('workspace-item', {
    props: ['workspace', 'onDelete', 'onUpdate', 'onShare', 'onDeleteShare', 'onCopy'],
	data: _ => ({
		editable: false,
		strings: translations ({
			de: {
				'save': 'Speichern',
				'cancel': 'Verwerfen',
				'edit': 'Bearbeiten',
				'share': 'Teilen',
				'copy': 'Kopieren',
				'delete': 'Löschen',
				'hide': 'Verbergen',
				'back': 'Zurück zur Übersicht',
				'projectname': 'Name des Projekts',
				'sharedwith': 'Geteilt mit Gruppen',
				'ownedby': 'Gehört',
				'projectdescription': 'Beschreibung des Projekts',
				'readonly': 'nur Lesen',
				'readwrite': 'Lesen und Schreiben',
				'noaccess': 'kein Zugriff',
				'noTitle': 'Klicken, um einen Titel hinzuzufügen',
				'noDescription': 'Klicken, um eine Beschreibung hinzuzufügen.',
				},
			en: {
				'save': 'Save',
				'cancel': 'Cancel',
				'edit': 'Edit',
				'share': 'Share',
				'copy': 'Copy',
				'delete': 'Delete',
				'hide': 'Hide',
				'back': 'Back to projects',
				'projectname': 'Name of the project',
				'sharedwith': 'Shared with',
				'ownedby': 'Owned by',
				'projectdescription': 'Description of the project',
				'readonly': 'read-only',
				'readwrite': 'read and write',
				'noaccess': 'no access',
				'noTitle': 'Click to add a title',
				'noDescription': 'Click to add a description.',
				},
			}),
	}),
	mixins: [i18nMixin],
    template: `<div class="workspaceItem">
		<div class="wsactions">
		<ul class="left">
			<li><router-link :to="{name: 'workspaces'}">{{ t('back') }}</router-link></li>
		</ul>
		<ul class="right">
			<li v-if="editable"><action-button icon="save" :f="save" importance="high">{{ t('save') }}</action-button></li>
			<li v-if="editable"><action-button icon="window-close" :f="discard" importance="low">{{ t('cancel') }}</action-button></li>
			<li v-if="!editable && workspace.canWrite ()"><action-button icon="edit" :f="makeTitleEditable" importance="medium">{{ t('edit') }}</action-button></li>
			<li><action-button v-if="workspace.canShare ()" icon="share" :f="doShare">{{ t('share') }}</action-button></li>
			<li><action-button v-if="workspace.canRead()" icon="copy" :f="doCopy">{{ t('copy') }}</action-button></li>
			<li><action-button icon="trash" :f="doDelete">{{ workspace.canDelete() ? t('delete') : t('hide') }}</action-button></li>
		</ul>
		</div>

		<h3 class="title">
			<input type="text" v-if="editable" :placeholder="t('projectname')" :value="name">
			<span v-else-if="hasName" v-text="name"></span>
			<span v-else class="placeholder" @click="makeTitleEditable">{{ t('noTitle') }}</span>
		</h3>

		<ul class="metadata">
			<li class="owners">
				<i class="fa fa-user"></i>
				{{ t('ownedby') }}
				{{ workspace.owner () }}
			</li>
			<li v-if="sharedWith.length > 0" class="shared">
			<i class="fa fa-users"></i>
			{{ t('sharedwith') }}
			<ul>
				<li v-for="[k, v] of sharedWith">
				{{ k }} ({{ permissionsToHuman (v) }})
				<action-button v-if="workspace.canShare()" icon="trash" :f="_ => doDeleteShare(k)" importance="small"></action-button>
				</li>
			</ul>
			</li>
		</ul>

		<p class="description">
			<textarea v-if="editable" :placeholder="t('projectdescription')" v-text="description"></textarea>
			<span v-else-if="hasDescription" v-text="description"></span>
			<span v-else class="placeholder" @click="makeDescriptionEditable">{{ t('noDescription') }}</span>
		</p>
		<application-list :workspace="workspace"></application-list>
	</div>`,
	computed: {
		name: function () { return this.workspace.metadata.name },
		hasName: function () { return this.editable || this.workspace.metadata.name },
		description: function () { return this.workspace.metadata.description },
		hasDescription: function () { return this.editable || this.workspace.metadata.description },
		sharedWith: function () { return Object.entries (this.workspace.permissions).filter (([k, v]) => (!v.includes ('t'))) },
	},
    methods: {
		makeEditable: async function (focus) {
			this.editable = true;
			if (focus) {
				/* make sure the elements are rendered */
				await Vue.nextTick ();
				console.log ('focus is', focus, this.$el, this.$el.querySelector (focus));
				this.$el.querySelector (focus).focus ();
			}
		},
		makeTitleEditable: function () {
			this.makeEditable('.title input');
		},
		makeDescriptionEditable: function () {
			this.makeEditable('.description textarea');
		},
		save: async function () {
			await this.onUpdate (this.$el.querySelector ('.title input').value, this.$el.querySelector ('.description textarea').value);
			this.editable = false;
		},
		discard: async function () {
			this.editable = false;
		},
		doDelete: async function () {
			await this.onDelete (this.workspace);
		},
		doDeleteShare: async function (group) {
			await this.onDeleteShare (this.workspace, group);
		},
		doShare: async function (a) {
			await this.onShare (this.workspace);
		},
		doCopy: async function () {
			await this.onCopy (this.workspace);
		},
		permissionsToHuman (p) {
			const canRead = p.includes ('r');
			const canWrite = p.includes ('w');
			if (canRead && canWrite) {
				return this.t('readwrite');
			} else if (canRead) {
				return this.t('readonly');
			}
			return this.t('noaccess');
		},
    }
});

Vue.component('application-list', {
	props: ['workspace'],
	template: `<div class="applications">
	<application-item
		v-for="a in workspace.runnableApplications()"
		:application="a"
		:workspace="workspace"
		:key="a._id"></application-item>
	</div>`,
});

Vue.component('application-item', {
    props: ['workspace', 'application'],
	mixins: [i18nMixin],
	data: _ => ({
		strings: translations({
			de: {
				'run': 'Starten',
				},
			en: {
				'run': 'Run',
				},
			}),
		}),
    template: `<div class="pure-g application">
		<div class="pure-u-md-4-5 pure-u-1">
			<img v-if="icon" :src="icon" style="height: 3em; vertical-align: middle;">
			{{ name }}. {{ description }}
		</div>
		<div class="pure-u-md-1-5 pure-u-1 actions">
		<router-link :to="{name: 'application', params: {wsid: workspace.metadata._id, appid: application._id}}" class="btn medium">
			<i class="fas fa-play"></i> {{ t('run') }}
		</router-link>
		</div></div>`,
	computed: {
		icon() {
			return this.application.icon ? `/assets/img/${this.application.icon}.svg` : null;
		},
		name() {
			let name = this.application[`name[${this.language}]`];
			if (!name) {
				name = this.application.name;
			}
			return name;
		},
		description() {
			let desc = this.application[`description[${this.language}]`];
			if (!desc) {
				desc = this.application.description;
			}
			return desc;
		},
	}
});

Vue.component('login-item', {
    props: ['session'],
	data: _ => ({strings: translations ({
		de: {
			'login': 'Anmelden',
			'logout': 'Abmelden',
			'account': 'Benutzerkonto',
			},
		en: {
			'login': 'Login',
			'logout': 'Logout',
			'account': 'Account',
			}})}),
    template: `<li v-if="session === null || !session.authenticated ()">
		<a href="/api/session/login">{{ t('login') }}</a></li>
		<li v-else>
			<details class="usermenu">
				<summary><span class="initials">{{ initials }}</span></summary>
				<ul>
					<li><router-link :to="{name: 'account'}">{{ t('account') }}</router-link></li>
					<li><router-link :to="{name: 'logout'}">{{ t('logout') }}</router-link></li>
				</ul>
			</details>
		</li>`,
	mixins: [i18nMixin],
	computed: {
		authenticated: function () {
			return this.session && this.session.authenticated ();
		},
		initials: function () {
			if (this.authenticated) {
				const info = this.session.oauthInfo;
				return `${info.given_name[0]}${info.family_name[0]}`;
			}
		}
	}
});

/*	Simple modal, which closes (or rather: emits an event) when clicking
 *	outside of its content box
 */
Vue.component ('modal', {
	props: ['visible', 'onHide', 'icon', 'title', 'closename'],
	template: `<transition name="fade">
	<div class="modal-overlay" v-if="visible" @click.self="onHide">
		<div class="modal-content">
			<div class="icon">
				<h2><i :class="iconStyle"></i></h2>
			</div>
			<div style="flex-grow: 1">
				<h2>{{ title }}</h2>
				<slot></slot>
				<div class="buttons">
					<slot name="buttons"></slot>
					<button @click="onHide" class="btn low">{{ closename }}</button>
				</div>
			</div>
		</div>
	</div>
	</transition>`,
	computed: {
		iconStyle: function () {
			return `fas fa-${this.icon}`;
		},
	},
});

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
                Leibniz-Zentrum für Psychologische Information und
                Dokumentation (ZPID)<br>
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

const WorkspacesView = Vue.extend ({
	template: `<div class="workspace-list">
		<h2>{{ t('projects') }}</h2>
		<div style="display: flex">
		<div style="flex-grow: 2"><p>{{ t('description') }}</p></div>
		<div style="" v-if="!disabled">
			<p><action-button icon="plus-square" :f="createWorkspace" importance="high">{{ t('create') }}</action-button></p>
		</div>
		</div>
		<form class="filter">
		<div>
			<input type="radio" name="filter" value="mine" id="filtermine" v-model="filter">
			<label for="filtermine">{{ t('myprojects') }}</label>
		</div>
		<div>
			<input type="radio" name="filter" value="shared" id="filtershared" v-model="filter">
			<label for="filtershared">{{ t('sharedprojects') }}</label>
		</div>
		</form>
		<table class="workspaces" v-if="filteredWorkspaces.length > 0">
		<thead>
			<tr>
				<th class="title">{{ t('thtitle') }}</th>
				<th class="description">{{ t('thdescription') }}</th>
				<th class="actions">{{ t('thactions') }}</th>
			</tr>
		</thead>
		<tbody>
		<tr v-for="w in filteredWorkspaces" :key="w.metadata._id">
			<td class="title">
				<router-link :to="{name: 'workspace', params: {wsid: w.metadata._id}}">
					<span v-if="w.metadata.name">{{ w.metadata.name }}</span>
					<span v-else class="placeholder">{{ t('unnamed') }}</span>
				</router-link>
			</td>
			<td class="description">
				<router-link :to="{name: 'workspace', params: {wsid: w.metadata._id}}">
					<span v-if="w.metadata.description">{{ w.metadata.description }}</span>
					<span v-else>&nbsp;</span>
				</router-link>
			</td>
			<td class="actions">
				<ul>
					<li v-for="a in w.runnableApplications ()" :key="a._id">
						<router-link :to="{name: 'application', params: {wsid: w.metadata._id, appid: a._id}}">
							<img v-if="icon(a)" :src="icon(a)" style="height: 1.5em; vertical-align: middle;">
						</router-link>
					</li>
				</ul>
			</td>
		</tr>
		</tbody>
		</table>
	</div>`,
	data: _ => ({
		state: store.state,
		name: '',
		filter: 'mine',
		strings: translations({
			de: {
				'projects': 'Projekte',
				'description': 'Hier können Projekte eingerichtet und aufgerufen werden. Projekte sind Sammlungen von Analyseskripten, Daten und anderen Materialien.',
				'projectname': 'Projektname',
				'create': 'Neues Projekt',
				'unnamed': 'Unbenanntes Projekt',
				'myprojects': 'Meine Projekte',
				'sharedprojects': 'Geteilte Projekte',
				'thtitle': 'Titel',
				'thdescription': 'Beschreibung',
				'thactions': 'Aktionen',
				},
			en: {
				'projects': 'Projects',
				'description': 'Projects can be set up and accessed here. Projects are collections of analysis scripts, data, and other materials.',
				'projectname': 'Project name',
				'create': 'New project',
				'unnamed': 'Unnamed project',
				'myprojects': 'My projects',
				'sharedprojects': 'Shared projects',
				'thtitle': 'Title',
				'thdescription': 'Description',
				'thactions': 'Actions',
				},
			}),
		}),
	mixins: [i18nMixin],
	computed: {
		disabled: function() { return !this.state.workspaces || this.state.workspaces instanceof Error; },
		filteredWorkspaces: function () {
			const filterFunc = {
				mine: w => w.canShare (),
				shared: w => !w.canShare(),
				};
			if (!this.disabled) {
				return this.state.workspaces.all().filter (filterFunc[this.filter]).sort (Workspace.compareName);
			} else {
				return [];
			}},
	},
	methods: {
        createWorkspace: async function(data) {
			const w = await this.state.workspaces.create (this.name);
			this.$router.push ({name: 'workspace', params: {wsid: w.metadata._id}});
        },
		formatDate: function (d) {
			return new Intl.DateTimeFormat ('de-DE', {day: 'numeric', month: 'long', year: 'numeric'}).format(d);
		},
		icon(a) {
			return a.icon ? `/assets/img/${a.icon}.svg` : null;
		},
		goTo(wsid) {
			this.$router.push ({name: 'workspace', params: {wsid: wsid}});
		}
	}
});

const WorkspaceView = Vue.extend ({
	props: ['wsid'],
	template: `<div>
		<!-- template content is evaluated even if :visible is false, need to block using v-if -->
		<modal :visible="queryDelete" :onHide="_ => queryDelete=false" v-if="currentWorkspace" icon="trash" :title="canDelete ? t('deletetitle') : t('hidetitle')" :closename="t('cancel')">
			<p>{{ canDelete ? t('deletequestion', { name: currentWorkspace.metadata.name }) : t('hidequestion', {name: currentWorkspace.metadata.name}) }}</p>
			<template v-slot:buttons>
				<action-button :f="deleteWorkspace" icon="trash" importance="high">{{ canDelete ? t('delete') : t('hide') }}</action-button>
			</template>
		</modal>
		<modal :visible="modalShare" :onHide="_ => modalShare=false" icon="users" :title="t('sharetitle')" :closename="t('close')">
			<select v-model="selectedShareUrl" name="shareKind" size="0">
			<option selected="selected" :value="false" class="read">{{ t('read') }}</option>
			<option :value="true" class="write">{{ t('write') }}</option>
			</select>
			</p>
			<div>
				<label for="shareUrl">{{ t('sharelink') }}</label>
				<div class="textbutton">
					<input type="text" v-model="shareUrl[selectedShareUrl]" id="shareUrl" readonly="readonly">
					<action-button :f="_ => copyToClipboard(shareUrl[selectedShareUrl])" icon="copy" importance="high">{{ t('copy') }}</action-button>
				</div>
			</div>
		</modal>
		<workspace-item v-if="currentWorkspace"
			:workspace="currentWorkspace"
			:onDelete="askDeleteWorkspace"
			:onUpdate="updateWorkspace"
			:onShare="shareWorkspace"
			:onDeleteShare="deleteShare"
			:onCopy="copyWorkspace"></workspace-item>
		<p v-else>{{ t('nonexistent') }}</p></div>`,
	data: _ => ({
		state: store.state,
		queryDelete: false,
		/* share url for reading (false), writing (true) */
		shareUrl: {false: null, true: null},
		selectedShareUrl: false,
		modalShare: false,
		strings: translations({
			de: {
				'deletetitle': 'Projekt löschen',
				'hidetitle': 'Projekt verbergen',
				'deletequestion': 'Soll das Projekt %{name} wirklich gelöscht werden?',
				'hidequestion': 'Soll das Projekt %{name} wirklich verborgen werden?',
				'delete': 'Löschen',
				'hide': 'Verbergen',
				'cancel': 'Abbrechen',
				'nonexistent': 'Projekt existiert nicht.',
				'sharetitle': 'Projekt teilen',
				'share': 'Teilen',
				'close': 'Schließen',
				'copy': 'Kopieren',
				'read': 'Nur Lesen',
				'write': 'Schreibzugriff',
				'copyname': 'Kopie von %{name}', /* name after copying a project */
				'sharelink': 'Teile den folgenden Link',
				},
			en: {
				'deletetitle': 'Delete project',
				'hidetitle': 'Hide project',
				'deletequestion': 'Do you really want to delete the project %{name}?',
				'hidequestion': 'Do you really want to hide the project %{name}?',
				'delete': 'Delete',
				'hide': 'Hide',
				'cancel': 'Cancel',
				'nonexistent': 'Project does not exist.',
				'sharetitle': 'Share project',
				'share': 'Share',
				'close': 'Close',
				'copy': 'Copy',
				'read': 'Read-only',
				'write': 'Write access',
				'copyname': 'Copy of %{name}', /* name after copying a project */
				'sharelink': 'Share the link below',
				},
			}),
	}),
	mixins: [i18nMixin],
	computed: {
		workspaces: function () { return this.state.workspaces; },
		currentWorkspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		canDelete: function () {
			return this.currentWorkspace.canDelete ();
		}
	},
	methods: {
		askDeleteWorkspace: async function () {
			this.queryDelete = true;
		},
        deleteWorkspace: async function() {
			if (this.canDelete) {
				await this.workspaces.delete (this.currentWorkspace);
			} else {
				await this.workspaces.ignore (this.currentWorkspace);
			}
			this.$router.push ({name: 'workspaces'});
        },
        shareWorkspace: async function() {
			/* async resolve both actions */
			const keys = [false, true];
			const values = await Promise.all (keys.map (function (isWrite) {
				return this.workspaces.shareAction (this.currentWorkspace, isWrite);
			}.bind (this)));
			for (let i = 0; i < keys.length; i++) {
				const isWrite = keys[i];
				const token = values[i];
				const ident = 'share-' + (isWrite ? 'write' : 'readonly');
				this.shareUrl[isWrite] = new URL (`/action/${token}#${ident}`, window.location.href);
			}
			this.modalShare = true;
		},
		copyToClipboard: async function(text) {
			if (navigator.clipboard) {
				const ret = await navigator.clipboard.writeText (text);
				return true;
			} else {
				throw Error ('unsupported');
			}
		},
        updateWorkspace: async function(name, description) {
			const w = this.currentWorkspace;
			Vue.set (w.metadata, 'name', name);
			Vue.set (w.metadata, 'description', description);
            await this.workspaces.update (this.currentWorkspace);
		},
		deleteShare: async function (ws, group) {
			await this.workspaces.unshare (ws, group);
		},
		copyWorkspace: async function (ws) {
			const newws = await this.workspaces.copy (ws);
			Vue.set (newws.metadata, 'name', this.t('copyname', {name: newws.metadata.name}));
            await this.workspaces.update (newws);
			/* then go there */
			this.$router.push ({name: 'workspace', params: {wsid: newws.metadata._id}});
		},
	}
});

const TermsOfServiceView = Vue.extend ({
	props: ['next'],
	template: `<div><h2>Nutzungsbedingungen</h2>
		<p>Zurzeit keine Nutzungsbedingungen hinterlegt.</p>
	</div>`,
});

const ApplicationView = Vue.extend ({
	props: ['wsid', 'appid', 'nextUrl'],
	template: `<aside class="appoverlay">
		   <header class="pure-g">
				   <div class="pure-u-1-5 back">
						   <router-link :to="{name: 'workspaces'}">{{ t('projects') }}</router-link>
				   </div>
				   <div class="pure-u-3-5 title">
						   <router-link v-if="workspace" :to="{name: 'workspace', params: {wsid: workspace.metadata._id}}"><img :src="icon"> {{ workspace.metadata.name }}</router-link>
				   </div>
				   <div class="pure-u-1-5 logo">
						   <router-link :to="{name: 'index'}"><img src="https://www.lifp.de/assets/images/psychnotebook.svg" style="height: 1.5em; filter: invert(100%) opacity(50%);"></router-link>
				   </div>
		   </header>
		<p v-if="!workspace">{{ t('nonexistentws') }}</p>
		<p v-else-if="!application">{{ t('nonexistent') }}</p>
		<iframe v-else-if="url" frameborder="0" name="appframe" :src="url"></iframe>
		<div v-else-if="dummy && program" class="loading">
			<details>
				<summary>
				<span v-if="program.error !== null">{{ t('failed', {reason: program.error}) }}</span>
				<span v-else-if="program.state == ConductorState.starting">{{ t('starting') }}<br><spinner :big="true"></spinner></span>
				<span v-else-if="program.state == ConductorState.exited">{{ t('exited') }}</span>
				</summary>
				<pre class="log" v-if="program && program.output">{{ program.output }}</pre>
			</details>
		</div>
	</aside>`,
	data: _ => ({
		state: store.state,
		program: null,
		ConductorState: ConductorState,
		strings: translations({
			de: {
				'nonexistent': 'Anwendung existiert nicht.',
				'nonexistentws': 'Projekt existiert nicht.',
				'starting': 'Anwendung wird gestartet…',
				'exited': 'Anwendung wurde beendet.',
				'failed': 'Anwendung konnte nicht ausgeführt werden. (%{reason})',
				'projects': 'Projekte',
				},
			en: {
				'nonexistent': 'Application does not exist.',
				'nonexistentws': 'Project does not exist.',
				'starting': 'Starting application…',
				'exited': 'Application finished.',
				'failed': 'Application failed to run. (%{reason})',
				'projects': 'Projects',
				},
		}),
	}),
	mixins: [i18nMixin],
	computed: {
		/* argument is a string */
		workspace: function() {
			if (this.state.workspaces) {
				return this.state.workspaces.getById (this.wsid);
			}
		},
		application: function () {
			if (!this.state.workspaces) {
				return null;
			}
			const workspace = this.state.workspaces.getById (this.wsid);
			if (!workspace) {
				return null;
			}
			return workspace.applications.filter(elem => elem._id == this.appid)[0];
		},
		icon: function () {
			return this.application && this.application.icon ? `/assets/img/${this.application.icon}.svg` : null;
		},
		url: function () {
			console.log ('program is', this.program);
			if (!this.program || !this.program.url ()) {
				return null;
			}
			const u = new URL (this.program.url ());
			if (this.nextUrl) {
				u.searchParams.append ('next', this.nextUrl);
			}
			return u.toString ();
		},
		key: function () {
			const workspace = this.workspace;
			const application = this.application;
			return workspace.metadata._id + '+' + application._id;
		},
		dummy: function () {
			console.log ('application changed');
			const workspace = this.workspace;
			const application = this.application;
			const p = this.state.applications.get (this.key);
			if (!p) {
				console.log ('starting new instance of', workspace, application);
				this.program = null;
				store.startApplication (workspace, application).then (function (program) { this.program = program}.bind (this));
			} else {
				console.log ('using running instance of', workspace, application);
				this.program = p;
			}
			return true;
		},
	},
	watch: {
		'program.state': function () {
			/* go back to workspace if program exited */
			if (this.program.state == ConductorState.exited && this.program.error === null) {
				this.$router.push ({name: 'workspace', params: {wsid: this.workspace.metadata._id}});
			}
		},
	},
});

/* XXX: we should do better and provide attribution to the main software
 * components we are using */
const LegalView = Vue.extend ({
	template: `<div>
	<h2>{{ t('headline') }}</h2>
	<h3 id="impressum">{{ t('imprint') }}</h3>
	<address><p>
	<strong>Leibniz-Zentrum für Psychologische Information
	und Dokumentation (ZPID)</strong><br>
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
				'softwareLicenses': 'Softwarelizenzen',
				'softwareLicensesBody': 'Diese Plattform bietet Zugriff auf RStudio Server, welche unter den Bedingungen der <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">GNU Affero General Public License Version 3</a> zur Verfügung gestellt wird. Den Quelltext von RStudio Server findest Du <a href="https://github.com/rstudio/rstudio/">auf GitHub</a>. Unsere Änderungen daran sind in unserem <a href="https://github.com/leibniz-psychology/guix-zpid">guix-Kanal</a> einsehbar.',
				},
			en: {
				'headline': 'Legal notice',
				'imprint': 'Imprint',
				'softwareLicenses': 'Software licenses',
				'softwareLicensesBody': 'This platform provides access to RStudio Server, released under the terms of the <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">GNU Affero General Public License Version 3</a>. The source code is available <a href="https://github.com/rstudio/rstudio/">on GitHub</a>. Our changes are made public via our <a href="https://github.com/leibniz-psychology/guix-zpid">guix channel</a>.',
				},
			}),
	}),
	mixins: [i18nMixin],
});

const IndexView = Vue.extend ({
	template: `<div>
	<p>{{ t('description') }}</p>
	<p v-if="state.user === null || state.user.isAnonymous">
		<a class="btn high" href="/api/session/login">{{ t('login') }}</a>
	</p>
	<p v-else-if="haveWorkspaces"><router-link class="btn high" :to="{name: 'workspaces'}">{{ t('toprojects') }}</router-link></p>
	<p v-else><i class="fa fa-exclamation-triangle"></i> {{ t('locked') }}</p>
</div>`,
	data: _ => ({
		state: store.state,
		/* application strings */
		strings: translations ({
			de: {
				'description': 'PsychNotebook ist eine web-basierte Plattform für die Planung und Analyse von Studien aus dem Gebiet der Psychologie und verwandter Disziplinen.',
				'login': 'Anmelden',
				'toprojects': 'Zu meinen Projekten',
				'locked': 'Dein Benutzerkonto ist zurzeit gesperrt. Bitte kontaktiere einen Administrator.',
				},
			en: {
				'description': 'PsychNotebook is a web-based platform for planning and analyzing studies in the field of psychology and related disciplines.',
				'login': 'Login',
				'toprojects': 'Go to my projects',
				'locked': 'Your account is locked right now. Please contact an administrator.',
				},
			}),
	}),
	computed: {
		haveWorkspaces: function () {
			return store.haveWorkspaces ();
		},
	},
	mixins: [i18nMixin],
});

const AccountView = Vue.extend ({
	template: `<div>
		<modal :visible="queryDelete" :onHide="_ => queryDelete=false" icon="trash" :title="t('delete')" :closename="t('cancel')">
			<p>{{ t('deletequestion') }}</p>
			<template v-slot:buttons>
				<action-button :f="deleteAccount" icon="trash" importance="high">{{ t('dodelete') }}</action-button>
			</template>
		</modal>
	<h2>{{ t('headline') }}</h2>
	<dl>
		<dt>{{ t('name') }}</dt>
		<dd>{{ oauthInfo.given_name }} {{ oauthInfo.family_name }}</dd>

		<dt>{{ t('email') }}</dt>
		<dd><a :href="mailto(oauthInfo.email)">{{ oauthInfo.email }}</a></dd>

		<dt>{{ t('unixaccount') }}</dt>
		<dd>{{ state.user.name }}</dd>
	</dl>
	<h3>{{ t('delete') }}</h3>
	<p v-if="canDelete">
		<action-button :f="askDeleteAccount" icon="trash">{{ t('delete') }}</action-button>
	</p>
	<p v-else><i class="fa fa-exclamation-triangle"></i> {{ t('locked') }}</p>
</div>`,
	data: _ => ({
		state: store.state,
		/* application strings */
		strings: translations ({
			de: {
				'headline': 'Mein Benutzerkonto',
				'delete': 'Benutzerkonto löschen',
				'deletequestion': 'Möchtest Du Dein Benutzerkonto und alle gespeicherten Daten wirklich löschen? Die kann nicht rückgängig gemacht werden.',
				'dodelete': 'Unwiderruflich löschen',
				'cancel': 'Abbrechen',
				'name': 'Name',
				'email': 'E-Mail-Adresse',
				'unixaccount': 'UNIX-Nutzername',
				'locked': 'Du kannst Dein Konto derzeit nicht löschen. Bitte kontaktiere einen Administrator.',
				},
			en: {
				'headline': 'My account',
				'delete': 'Delete account',
				'deletequestion': 'Do you want to delete your account and all data? This cannot be undone.',
				'dodelete': 'Delete permanently',
				'cancel': 'Cancel',
				'name': 'Name',
				'email': 'Email address',
				'unixaccount': 'UNIX account name',
				'locked': 'You cannot delete your account at this time. Please contact an administrator.',
				},
			}),
		queryDelete: false,
	}),
	computed: {
		oauthInfo: function () {
			return this.state.session.oauthInfo;
		},
		canDelete: function () {
			return store.haveWorkspaces ();
		},
	},
	methods: {
		mailto: function (a) {
			return `mailto:${a}`;
		},
		askDeleteAccount: function () {
			this.queryDelete = true;
		},
		deleteAccount: async function () {
			let r = await fetch ('/api/user', {
				'method': 'DELETE'
			});
			if (r.ok) {
				Vue.set (this.state, 'user', null);
				await this.state.session.destroy ();
				this.$router.push ({name: 'index'});
			} else {
				console.log(r);
			}
		}
	},
	mixins: [i18nMixin],
});

const LogoutView = Vue.extend ({
	template: `<div><h2>{{ t('logout') }}</h2>
	<p v-if="!done">{{ t('logout') }} <spinner></spinner></p>
	<p v-else>{{ t('done') }} <a :href="ssoLogoutUrl">{{ t('ssologout') }}</a>.</p>
</div>`,
	data: _ => ({
		done: false,
		strings: translations({
			'de': {
				'logout': 'Abmelden',
				'done': 'Du wurdest von PsychNotebook abgemeldet.',
				'ssologout': 'Vom Single-Sign-On abmelden',
				},
			'en': {
				'logout': 'Logout',
				'done': 'You have been logged off from PsychNotebook.',
				'ssologout': 'Log off from single-sign-on as well',
				},
			}),
		}),
	computed: {
		ssoLogoutUrl: function () {
			const resolved = this.$router.resolve ({name: 'index'});
			const redirectUrl = new URL (resolved.href, window.location.href);
			const u = new URL ('https://sso.leibniz-psychology.org/auth/realms/ZPID/protocol/openid-connect/logout');
			u.searchParams.append ('redirect_uri', redirectUrl);
			return u;
		},
	},
	created: async function () {
		await store.state.ready.wait ();

		await store.state.session.destroy ();
		await store.init ();
		this.done = true;
	},
	mixins: [i18nMixin],
});

const LoginView = Vue.extend ({
	props: ['status'],
	template: `<div><h2>{{ t('login') }}</h2>
		<p>{{ message }}</p>
	</div>`,
	data: _ => ({
		strings: translations({
			'de': {
				'login': 'Anmelden',
				'status-failure': 'Die Anmeldung war nicht erfolgreich. Bitte versuche es noch einmal.',
				'status-success': 'Angemeldet',
				},
			'en': {
				'login': 'Login',
				'status-failure': 'Login was not successful. Please try again.',
				'status-success': 'Logged in',
				},
			}),
		}),
	computed: {
		message: function () {
			var m = this.t('status-' + this.status, this.t('status-failure'));
			return m;
		},
	},
	created: async function () {
		if (this.status == 'success') {
			if (store.haveWorkspaces ()) {
				this.$router.push ({name: 'workspaces'});
			} else {
				this.$router.push ({name: 'index'});
			}
		}
	},
	mixins: [i18nMixin],
});

const ActionView = Vue.extend ({
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

	 	/* XXX: wait for init to complete */
	 	console.log ('executing action', this.token);
	 	const r = await fetch ('/api/action/' + this.token);
	 	try {
	 		const a = await getResponse (r);
	 		console.log ('got action', a);
	 		switch (a.name) {
	 			case 'run': {
	 				console.log ('got run action');
	 				const p = await this.state.rpc.run (null, this.token);
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
			if (e == 'unauthenticated') {
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

const NotFoundView = Vue.extend ({
	template: `<div><h2>{{ t('notfound') }}</h2></div>`,
	data: _ => ({
		strings: translations({
			'de': {
				'notfound': 'Nicht gefunden',
				},
			'en': {
				'notfound': 'Not found',
				},
			}),
		}),
	mixins: [i18nMixin],
});

const routes = [
	{ path: '/terms', component: TermsOfServiceView, name: 'terms', props: (route) => ({ next: route.query.next }) },
	{ path: '/legal', component: LegalView, name: 'legal' },
	{ path: '/workspaces', component: WorkspacesView, name: 'workspaces' },
	{ path: '/workspaces/:wsid', component: WorkspaceView, name: 'workspace', props: true },
	{ path: '/workspaces/:wsid/:appid/:appPath*',
		component: ApplicationView,
		name: 'application',
		props: function (route) {
			console.log ('params', route.params);
			const appPath = route.params.appPath;
			let nextUrl = '/' + (appPath ? appPath : '');
			const params = new URLSearchParams (route.query);
			nextUrl += '?' + params.toString ();
			return {wsid: route.params.wsid, appid: route.params.appid, nextUrl: nextUrl};
		},
		meta: { layout: 'fullscreen' } },
	{ path: '/action/:token', component: ActionView, name: 'action', props: true },
	{ path: '/account', component: AccountView, name: 'account' },
	{ path: '/logout', component: LogoutView, name: 'logout' },
	{ path: '/login/:status', component: LoginView, name: 'login', props: true },
	{ path: '/', component: IndexView, name: 'index' },
	{ path: '*', component: NotFoundView }
]

const router = new VueRouter({
	routes: routes,
	mode: 'history',
	scrollBehavior: function (to, from, savedPosition) {
		/* Use sensible scrolling behavior when changing page */
		if (to.hash) {
			return { selector: to.hash };
		} else if (savedPosition) {
			return savedPosition;
		} else {
			return { x: 0, y: 0 };
		}
	},
});

const app = new Vue({
    el: '#app',
    data: _ => ({
		state: store.state,
		loading: true,
		strings: translations ({
			de: {
				'nav.projects': 'Projekte',
				'loading': 'Einen Moment bitte…',
				},
			en: {
				'nav.projects': 'Projects',
				'loading': 'Just a second…',
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
			return this.$route.matched[0].meta.layout == 'fullscreen';
		},
		htmlClass: function () {
			return this.fullscreen ? 'fullscreen' : '';
		},
		haveWorkspaces: function () {
			return store.haveWorkspaces ();
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


/* turn HTTP response into a meaningful exception */
async function getResponse (r) {
	const j = await r.json ();
	if (r.ok) {
		return j;
	} else if (r.status == 403 && (j.status == 'no_tos' || j.status == 'new_tos')) {
		throw 'need_tos';
	} else if (j.status) {
		throw j.status;
	}
	throw 'bug';
}

/* shared app state */
let store = {
	state: {
		user: {},
		workspaces: [],
	},

	initUser: async function () {
		const r = await fetch ('/api/auth');
		const user = await r.json();
		Vue.set (this.state, 'user', user);
	},

	logout: async function () {
		let r = await fetch ('/api/session', {
			'method': 'DELETE'
		});
		if (r.ok) {
			Vue.set (this.state, 'user', null);
		} else {
			console.log(r);
		}
	},

	initWorkspaces: async function () {
		const r = await fetch ('/api/workspace');
		try {
			const j = await getResponse (r);
			Vue.set (this.state, 'workspaces', j.map (function (w) { w.created = new Date (w.created*1000); return w; }));
		} catch (e) {
			Vue.set (this.state, 'workspaces', []);
			throw e;
		} finally {
			this.loading = false;
		}
	},

	createWorkspace: async function () {
		const r = await postData('/api/workspace', {
			'name': null,
			'description': null
		});
		let j = await getResponse (r);
		// XXX: create Workspace class
		j.created = new Date (j.created*1000);
		this.state.workspaces.push(j);
		return j;
	},
	deleteWorkspace: async function(w) {
		let wid = w.id;
		let r = await fetch('/api/workspace/' + wid, { 'method': 'DELETE' });
		const j = await getResponse (r);
		this.state.workspaces = this.state.workspaces.filter(elem => elem.id != wid);
	},
	updateWorkspace: async function(w) {
		const r = await postData('/api/workspace/' + w.id, {
			'name': w.name,
			'description': w.description
		});
		let j = await getResponse (r);
		// already applied to internal model
		return j;
	},
	shareWorkspace: async function(w) {
		const r = await postData('/api/workspace/' + w.id + '/share/action', {});
		let j = await getResponse (r);
		// already applied to internal model
		return j;
	},
	startApplication: async function(w, a) {
		let r = await fetch('/api/application/' + a.id, { 'method': 'POST' });
		const j = await getResponse (r);
		Vue.set (a, 'url', j.url);
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

Vue.component ('spinner', {
	template: `<i class="fas fa-spin fa-spinner"></i>`
});

Vue.component('action-button', {
	props: ['icon', 'f', 'importance'],
	data: function () { return {busy: false, lastError: null} },
	template: `<button v-on:click="clicked" :class="btnclass"><i :class="iconclass"></i> <slot></slot></button>`,
	computed: {
		iconclass: function () {
			if (this.lastError) {
				return "fas fa-exclamation-triangle";
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
				this.lastError = null;

				this.busy = true;
				try {
					await this.f ();
				} catch (e) {
					console.log (e);
					this.lastError = e;
					this.busy = false;
					throw e;
				}
				this.busy = false;
			}
		},
	}
});

Vue.component('workspace-item', {
    props: ['workspace', 'onDelete', 'onStart', 'onUpdate', 'onShare'],
	data: function () { return {'editable': false} },
    template: `<div class="workspaceItem">
		<ul class="actions">
		<li>
			<action-button v-if="editable" icon="save" :f="save" importance="high">Speichern</action-button>
			<action-button v-else icon="edit" :f="makeEditable" importance="medium">Bearbeiten</action-button>
		</li>
		<li><action-button icon="share" :f="doShare">Teilen</action-button></li>
		<li><action-button icon="trash" :f="doDelete">Löschen</action-button></li>
		<li><router-link class="btn low" :to="{name: 'workspaces'}">Zurück zur Übersicht</router-link></li>
		</ul>

		<h3 :contenteditable="editable" class="title">{{ workspace.name ? workspace.name : 'Unbenannt' }}</h3>

		<p :contenteditable="editable" class="description">{{ workspace.description ? workspace.description : '(Keine Beschreibung)' }}</p>
		<dl v-if="workspace.sshUser && workspace.sshPassword">
			<dt>User</dt>
			<dd>{{ workspace.sshUser }}</dd>
			<dt>Password</dt>
			<dd>{{ workspace.sshPassword }}</dd>
		</dl>
		<application-list :applications="workspace.applications" :onStart="doStart"></application-list>
	</div>`,
    methods: {
		makeEditable: function () { this.editable = true; },
		save: async function () {
			await this.onUpdate (this.$el.querySelector ('.title').innerText, this.$el.querySelector ('.description').innerText);
			this.editable = false;
		},
		doDelete: async function () {
			await this.onDelete (this.workspace);
		},
		doStart: async function (a) {
			await this.onStart (this.workspace, a);
		},
		doShare: async function (a) {
			await this.onShare (this.workspace);
		},
    }
});

Vue.component('application-list', {
	props: ['applications', 'onStart'],
	template: `<dl class="applications">
    <application-item
      v-for="a in applications"
      :application="a"
      :key="a.id"
	:onStart="onStart"
    ></application-item>
  </dl>`,
});

Vue.component('application-item', {
    props: ['application', 'onStart'],
    template: `<div><dt>
		<img :src="application.icon" style="height: 3em">
		</dt>
		<dd>
		<a :href="application.url" class="btn high" v-if="application.url">
		<i class="fas fa-external-link-square-alt"></i> Aufrufen</a>
		<action-button v-else icon="play" :f="doStart" importance="medium">Starten</action-button>
		</dd></div>`,
	methods: {
		doStart: async function () {
			await this.onStart (this.application);
		},
	},
});

Vue.component('login-item', {
    props: ['user'],
    template: `<li v-if="user === null || user.isAnonymous">
		<a href="/api/auth/login">Anmelden</a></li>
		<li v-else>
			Angemeldet als
			<span v-if="user.username">{{ user.username }}</span>
			<span v-else>{{ user.id }}</span>
			<router-link :to="{name: 'logout'}">Abmelden</router-link>
		</li>`,
});

Vue.component ('modal', {
	template: `<div class="modal-overlay">
		<div class="modal-content">
			<slot></slot>
		</div>
	</div>`
});

let Workspaces = Vue.extend ({
	template: `<div class="workspace-list">
		<h2>Arbeitsflächen</h2>
		<p>Hier kann man Dinge tun.</p>
		<action-button icon="plus-square" :f="createWorkspace" importance="high">Neue Arbeitsfläche erstellen</action-button>
		<div v-for="w in state.workspaces" :key="w.id" class="workspace">
			<h3><router-link :to="{name: 'workspace', params: {id: w.id}}">
				<span v-if="w.name">{{ w.name }}</span>
				<em v-else>Unbenannt</em>
				</router-link></h3>
		</div>
	</div>`,
	data: function () { return {'state': store.state, } },
	methods: {
        createWorkspace: async function(data) {
			let w = await store.createWorkspace ();
			this.$router.push ({name: 'workspace', params: {id: w.id}});
        },
		formatDate: function (d) {
			return new Intl.DateTimeFormat ('de-DE', {day: 'numeric', month: 'long', year: 'numeric'}).format(d);
		}
	}
});

let Workspace = Vue.extend ({
	props: ['id'],
	template: `<div>
		<modal v-if="queryDelete">
			<div class="pure-g">
				<div class="pure-u-1-5">
					<h2><i class="fas fa-question-circle"></i></h2>
				</div>
				<div class="pure-u-4-5">
				<h2>Arbeitsfläche löschen</h2>
				<p>Soll die Arbeitsfläche <em>{{ queryDelete.name }}</em> wirklich gelöscht werden?</p>
				<button @click="queryDelete=false" class="btn low">Abbrechen</button>
				<action-button :f="deleteWorkspace" icon="trash" importance="high">Löschen</action-button>
				</div>
			</div>
		</modal>
		<modal v-if="shareUrl">
			<div class="pure-g">
				<div class="pure-u-1-5">
					<h2><i class="fas fa-question-circle"></i></h2>
				</div>
				<div class="pure-u-4-5">
				<h2>Arbeitsfläche teilen</h2>
				<p>Sende den folgenden Link an die Person, mit der Du die Arbeitsfläche teilen möchtest. Bitte beachte: Der Empfänger kann <strong>alle Dateien einsehen und ändern</strong>.</p>
				<p><input readonly v-model="shareUrl"></p>
				<p><button class="btn high" @click="shareUrl=null">Schließen</button></p>
				</div>
			</div>
		</modal>
		<workspace-item :workspace="currentWorkspace" v-if="currentWorkspace" :onDelete="askDeleteWorkspace" :onUpdate="updateWorkspace" :onStart="startApplication" :onShare="shareWorkspace"></workspace-item>
		<p v-else>Arbeitsfläche existiert nicht.</p></div>`,
	data: function () { return { state: store.state, queryDelete: false, shareUrl: null, }; },
	computed: {
		currentWorkspace: function () { return this.state.workspaces.filter(elem => elem.id == this.id)[0]; }
	},
	methods: {
		askDeleteWorkspace: async function () {
			this.queryDelete = true;
		},
        deleteWorkspace: async function() {
			await store.deleteWorkspace (this.currentWorkspace);
			this.$router.push ({name: 'workspaces'});
        },
        updateWorkspace: async function(name, description) {
			let w = this.currentWorkspace;
			w.name = name;
			w.description = description;
            await store.updateWorkspace (this.currentWorkspace);
		},
        shareWorkspace: async function(w) {
            const j = await store.shareWorkspace (w);
			const resolved = this.$router.resolve ({name: 'action', params: {token: j.token}});
			this.shareUrl = new URL (resolved.href, window.location.href);
		},
        startApplication: async function(w, a) {
            await store.startApplication (w, a);
        },
	}
});

let TermsOfService = Vue.extend ({
	props: ['next'],
	template: `<div><h2>Nutzungsbedingungen</h2>
		<spinner v-if="loading"></spinner>
		<div v-else>
			<!--<p><router-link class="btn medium" :to="{name: 'terms-update'}">Aktualisieren</router-link></p>-->
			<div v-if="terms">
				<p v-if="!accepted">Bitte lies die folgenden Nutzungsbedingungen vom {{ createdHuman}} durch und akzeptiere diese.</p>
				<p v-else>Du hast die folgenden Nutzungsbedingungen vom {{ createdHuman }} bereits akzeptiert. <a class="btn low" @click="_ => change(false)" >Widerrufen</a></p>
				<div v-html="terms.content"></div>
				<p v-if="!accepted"><action-button :f="_ => change(true)" importance="high">Nutzungsbedingungen akzeptieren</action-button></p>
			</div>
			<p v-else>Zurzeit keine Nutzungsbedingungen hinterlegt.</p>
		</div>
	</div>`,
	data: function () { return { 'terms': null, loading: true, } },
    created: async function () {
		const r = await fetch('/api/tos');
		if (r.ok) {
			const j = await r.json();
			this.terms = {id: j.id, created: new Date (j.created*1000), enforce: new Date (j.enforce*1000), content: j.content};
			this.loading = false;
		} else {
			this.terms = null;
			this.loading = false;
		}
	},
	computed: {
		createdHuman: function () {
			return new Intl.DateTimeFormat ('de-DE', {day: 'numeric', month: 'long', year: 'numeric'}).format(this.terms.created);
		},
		accepted: function () {
			return store.state.user !== null &&
					store.state.user.acceptedTermsOfService !== null &&
					store.state.user.acceptedTermsOfService.id == this.terms.id;
		},
	},
	methods: {
		change: async function (accepted) {
            const r = await postData('/api/auth', {
                acceptedTermsOfService: (accepted ? this.terms.id : null),
            });
            if (r.ok) {
                const user = await r.json();
				store.state.user = user;
				await store.initWorkspaces ();
				if (this.next) {
					this.$router.push (this.next);
				}
            } else {
				throw 'updateFailed';
            }
		}
	}
});

let TermsOfServiceUpdate = Vue.extend ({
	template: `<form @submit.prevent="submit">
		<dl>
			<dt><label for="enforce">Zustimmung notwendig bis:</label></dt>
			<dd><input type="date" v-model="enforce" id="enforce"></dd>
			<dt><label for="content">Bedingungen (HTML erlaubt):</label></dt>
			<dd><textarea v-model="content" rows="20" cols="80"></textarea></dd>
		</dl>
		<button class="btn high">Speichern</button>
		</form>`,
	data: function () { return { 'content': null, 'enforce': null } },
    methods: {
		submit: async function (e) {
            const r = await postData('/api/tos', {
                'enforce': this.enforce,
                'content': this.content
            });
            if (r.ok) {
                const w = await r.json();
            } else {
				throw 'updateFailed';
            }
		}
	}
});

/* XXX: we should do better and provide attribution to the main software
 * components we are using */
let LegalView = Vue.extend ({
	template: `<div>
	<h2>Rechtliche Informationen</h2>
	<h3 id="impressum">Impressum</h3>
	<address><p>
	<strong>Leibniz-Zentrum für Psychologische Information
	und Dokumentation (ZPID)</strong><br>
	Universitätsring 15, 54296 Trier<br>
	Telefon: +49 (0)651 201-2877<br>
	Fax: +49 (0)651 201-2071<br>
	E-Mail: info(at)leibniz-psychology.org
	</p></address>
	<h3 id="softwarelizenzen">Softwarelizenzen</h3>
	<p>Diese Plattform bietet Zugriff auf RStudio Server, welche unter den Bedingungen der <a href="https://www.gnu.org/licenses/agpl-3.0.en.html">GNU Affero General Public License Version 3</a> zur Verfügung gestellt wird. Den Quelltext von RStudio Server findest Du <a href="https://github.com/rstudio/rstudio/tree/v1.2.5033">auf GitHub</a>. Unsere Änderungen daran sind in unserem <a href="https://github.com/leibniz-psychology/guix-zpid">guix-Kanal</a> einsehbar.</p>
</div>`,
});

let IndexView = Vue.extend ({
	template: `<div>
	<p>PsychNotebook ist eine web-basierte Plattform für die Planung und Analyse
von Studien aus dem Gebiet der Psychologie und verwandter Disziplinen.</p>
	<p v-if="state.user === null || state.user.isAnonymous">
		<a class="btn high" href="/api/auth/login">Anmelden</a>
		(Zurzeit ist eine Anmeldung nur nach Einladung möglich.)
	</p>
	<p v-else><router-link class="btn high" :to="{name: 'workspaces'}">Zu meinen Arbeitsflächen</router-link></p>
</div>`,
	data: function () { return { 'state': store.state }; },
});

let AccountView = Vue.extend ({
	template: `<div>
	<h2>Mein Benutzerkonto</h2>
	<p>Hier kann man Dinge tun.</p>
	<p>
		<action-button :f="deleteAccount" icon="trash">Nutzerkonto löschen</action-button>
	</p>
</div>`,
	data: function () { return { 'state': store.state }; },
	methods: {
		deleteAccount: async function () {
			let r = await fetch ('/api/auth', {
				'method': 'DELETE'
			});
			if (r.ok) {
				Vue.set (this.state, 'user', null);
			} else {
				console.log(r);
			}
		}
	},
});

let ActionView = Vue.extend ({
	props: ['token'],
	template: `<div>
	<h2>Aktion ausführen</h2>
	<p v-if="running">Einen Moment bitte <spinner></spinner></p>
	<p v-else>{{ message }}</p>
</div>`,
	data: _ => ({running: true, message: null}),
	created: async function () {
		const r = await postData('/api/action/' + this.token, {});
		try {
			let j = await getResponse (r);
			if (j.next == 'login') {
				this.message = 'Weiterleiten…';
				window.location.href = '/api/auth/login';
			} else {
				this.message = 'Aktion wurde ausgeführt.';
			}
		} catch (e) {
			if (e === 'need_tos') {
				this.$router.push ({name: 'terms', query: {next: this.$route.fullPath}});
			} else {
				const messages = {
					token_not_found: 'Diese Aktion existiert nicht.',
					expired: 'Diese Aktion ist abgelaufen.',
					};
				var m = messages[e];
				if (!m) {
					m = 'Es ist ein Fehler aufgetreten. Die Aktion wurde nicht ausgeführt.';
				}
				this.message = m;
			}
		} finally {
			this.running = false;
		}
	},
});

let LogoutView = Vue.extend ({
	template: `<div><h2>Abmelden</h2>
	<p v-if="!done">Abmelden <spinner></spinner></p>
	<p v-else>Du wurdest von PsychNotebook abgemeldet. <a :href="ssoLogoutUrl">Vom Single-Sign-On abmelden</a>.</p>
</div>`,
	data: _ => ({'done': false}),
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
		await store.logout ();
		await store.initUser ();
		try {
			await store.initWorkspaces ();
		} catch (e) {
		}
		this.done = true;
	}
});

let NotFound = Vue.extend ({
	template: `<div><h2>Nicht gefunden</h2></div>`,
});

const routes = [
	{ path: '/terms/update', component: TermsOfServiceUpdate, name: 'terms-update' },
	{ path: '/terms', component: TermsOfService, name: 'terms', props: (route) => ({ next: route.query.next }) },
	{ path: '/legal', component: LegalView, name: 'legal' },
	{ path: '/workspaces', component: Workspaces, name: 'workspaces' },
	{ path: '/workspaces/:id', component: Workspace, name: 'workspace', props: true },
	{ path: '/account', component: AccountView, name: 'account' },
	{ path: '/action/:token', component: ActionView, name: 'action', props: true },
	{ path: '/logout', component: LogoutView, name: 'logout' },
	{ path: '/', component: IndexView, name: 'index' },
	{ path: '*', component: NotFound }
]

const router = new VueRouter({
	routes: routes,
	mode: 'history'
});

const app = new Vue({
    el: '#app',
    data: store.state,
    created: async function () {
		await store.initUser ();
		try {
			await store.initWorkspaces ();
		} catch (e) {
			/* Nag the user with our terms. This allows navigating somewhere
			 * else, but should be good enough for now. */
			if (store.state.user !== null && !store.state.user.isAnonymous && e === 'need_tos') {
				this.$router.push ({name: 'terms', query: {next: this.$route.fullPath}});
			} else {
				throw e;
			}
		}
	},
	router: router,

});


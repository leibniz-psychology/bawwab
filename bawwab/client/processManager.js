import Program from './program.js';
import AsyncNotify from './asyncNotify.js';
import { postData } from './helper.js';

export default class ProcessManager {
	constructor(url) {
		this.recvWaiting = new Map ();
		this.recvBuffer = new Map ();
		/* currently running processes */
		this.procs = new Map ();
		this.procsWaiting = new Map ();
		this.newProcsWaiting = new AsyncNotify ();

		url.protocol = url.protocol == 'http:' ? 'ws:' : 'wss:';
		this.url = url;
		this.connectBackoff = 100;
		this.connect ();
	}

	connect () {
		console.debug ('connecting to %s', this.url);
		this.socket = new WebSocket (this.url);
		this.socket.addEventListener ('open', this.onOpen.bind (this));
		this.socket.addEventListener ('message', this.onMessage.bind (this));
		this.socket.addEventListener ('close', this.doReconnect.bind (this));
		/* onclose is called after an error, so no need to reconnect onerror
		 * too */
		//this.socket.addEventListener ('error', this.doReconnect.bind (this));
	}

	/* Connection was opened.
	 */
	onOpen (event) {
		console.debug ('socket is now open', this);
	}

	doReconnect (event) {
		console.debug ('socket is now closed', this, event);
		/* delay the reconnect, so we don’t cause a reconnect storm */
		window.setTimeout (function () { this.connect (); }.bind (this), this.connectBackoff);
		this.connectBackoff = Math.min (this.connectBackoff * 2, 5*1000);
	}

	/* A message was received from the server.
	 */
	onMessage (event) {
		/* reset if we receive a message (i.e. server is alive) */
		this.connectBackoff = 100;

		const data = JSON.parse (event.data);
		const token = data.token;
		console.debug ('got message with token', token);

		if (data.notify == 'processStart') {
			console.debug ('got process start for', token);
			/* create new process */
			const p = new Program (this, token, data.command, data.extraData);
			this.procs.set (token, p);
			const waiting = this.procsWaiting;
			if (waiting.has (token)) {
				console.debug ('notifying about arrival of process', token);
				waiting.get (token).notify (p);
			}
			this.newProcsWaiting.notify (p);
		} else {
			/* data for existing process */
			if (this.recvWaiting.has (token)) {
				/* if someone is waiting, forward directly */
				console.debug ('forwarding message', token, 'to waiting clients', this.recvWaiting);
				this.recvWaiting.get (token).forEach (f => f(data));
				/* XXX: what if calling f() has the side-effect of adding another waiter? */
				this.recvWaiting.set (token, []);
			} else {
				/* otherwise store, so we do not lose it; XXX: obviously this does
				 * not handle backpressure correctly */
				console.debug ('no one is waiting for', token, 'storing.')
				const buf = this.recvBuffer;
				if (!buf.has (token)) {
					buf.set (token, []);
				}
				buf.get (token).push (data);
			}
		}
	}

	/* Get process for token
	 */
	async get (token=null) {
		if (token === null) {
			/* not looking for something specific */
			console.debug ('looking for new processes');
			const ret = await this.newProcsWaiting.wait ();
			this.newProcsWaiting.reset ();
			return ret;
		} else {
			console.debug ('getting process for token', token);
			const procs = this.procs;
			if (procs.has (token)) {
				return procs.get (token);
			}

			const waiting = this.procsWaiting;
			if (!waiting.has (token)) {
				waiting.set (token, new AsyncNotify ());
			}
			const notify = waiting.get (token);
			const ret = await notify.wait ();
			return ret;
		}
	}

	/* Get the next message for token.
	 */
	async receive (token) {
		const buf = this.recvBuffer;
		let p = null;
		if (buf.has (token) && buf.get (token).length > 0) {
			/* resolve immediately */
			console.debug ('have stored message for', token);
			const data = buf.get (token).shift ();
			p = new Promise ((resolve, reject) => {
				resolve (data);
			});
		} else {
			/* wait */
			console.debug ('waiting for message for', token);
			p = new Promise ((resolve, reject) => {
				if (!this.recvWaiting.has (token)) {
					this.recvWaiting.set (token, []);
				}
				/* don’t call resolve, but queue it into waiting list */
				this.recvWaiting.get (token).push (resolve);
			});
		}
		return p;
	}

	/* Run an application and on success return a token.
	 */
	async run (command=null, action=null, extraData=null) {
		const payload = {extraData: extraData};
		if (command && action) {
			console.debug ('both command and action given', command, action);
			throw Error ('bug');
		} else if (command) {
			payload.command = command;
			console.debug ('starting run() with command', command);
		} else if (action) {
			console.debug ('starting run() with action', action);
			payload.action = action;
		}

		const r = await postData ('/api/process', payload);
		const j = await r.json ();
		if (r.ok) {
			return j.token;
		} else {
			throw Error (j.status);
		}
	}
}


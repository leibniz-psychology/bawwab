import Program from './program.js';
import AsyncNotify from './asyncNotify.js';
import { postData } from './helper.js';
import { processManagerUrl } from './config';

processManagerUrl.protocol = processManagerUrl.protocol == 'http:' ? 'ws:' : 'wss:';

const recvWaiting = new Map ();
const recvBuffer = new Map ();
/* currently running processes */
const procs = new Map ();
const procsWaiting = new Map ();
const newProcsWaiting = new AsyncNotify ();
const ready = new AsyncNotify ();

const initialConnectBackoff = 100;
let connectBackoff = initialConnectBackoff;
let socket = null;

export function connect () {
	console.debug ('connecting to %s', processManagerUrl);
	socket = new WebSocket (processManagerUrl);
	socket.addEventListener ('open', onOpen);
	socket.addEventListener ('message', onMessage);
	socket.addEventListener ('close', doReconnect);
	/* onclose is called after an error, so no need to reconnect onerror
	 * too */
	//this.socket.addEventListener ('error', this.doReconnect.bind (this));
}

/* Connection was opened.
 */
function onOpen (event) {
	ready.notify (true).then (function () {});
}

function doReconnect (event) {
	ready.reset ();
	console.debug ('socket is now closed', event);
	/* delay the reconnect, so we don’t cause a reconnect storm */
	window.setTimeout (function () { connect (); }, connectBackoff);
	connectBackoff = Math.min (connectBackoff * 2, 5*1000);
}

/* A message was received from the server.
 */
function onMessage (event) {
	/* reset if we receive a message (i.e. server is alive) */
	connectBackoff = initialConnectBackoff;

	const data = JSON.parse (event.data);
	const token = data.token;
	console.debug ('got message with token', token);

	if (data.notify == 'processStart') {
		console.debug ('got process start for', token);
		/* create new process */
		const p = new Program (token, data.command, data.extraData);
		procs.set (token, p);
		const waiting = procsWaiting;
		if (waiting.has (token)) {
			console.debug ('notifying about arrival of process', token);
			waiting.get (token).notify (p);
		}
		newProcsWaiting.notify (p);
	} else {
		/* data for existing process */
		const waiting = recvWaiting.get (token);
		if (waiting !== undefined && waiting.length > 0) {
			/* if someone is waiting, forward directly */
			console.debug ('forwarding message', token, 'to waiting clients', recvWaiting);
			waiting.forEach (f => f(data));
			/* XXX: what if calling f() has the side-effect of adding another waiter? */
			recvWaiting.set (token, []);
		} else {
			/* otherwise store, so we do not lose it; XXX: obviously this does
			 * not handle backpressure correctly */
			console.debug ('no one is waiting for', token, 'storing.')
			const buf = recvBuffer;
			if (!buf.has (token)) {
				buf.set (token, []);
			}
			buf.get (token).push (data);
		}
	}
}

/* Get process for token
 */
export async function get (token=null) {
	if (token === null) {
		/* not looking for something specific */
		console.debug ('looking for new processes');
		const ret = await newProcsWaiting.wait ();
		newProcsWaiting.reset ();
		return ret;
	} else {
		console.debug ('getting process for token', token);
		if (procs.has (token)) {
			return procs.get (token);
		}

		const waiting = procsWaiting;
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
export async function receive (token) {
	const buf = recvBuffer;
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
			if (!recvWaiting.has (token)) {
				recvWaiting.set (token, []);
			}
			/* don’t call resolve, but queue it into waiting list */
			recvWaiting.get (token).push (resolve);
		});
	}
	return p;
}

/* Run an application and on success return a token.
 */
export async function run (token, command=null, action=null, extraData=null) {
	/* We cannot start processes if not connected, otherwise we’re going to
	 * miss their notifications. Wait until ready. */
	await ready.wait ();

	const payload = {extraData: extraData, token};
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

export function getAllProcs () {
	return procs;
}


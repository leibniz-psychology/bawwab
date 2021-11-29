import { getAllProcs, get as pmget, run as pmrun } from './processManager';

import AsyncNotify from './asyncNotify.js';

class DeferredError extends Error {
};

class NotRegisteredError extends Error {
};

const tokenPrefix = Date.now ();
let tokenId = 0;
const handler = new Map ();
/* disallow all handler at first */
let allowedHandler = /^$/i;
/* deferred programs due to allowedHandler mismatch */
let deferred = [];

const waiting = new Map ();

export function register (name, f) {
	handler.set (name, f);
}

/* Start handling events. Should only be called after all handlers are
 * registered.
 */
export function start () {
	_listen().then (_ => ({}));
}

async function handleProc (p, allowedHandler) {
	if (!p.extraData) {
		/* nothing we can handle */
		return;
	}

	const name = p.extraData.trigger;

	/* defer if not allowed right now */
	if (!allowedHandler.test (name)) {
		throw new DeferredError ();
	}

	if (!handler.has (name)) {
		throw new NotRegisteredError (`${name} is not registered`);
	}

	const f = handler.get (name);
	let ret = null;
	try {
		ret = await f (p.extraData.args, p);
	} catch (e) {
		/* throw exception into notification */
		ret = e;
	}
	if (waiting.has (p.token)) {
		waiting.get (p.token).notify (ret);
	}
}

async function handleProcWithDeferred (p) {
	try {
		await handleProc (p, allowedHandler);
	} catch (e) {
		if (e instanceof DeferredError) {
			deferred.push (p);
		} else {
			throw e;
		}
	}
}

async function _listen () {
	console.debug ('starting em listener');
	/* process existing programs */
	const procs = getAllProcs ();
	for (let i = 0; i < procs.length; i++) {
		const p = procs[i];
		await handleProcWithDeferred (p);
	}

	while (true) {
		const p = await pmget ();
		/* fork into the background, to support running multiple handlers
		 * at the same time */
		handleProcWithDeferred (p).then (function () {});
	}
}

export async function setAllowedHandler (re) {
	const newDeferred = [];
	while (deferred.length > 0) {
		const p = deferred.shift ();
		try {
			await handleProc (p, re);
		} catch (e) {
			if (e instanceof DeferredError) {
				newDeferred.push (p);
			} else {
				throw e;
			}
		}
	}

	allowedHandler = re;
	deferred = newDeferred;
}

export async function run (name, args=null, command=null, action=null) {
	console.debug ('em running', name, args, command, action);

	const token = tokenPrefix + '-' + tokenId;
	tokenId++;
	const n = new AsyncNotify ();
	waiting.set (token, n);

	await pmrun (token, command, action, {trigger: name, args: args});

	const ret = await n.wait ();
	waiting.delete (token);
	return ret;
}

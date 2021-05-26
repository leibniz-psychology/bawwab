import AsyncNotify from './asyncNotify.js';

class DeferredError extends Error {
};

class NotRegisteredError extends Error {
};

export default class EventManager {
	constructor (pm) {
		/* process manager */
		this.pm = pm;
		this.handler = new Map ();
		/* disallow all handler at first */
		this.allowedHandler = /^$/i;
		/* deferred programs due to allowedHandler mismatch */
		this.deferred = [];

		this.waiting = new Map ();
	}

	register (name, f) {
		this.handler.set (name, f);
	}

	/* Start handling events. Should only be called after all handlers are
	 * registered.
     */
	start () {
		this._listen().then (_ => ({}));
	}

	async handleProc (p, allowedHandler) {
		if (!p.extraData) {
			/* nothing we can handle */
			return;
		}

		const name = p.extraData.trigger;

		/* defer if not allowed right now */
		if (!allowedHandler.test (name)) {
			throw new DeferredError ();
		}

		if (!this.handler.has (name)) {
			throw new NotRegisteredError (`${name} is not registered`);
		}

		const f = this.handler.get (name);
		let ret = null;
		try {
			ret = await f (p.extraData.args, p);
		} catch (e) {
			/* throw exception into notification */
			ret = e;
		}
		if (this.waiting.has (p.token)) {
			this.waiting.get (p.token).notify (ret);
		}
	}

	async handleProcWithDeferred (p) {
		try {
			await this.handleProc (p, this.allowedHandler);
		} catch (e) {
			if (e instanceof DeferredError) {
				this.deferred.push (p);
			} else {
				throw e;
			}
		}
	}

	async _listen () {
		console.debug ('starting em listener');
		/* process existing programs */
		for (let i = 0; i < this.pm.procs.length; i++) {
			const p = this.pm.procs[i];
			await this.handleProcWithDeferred (p);
		}

		while (true) {
			const p = await this.pm.get ();
			/* fork into the background, to support running multiple handlers
			 * at the same time */
			this.handleProcWithDeferred (p).then (function () {});
		}
	}

	async setAllowedHandler (re) {
		const newDeferred = [];
		while (this.deferred.length > 0) {
			const p = this.deferred.shift ();
			try {
				await this.handleProc (p, re);
			} catch (e) {
				if (e instanceof DeferredError) {
					newDeferred.push (p);
				} else {
					throw e;
				}
			}
		}

		this.allowedHandler = re;
		this.deferred = newDeferred;
	}

	async run (name, args=null, command=null, action=null) {
		console.debug ('em running', name, args, command, action);
		const pm = this.pm;
		const token = await pm.run (command, action, {trigger: name, args: args});
		this.waiting.set (token, new AsyncNotify ());
		const ret = await this.waiting.get (token).wait ();
		this.waiting.delete (token);
		return ret;
	}
}


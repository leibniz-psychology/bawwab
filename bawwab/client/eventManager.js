import AsyncNotify from './asyncNotify.js';

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

	async handleProc (p) {
		if (!p.extraData) {
			/* nothing we can handle */
			return;
		}

		const name = p.extraData.trigger;
		console.debug ('em: got new program', p.token, 'for', name);

		if (!this.handler.has (name)) {
			throw Error (`${name} is not registered`);
		}

		/* defer if not allowed right now */
		if (!this.allowedHandler.test (name)) {
			console.debug ('deferring', p.token);
			this.deferred.push (p);
			return false;
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

		return true;
	}

	async _listen () {
		console.debug ('starting em listener');
		/* process existing programs */
		for (let i = 0; i < this.pm.procs.length; i++) {
			const p = this.pm.procs[i];
			await this.handleProc (p);
		}

		while (true) {
			const p = await this.pm.get ();
			await this.handleProc (p);
		}
	}

	async setAllowedHandler (re) {
		this.allowedHandler = re;
		const newDeferred = [];
		for (let i = 0; i < this.deferred.length; i++) {
			const p = this.deferred[i];
			const ran = await this.handleProc (p);
			if (!ran) {
				newDeferred.push (p);
			}
		}
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


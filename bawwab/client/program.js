import { receive } from './processManager';

/* Abstracting a running program
 */
export default class Program {
	constructor(token, command, extraData) {
		/* identifier used to distinguish messages for this program */
		this.token = token;
		this.command = command;
		this.extraData = extraData;
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
		const msg = await receive (this.token);
		switch (msg.notify) {
			case 'processData':
				console.debug ('got more data for', msg.kind, msg.data);
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

			case 'processExit':
				this.exitStatus = msg.status;
				this.exitSignal = msg.signal;
				break;

			default:
				throw Error (['unknownMessage', msg.method, JSON.stringify (msg)]);
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

	async terminate () {
		const r = await fetch (`/api/process/${this.token}`, {method: 'DELETE'});
		const j = await r.json ();
		if (r.ok) {
			return true;
		} else {
			throw Error (j.status);
		}
	}
}

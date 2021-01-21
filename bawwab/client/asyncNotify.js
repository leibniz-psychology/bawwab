/* Simple async notification
 */
export default class AsyncNotify {
	constructor () {
		this.waiting = [];
		this.notified = false;
		this.args = null;
	}

	/* Notify (unblock) all waiting clients
	 */
	async notify (args) {
		this.args = args;
		this.notified = true;
		for (let i = 0; i < this.waiting.length; i++) {
			const [resolve, reject] = this.waiting[i];
			if (this.args instanceof Error) {
				reject (this.args);
			} else {
				resolve (this.args);
			}
		}
		this.waiting = [];
	}

	/* Block again
	 */
	reset () {
		this.notified = false;
		this.args = null;
	}

	/* Async wait for notification
	 */
	wait () {
		if (this.notified) {
			/* resolve immediately with stored args */
			return new Promise (function (resolve, reject) {
				if (this.args instanceof Error) {
					reject (this.args);
				} else {
					resolve (this.args);
				}
			}.bind (this));
		} else {
			/* queue */
			return new Promise (function (resolve, reject) {
				this.waiting.push ([resolve, reject]);
			}.bind (this));
		}
	}
}


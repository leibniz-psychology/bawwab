/* Conductor tunnel/program state
 */
export const ConductorState = Object.freeze ({
	starting: 0,
	live: 1, /* program is accessible to the user */
	exited: 2,
});

/* Special treatment for conductor Program’s
 */
export class ConductorClient {
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
					if (!this.error) {
						this.state = ConductorState.exited;
						this.error = 'unknown';
					}
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

	async terminate () {
		return await this.process.terminate ();
	}
}


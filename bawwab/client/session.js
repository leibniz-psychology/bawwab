/* Server session
 */
export default class Session {
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
			throw Error (j.status);
		}
	}

	async destroy () {
		const r = await fetch ('/api/session', {
			'method': 'DELETE'
		});
		const j = await r.json();
		if (r.ok) {
			this.name = null;
			this.oauthInfo = null;
		} else {
			console.error (j);
			throw Error (j.status);
		}
	}

	/* Is the session currently authenticated against OAuth?
	 */
	authenticated () {
		return this.oauthInfo !== null;
	}
}



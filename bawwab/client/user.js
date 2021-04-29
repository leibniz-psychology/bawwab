import { postData } from './helper.js';

/* Unix user
 */
export default class User {
	constructor (name, motd, loginStatus) {
		this.name = name;
		this.motd = motd;
		this.loginStatus = loginStatus;
	}

	static fromJson (j) {
		return new User (j.name, j.motd, j.loginStatus);
	}

	static async get (acceptTos) {
		let url = '/api/user';
		if (acceptTos) {
			url += '?acceptTos=1';
		}
		const r = await fetch (url);
		const j = await r.json ();
		if (r.ok) {
			return User.fromJson (j);
		} else {
			throw Error (j.status);
		}
	}

	static async create (info) {
		const r = await postData ('/api/user', {
				firstName: info.given_name,
				lastName: info.family_name,
				username: info.preferred_username,
				email: info.email,
				orcid: info.orcid,
				});
		const j = await r.json ();
		if (r.ok) {
			return User.fromJson (j);
		} else {
			throw Error (j.status);
		}
	}
}


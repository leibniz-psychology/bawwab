/* A single workspace.
 */
export default class Workspace {
	constructor (o, whoami) {
		Object.assign (this, o);
		this.whoami = whoami;
	}

	/* Compare workspace names for .sort()
	 */
	static compareName (a, b) {
		const x = a.metadata.name ? a.metadata.name.toLowerCase () : '',
			y = b.metadata.name ? b.metadata.name.toLowerCase () : '';
		if (x == y) {
			return 0;
		} else if (x > y) {
			return 1;
		} else {
			return -1;
		}
	}

	myPermissions () {
		const me = this.whoami ();
		const perms = Object.entries (this.permissions).filter (([k, v]) => k == me);
		if (perms.length < 1) {
			return '';
		}
		return perms[0][1];
	}

	/* Retrive the owner of this workspace.
	 */
	owner () {
		/* XXX: assuming there can only be one owner */
		const l = Object.entries (this.permissions).filter (([k, v]) => v.includes ('T'));
		if (l.length == 0) {
			return null;
		}
		return l[0][0];
	}

	/* Current user is allowed to read files of this project.
	 */
	canRead () {
		return this.myPermissions ().includes ('r');
	}

	/* Current user is allowed to write files of this project.
	 */
	canWrite () {
		return this.myPermissions ().includes ('w');
	}

	/* Current user can run applications.
	 */
	canRun () {
		return this.canWrite ();
	}

	/* Current user can share project with other users. (Only owner can.)
	 */
	canShare () {
		return this.myPermissions ().includes ('T');
	}

	/* Current user can delete files. In theory having 'w' is enough, but don’t
	 * advertise it. */
	canDelete () {
		return this.canShare ();
	}

	/* All applications runnable in the web client
	 */
	runnableApplications () {
		const ret = [];
		if (!this.canRun ()) {
			return ret;
		}
		for (const a of this.applications) {
			const interfaces = a.interfaces ? a.interfaces.split (',') : [];
			if (interfaces.some (x => x.indexOf ('org.leibniz-psychology.conductor') == 0)) {
				ret.push (a);
			}
		}
		return ret;
	}
}



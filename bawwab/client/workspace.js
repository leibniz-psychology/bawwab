import Permissions from './permissions.js';

/* A single workspace.
 */
export default class Workspace {
	constructor (o) {
		Object.assign (this, o);

		for (const cat of ['user', 'group']) {
			for (const id in this.permissions[cat]) {
				this.permissions[cat][id] = new Permissions (this.permissions[cat][id]);
			}
		}
		this.permissions.other = new Permissions (this.permissions.other);
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

	/* Return [permissions, source] for user */
	getPermissions (user) {
		/* first check user fields */
		let perms = Object.entries (this.permissions.user).filter (([k, v]) => k == user);
		if (perms.length >= 1) {
			return [perms[0][1], 'user'];
		}
		/* assuming user==group */
		perms = Object.entries (this.permissions.group).filter (([k, v]) => k == user);
		if (perms.length >= 1) {
			return [perms[0][1], 'group'];
		}
		/* this should always exist */
		return [this.permissions.other, 'other'];
	}

	get isPublic () {
		return this.permissions.other.canRead ();
	}

	get id () {
		return this.metadata._id;
	}

	/* Retrive the owners of this workspace.
	 */
	owner () {
		return Object.entries (this.permissions.user).filter (([k, v]) => v.canShare ()).map (([k, v]) => k);
	}

	/* All applications runnable in the web client
	 */
	runnableApplications (user) {
		const ret = [];
		if (!this.getPermissions (user)[0].canRun ()) {
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



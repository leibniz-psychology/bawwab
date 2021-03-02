export default class Permissions {
	constructor (s) {
		this.s = s;
	}

	/* Current user is allowed to read files of this project.
	 */
	canRead () {
		return this.s.includes ('r');
	}

	/* Current user is allowed to write files of this project.
	 */
	canWrite () {
		return this.s.includes ('w');
	}

	/* Current user can run applications.
	 */
	canRun () {
		return this.canWrite ();
	}

	/* Usually only the owner can
	 */
	canWriteNamedAttributes () {
		return this.s.includes ('T');
	}

	/* Current user can share project with other users.
	 */
	canShare () {
		return this.canWriteNamedAttributes ();
	}

	/* Current user can delete files. In theory having 'w' is enough, but don’t
	 * advertise it. */
	canDelete () {
		return this.canShare ();
	}
}

/* Borg backup abstraction.
 * See https://borgbackup.readthedocs.io/en/stable/internals/frontends.html#json-output
 * for hints how to implement a frontend.
 */

import { reactive } from 'vue/dist/vue.esm-bundler.js';
import AsyncNotify from './asyncNotify.js';
import { run as emrun, register as emregister } from './eventManager.js';

export class BorgError extends Error {
}

export class BorgErrorNonexistent extends BorgError {
}

/* A single version from a borg repository
 */
export class BorgArchive {
	constructor (name, date, comment) {
		this.name = name;
		this.date = date;
		this.comment = comment;
	}

	/* Create from an object returned by borg’s --json switch, either from
	 * `borg create` or `borg list` */
	static fromObject (o) {
		/* The timestamp is naive, but UTC */
		const date = new Date ((o.time ?? o.end) + 'Z');
		return new BorgArchive (o.name, date, o.comment);
	}
}

export class BorgRepository {
	constructor (archives) {
		/* archives must be a name-indexed Map */
		this.archives = archives ?? new Map ();
	}

	/* Create from object returned by `borg list` */
	static fromObject (o) {
		const m = new Map ();
		for (const a of o.archives) {
			const archive = BorgArchive.fromObject (a);
			m.set (archive.name, archive);
		}
		return new BorgRepository (m);
	}

	get (k) {
		return this.archives.get (k);
	}

	addArchive (a) {
		this.archives.set (a.name, a);
	}

	removeArchive (a) {
		/* Support both BorgArchive and strings */
		let name = a;
		if (a instanceof BorgArchive) {
			name = a.name;
		}
		this.archives.delete (name);
	}

	renameArchive (a, name) {
		this.removeArchive (a);
		a.name = name;
		this.addArchive (a);
	}
}

export default class BorgBackup {
	constructor () {
		emregister ('borg.list', this.onList.bind (this));
		emregister ('borg.create', this.onCreate.bind (this));
		emregister ('borg.init', this.onInit.bind (this));
		emregister ('borg.extract', this.onExtract.bind (this));
		emregister ('borg.rename', this.onRename.bind (this));
		emregister ('borg.changeComment', this.onChangeComment.bind (this));
		emregister ('borg.prune', this.onPrune.bind (this));
		emregister ('borg.delete', this.onDelete.bind (this));

		this.listInProgress = new Map ();

		/* map from Workspace path to repos */
		this.repos = reactive (new Map ());
	}

	/* Get repo by path */
	get (k) {
		return this.repos.get (k);
	}

	/* operation is a borg subcommand, archive an archive name, args are
	 * extra arguments and must not include positional arguments, extraArgs
	 * are passed to the callback as-is */
	async runWith (name, ws, operation, {archive=null, args=[], extraArgs={}}) {
		let command = ['env', '-C', ws.path,
				'BORG_RELOCATED_REPO_ACCESS_IS_OK=yes',
				'BORG_UNKNOWN_UNENCRYPTED_REPO_ACCESS_IS_OK=yes', 'borg', operation];
		if (ws) {
			let path = '.backup';
			if (archive) {
				path += '::' + archive;
			}
			command.push (path);
		}
		command = command.concat (args);
		/* Copy, so we don’t modify the caller’s object */
		const extraArgsCopy = {};
		Object.assign (extraArgsCopy, extraArgs);
		extraArgsCopy.path = ws?.path;
		extraArgsCopy.archive = archive;
		return await emrun (name, extraArgsCopy, command);
	}

	async onList (extraArgs, p) {
		const k = extraArgs.path;

		/* There should not be a read-modify-write race here, as long as the
		 * conditional block is not async. */
		if (!this.listInProgress.has (k)) {
			/* not initiated by this client */
			this.listInProgress.set (k, new AsyncNotify ());
		}

		const ret = await p.wait ();

		/* make sure we remove stale entries, which raise an error below. */
		this.repos.delete (k);

		let resp = null;
		switch (ret) {
			case 0:
				const r = JSON.parse (p.stdoutBuf);
				const repo = BorgRepository.fromObject (r);
				this.repos.set (k, repo);
				resp = repo;
				break;

			case 2:
				resp = new BorgErrorNonexistent ();
				break;

			default:
				resp = new BorgError (ret);
				break;
		}

		await this.listInProgress.get (k).notify (resp);
		this.listInProgress.delete (k);
		if (resp instanceof Error) {
			throw resp;
		} else {
			return resp;
		}
	}

	async list (ws) {
		if (this.listInProgress.has (ws.path)) {
			/* Expensive operation, don’t allow running it twice */
			/* XXX: We should add the option to run only one instance of a command to the event manager */
			return await this.listInProgress.get (ws.path).wait ();
		} else {
			/* we can change which keys borg returns by using --format */
			this.listInProgress.set (ws.path, new AsyncNotify ());
			return await this.runWith ('borg.list', ws, 'list',
					{args: ['--json', '--format={comment}{username}']});
		}
	}

	async onCreate (extraArgs, p) {
		const k = extraArgs.path;
		const ret = await p.wait ();
		switch (ret) {
			case 0:
				const repo = this.repos.get (k);
				const resp = JSON.parse (p.stdoutBuf);
				const archive = BorgArchive.fromObject (resp.archive);
				repo.addArchive (archive);
				return archive;

			case 2:
				throw new BorgErrorNonexistent ();

			default:
				throw new BorgError (ret);
		}
	}

	async create (ws, name) {
		return await this.runWith ('borg.create', ws, 'create',
				{archive: name,
				args: [
					/* Backup the current directory (which is the workspace directory) */
					'.',
					'--json',
					'-C', 'zstd',
					/* excludes */
					'-e', '.backup/',
					'-e', '.cache/',
					'-e', '.local/share/rstudio',
					'-e', '.ipynb_checkpoints/',
					'-e', '.local/share/Trash/',
					]});
	}

	async onInit (extraArgs, p) {
		const k = extraArgs.path;
		const ret = await p.wait ();
		switch (ret) {
			case 0:
				/* We don’t have any repo intos in json format at this point, init
				 * dummy object. */
				this.repos.set (k, new BorgRepository ());
				return true;

			default:
				throw new BorgError (ret);
		}
	}

	async init (ws) {
		return await this.runWith ('borg.init', ws, 'init', {args: ['-e', 'none']});
	}

	async onExtract (extraArgs, p) {
		const ret = await p.wait ();
		switch (ret) {
			case 0:
				return true;

			default:
				throw new BorgError (ret);
		}
	}

	async extract (ws, archive) {
		return await this.runWith ('borg.extract', ws, 'extract', {archive: archive.name});
	}

	async onRename (extraArgs, p) {
		const k = extraArgs.path;
		const ret = await p.wait ();
		switch (ret) {
			case 0:
				const repo = this.repos.get (k);
				const archive = repo.get (extraArgs.archive);
				const newArchive = repo.renameArchive (archive, extraArgs.name);
				return newArchive;

			default:
				throw new BorgError (ret);
		}
	}

	async rename (ws, archive, name) {
		return await this.runWith ('borg.rename', ws, 'rename',
				{archive: archive.name, args: [name], extraArgs: {name}});
	}

	async onChangeComment (extraArgs, p) {
		const k = extraArgs.path;
		const ret = await p.wait ();
		switch (ret) {
			case 0:
				const repo = this.repos.get (k);
				const archive = repo.get (extraArgs.archive);
				/* XXX: technically we have to change more than just the comment, since
				 * the archive is recreated, but the recreate subcommand does not return
				 * any information. */
				archive.comment = extraArgs.comment;
				return archive;

			default:
				throw new BorgError (ret);
		}
	}

	async changeComment (ws, archive, comment) {
		return await this.runWith ('borg.changeComment', ws, 'recreate',
				{args: ['--comment', comment], archive: archive.name, extraArgs: {comment}});
	}

	async onPrune (extraArgs, p) {
		const k = extraArgs.path;
		const ret = await p.wait ();
		switch (ret) {
			case 0:
				/* Example message:
				 * "Pruning archive: b                                    Fri, 2021-10-15 10:05:30 [a9ef45416f801657a98e730b699b1be49c71e5c8bffef0a04e58a4ed22ab69b7] (1/1)"
				 */
				/* XXX: This is very fragile and breaks if the archive name has a space at the end */
				const repo = this.repos.get (k);
				const pruneRe = new RegExp ('^Pruning archive: (.+)\\s+[a-zA-Z]{3,}, [^\\s]+ [^\\s]+ \[[a-f0-9]+\\]');
				/* Listing is written to stderr, not stdout */
				const lines = p.stderrBuf.split ('\n');
				console.log ('got for pruning', lines);
				lines.forEach (function (l) {
					const m = pruneRe.exec (l);
					if (m) {
						console.log ('pruning', m[1]);
						repo.removeArchive (m[1].trim ());
					}
				});
				return true;

			default:
				throw new BorgError (ret);
		}
	}

	async prune (ws, keep, prefix) {
		const args = ['--list'];
		for (const [k, v] of Object.entries (keep)) {
			args.push (`--keep-${k}=${v}`);
		}
		if (prefix) {
			args.push (`--prefix=${prefix}`)
		}
		return await this.runWith ('borg.prune', ws, 'prune', {args});
	}

	async onDelete (extraArgs, p) {
		const k = extraArgs.path;
		const deleted = extraArgs.deleted;
		const results = await p.getAllObjects ();
		const ret = await p.wait ();
		switch (ret) {
			case 0:
				const repo = this.repos.get (k);
				for (const n of deleted) {
					repo.removeArchive (n);
				}
				return true;

			default:
				throw new BorgError (ret);
		}
	}

	async delete (ws, archives) {
		const args = ['delete'];
		return await this.runWith ('borg.delete', ws, 'delete',
				{archive: archives[0].name,
				args: archives.slice (1).map (a => a.name),
				extraArgs: {deleted: archives.map (a => a.name)}});
	}
}


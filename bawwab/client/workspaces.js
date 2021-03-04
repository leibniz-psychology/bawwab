import Workspace from './workspace.js';
import { ConductorClient } from './conductor.js';
import { config } from './app.js';
import { postData, getResponse } from './helper.js';

export default class Workspaces {
	constructor (em, user) {
		/* event manager */
		this.em = em;
		this.user = user;
		this.loading = false;
		this.workspaces = [];
		/* running applications, must be reactive, so cannot use Map() */
		this.applications = {};

		/* welcome to “this hell” */
		const registerRunWithCb = (name, f) =>
			this.em.register (name, async function (args, p) {
				return f.bind (this) (args, await this.onRunWith (p));
			}.bind (this));

		registerRunWithCb ('workspaces.fetch', this.onFetch);

		registerRunWithCb ('workspaces.create', this.onCreate);
		/* use same callback */
		registerRunWithCb ('workspaces.copy', this.onCreate);
		registerRunWithCb ('workspaces.import', this.onCreate);

		registerRunWithCb ('workspaces.update', this.onUpdate);
		/* use the same callback */
		registerRunWithCb ('workspaces.share', this.onUpdate);
		registerRunWithCb ('workspaces.unshare', this.onUpdate);
		registerRunWithCb ('workspaces.packageModify', this.onUpdate);
		registerRunWithCb ('workspaces.packageUpgrade', this.onUpdate);

		registerRunWithCb ('workspaces.ignore', this.onIgnore);

		this.em.register ('workspaces.delete', this.onDelete.bind (this));
		this.em.register ('workspaces.start', this.onStart.bind (this));
		this.em.register ('workspaces.export', this.onExport.bind (this));
		this.em.register ('workspaces.packageSearch', this.onPackageSearch.bind (this));
	}

	/* Run workspace command with more arguments
	 */
	async runWith (name, ws, args, extraArgs=null) {
		let command = ['workspace', '-f', 'json'];
		if (ws) {
			command = command.concat (['-d', ws.path]);
		}
		if (args) {
			command = command.concat (args);
		}
		if (ws) {
			if (extraArgs === null) {
				extraArgs = ws.path;
			} else {
				extraArgs.path = ws.path;
			}
		}
		return await this.em.run (name, extraArgs, command);
	}

	async onRunWith (p) {
		const workspaces = await p.getAllObjects ();
		const ret = await p.wait ();
		if (ret == 0) {
			return workspaces.map (o => new Workspace (o));
		} else {
			throw Error ('unhandled');
		}
	}

	async fetch () {
		try {
			this.loading = true;
			return await this.runWith ('workspaces.fetch', null, [
					'list',
					'-s', config.publicData,
					'-s', config.privateData,
					]);
		} catch (e) {
			this.workspaces = [];
			throw e;
		} finally {
			this.loading = false;
		}
	}

	onFetch (args, ret) {
		this.workspaces = ret;
	}

	async create (name) {
		return await this.runWith ('workspaces.create', null, [
				'-d', `${config.publicData}/${this.user.name}`,
				'create',
				name,
				]);
	}

	onCreate (args, ret) {
		const ws = ret[0];
		this.workspaces.push (ws);
		return ws;
	}

	async update (ws) {
		const args = ['modify'];
		for (const k in ws.metadata) {
			args.push (`${k}=${ws.metadata[k]}`);
		}
		return await this.runWith ('workspaces.update', ws, args);
	}

	onUpdate (path, ret) {
		const ws = this.getByPath (path);
		const newws = ret[0];
		this.replace (ws, newws);
		return newws;
	}

	async delete (ws) {
		return await this.em.run ('workspaces.delete', ws.path, ['trash', '--', ws.path]);
	}

	async onDelete (path, p) {
		const ws = this.getByPath (path);
		const ret = await p.wait ();
		if (ret == 0) {
			this.workspaces = this.workspaces.filter(elem => elem.path != ws.path);
			return true;
		} else {
			throw Error ('unhandled');
		}
	}

	/* share workspace with a group
	 */
	async share (ws, group, isWrite) {
		const args = ['share', group];
		if (isWrite) {
			args.push ('-w');
		}
		return await this.runWith ('workspaces.share', ws, args);
	}

	/* Implicitly share a workspace through an action link
	 */
	async shareAction (ws, isWrite) {
		const command = ['workspace', '-d', ws.path, '-f', 'json', 'share', '{user}'];
		if (isWrite) {
			command.push ('-w');
		}
		const r = await postData('/api/action', {
				name: 'run',
				arguments: {trigger: 'workspaces.create', args: ws.path},
				command: command,
				validFor: 7*24*60*60,
				usesRemaining: 100,
				});
		const action = await getResponse (r);
		return action.token;
	}

	async unshare (ws, group) {
		const args = ['share', '-x', group];
		return await this.runWith ('workspaces.unshare', ws, args);
	}

	async ignore (ws) {
		const args = ['ignore'];
		return await this.runWith ('workspaces.ignore', ws, args);
	}

	onIgnore (path, ret) {
		const ws = this.getByPath (path);
		this.workspaces = this.workspaces.filter(elem => elem.path != ws.path);
	}

	async copy (ws) {
		const args = ['copy', `${config.publicData}/${this.user.name}/`];
		return await this.runWith ('workspaces.copy', ws, args);
	}

	async start (ws, a) {
		return await this.runWith ('workspaces.start', ws, ['run', a._id], {aid: a._id});
	}

	async onStart (args, p) {
		const ws = this.getByPath (args.path);
		const c = new ConductorClient (p);
		const k = ws.metadata._id + '+' + args.aid;
		Vue.set (this.applications, k, c);
		/* keep the application if an error occurred */
		const handle = function () { if (!c.error) { Vue.delete (this.applications, k); } }.bind (this);
		c.run ().then (handle).catch (function (e) { console.error ('application run failed with', e); });
		return c;
	}

	async export (kind, ws) {
		const args = ['export', kind, `${config.privateData}/${this.user.name}/.cache`];
		return await this.runWith ('workspaces.export', ws, args);
	}

	async onExport (args, p) {
		const ret = await p.wait ();
		if (ret == 0) {
			return await p.getObject ();
		} else {
			throw Error ('unhandled');
		}
	}

	async import (path) {
		const args = ['import', path, `${config.publicData}/${this.user.name}`];
		return await this.runWith ('workspaces.import', null, args);
	}

	async packageSearch (ws, expression) {
		const args = ['package', 'search', expression];
		return await this.runWith ('workspaces.packageSearch', ws, args);
	}

	async onPackageSearch (args, p) {
		const results = await p.getAllObjects ();
		const ret = await p.wait ();
		if (ret == 0) {
			return results;
		} else {
			throw Error ('unhandled');
		}
	}

	async packageModify (ws, packages) {
		const args = ['package', 'modify', '--'].concat (packages);
		return await this.runWith ('workspaces.packageModify', ws, args);
	}

	async packageUpgrade (ws) {
		const args = ['package', 'upgrade']
		return await this.runWith ('workspaces.packageUpgrade', ws, args);
	}

	getRunningApplication (ws, a) {
		const k = ws.metadata._id + '+' + a._id;
		return this.applications[k];
	}

	resetRunningApplication (ws, a) {
		const k = ws.metadata._id + '+' + a._id;
		Vue.delete (this.applications, k);
	}

	getById (wid) {
		return this.workspaces.filter(elem => elem.metadata._id == wid)[0];
	}

	getByPath (path) {
		return this.workspaces.filter(elem => elem.path == path)[0];
	}

	all () {
		return this.workspaces;
	}

	replace (oldws, newws) {
		this.workspaces = this.workspaces.map (oldws => oldws.path == newws.path ? newws : oldws);
	}
}


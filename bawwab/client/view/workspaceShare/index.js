import { store } from '../../app.js';
import { postData } from '../../helper.js';
import { queryParamProp } from '../../utils.js';
import template from './template.html';
import { trackEvent } from "../../matomo.js";

const SendStatus = Object.freeze ({
	unknown: 0,
	inprogress: 1,
	success: 2,
	failure: 3,
});

export default {
	name: 'WorkspaceShareView',
	props: ['wsid'],
	template: template,
	data: _ => ({
		state: store.state,

		/* share url for reading (false), writing (true) */
		shareUrl: {false: null, true: null},
		selectedShareUrl: false,
		emailAddressesInput: '',
		emailAddresses: [],
		emailName: '',
		emailMessage: '',
		emailQuotaReached: false,
		preview: null,

		/* for the template */
		SendStatus: SendStatus,
	}),
	computed: {
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		shareMeaning: function () {
			if (!this.selectedShareUrl) {
				return this.$t ('v.workspaceShare.readMeaning');
			} else {
				return this.$t ('v.workspaceShare.writeMeaning');
			}
		},
		modeLink: function () { return this.mode == 'link'; },
		modeEmail: function () { return this.mode == 'email'; },
		mode: queryParamProp ('mode', 'link'),
		canSend: function () {
			return !this.emailQuotaReached &&
					this.shareUrl[this.selectedShareUrl] &&
					this.emailAddresses.reduce ((last, current) => last || (current.status == SendStatus.unknown), false) &&
					this.emailMessage;
		},
	},
	created: async function() {
		/* async resolve both actions */
		const keys = [false, true];
		const values = await Promise.all (keys.map (function (isWrite) {
			return this.workspaces.shareAction (this.workspace, isWrite);
		}.bind (this)));
		for (let i = 0; i < keys.length; i++) {
			const isWrite = keys[i];
			const token = values[i];
			const ident = 'share-' + (isWrite ? 'write' : 'readonly');
			this.shareUrl[isWrite] = new URL (`/action/${token}#${ident}`, window.location.href);
		}
	},
	methods: {
		copyToClipboard: async function(text) {
			if (navigator.clipboard) {
				const ret = await navigator.clipboard.writeText (text);
				return true;
			} else {
				throw Error ('unsupported');
			}
		},
		sendAllMails: async function () {
			this.processAddresses (false);

			for (let a of this.emailAddresses) {
				if (a.status != SendStatus.unknown) {
					continue;
				}
				a.status = SendStatus.inprogress;
				try {
					const j = await this.sendMail (a);
					a.status = SendStatus.success;
				} catch (e) {
					a.status = SendStatus.failure;
					break;
				}
			}
		},
		/* send single email to address a */
		sendMail: async function (a, dryRun=false) {
			const r = await postData ('/api/email', {
					recipientName: a.name,
					recipientAddress: a.address,
					projectName: this.workspace.metadata.name,
					message: this.emailMessage,
					link: this.shareUrl[this.selectedShareUrl],
					lang: this.$i18n.locale,
					template: 'invite',
					dryRun: dryRun,
					});
			const j = await r.json ();
			if (r.ok) {
				trackEvent ("email", "email-send");
				return j;
			} else {
				/* would be good to move this out, to have a stateless
				 * function, but then we have to do the same error-handling for
				 * previews */
				if (j.status == 'quota_reached') {
					this.emailQuotaReached = true;
				}
				throw Error (j.status);
			}
		},
		removeAddress: function (a) {
			this.emailAddresses = this.emailAddresses.filter (o => o.address != a.address);
		},
		addAddress: function () {
			this.processAddresses (false);
		},
		processAddresses: function (needTerminator=true) {
			/* this matches email addresses similar to RFCXXX:
			 * user@example.com
			 * <user@example.com>
			 * user <user@example.com>
			 * "user" <user@example.com>
			 */
			const restr = '^\\s*(?:["\']?(?<name>[^@\'"]+)["\']?\\s+)?<?(?<address>[^@ ,;<>"]+@[^@ ,;<>"]+)>?' + (needTerminator ? '[,; ]' : '');
			const mailre = new RegExp(restr, 'ig');
			const s = this.emailAddressesInput;
			const it = s.matchAll (mailre);
			for (let m of it) {
				/* remove matched input */
				this.emailAddressesInput = s.substr (0, m.index) + s.substr (m.index+m[0].length);
				const g = m.groups;
				this.emailAddresses.push ({
						/* prefer name from text field, then from address then localpart of email */
						name: this.emailName || g.name || g.address.split ('@', 1)[0],
						address: g.address,
						status: SendStatus.unknown});
				this.emailName = '';
				/* match at most one address */
				break;
			}
		},
		runPreview: function () {
			const debounceMs = 350;
			if (this.previewTimeout) {
				window.clearTimeout (this.previewTimeout);
				this.previewTimeout = null;
			}
			if (this.canSend) {
				/* simple debounce */
				this.previewTimeout = window.setTimeout (function () {
					this.sendMail (this.emailAddresses[0], true)
						.then (function (ret) {
							this.preview = ret.message;
						}.bind (this));
				}.bind (this), debounceMs);
			} else {
				this.preview = '';
			}
		},
	},
	watch: {
		emailAddressesInput: function () {
			this.processAddresses (true);
		},
		emailAddresses: async function () {
			await this.runPreview ();
		},
		emailMessage: async function () {
			await this.runPreview ();
		},
	},
};


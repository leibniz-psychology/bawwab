import { translations, i18nMixin } from '../i18n.js';
import { store } from '../app.js';
import { postData } from '../helper.js';
import { queryParamProp } from '../utils.js';

const SendStatus = Object.freeze ({
	unknown: 0,
	inprogress: 1,
	success: 2,
	failure: 3,
});

export default {
	props: ['wsid'],
	template: `<modal icon="users" :title="t('sharetitle')" :closeName="t('close')" :closeLink="{name: 'workspace', params: {wsid: workspace.metadata._id}}" :scaling="true" class="share">
			<select v-model="selectedShareUrl" name="shareKind" size="0">
			<option selected="selected" :value="false" class="read">{{ t('read') }}</option>
			<option :value="true" class="write">{{ t('write') }}</option>
			</select>
			<p>{{ shareMeaning }}</p>
			<template v-if="shareUrl[selectedShareUrl]">
				<div class="pure-g kind">
					<div class="pure-u-1-2">
						<input type="radio" name="mode" v-model="mode" value="link" id="shareModeLink">
						<label for="shareModeLink">Link teilen</label>
					</div>
					<div class="pure-u-1-2">
						<input type="radio" name="mode" v-model="mode" value="email" id="shareModeEmail">
						<label for="shareModeEmail">E-Mail senden</label>
					</div>
				</div>
				<template v-if="modeLink">
					<label for="shareUrl">{{ t('sharelink') }}</label>
					<input type="text" v-model="shareUrl[selectedShareUrl]" id="shareUrl" readonly="readonly">
				</template>
				<template v-if="modeEmail">
					<message v-if="emailQuotaReached" kind="warning">{{ t('quotareached') }}</message>
					<ul>
						<li v-for="a in emailAddresses">
							{{ a.name }}
							<small>{{ a.address }}</small>
							<action-button v-if="a.status==SendStatus.unknown" :f="_ => removeAddress(a)" icon="trash" importance="low"></action-button>
							<spinner v-else-if="a.status==SendStatus.inprogress"></spinner>
							<i v-else-if="a.status==SendStatus.success" class="fas fa-check"></i>
							<i v-else-if="a.status==SendStatus.failure" class="fas fa-exclamation"></i>
						</li>
					</ul>

					<p>{{ t('emailInstruct') }}</p>
					<label for="shareEmail">E-Mail</label>
					<input :placeholder="t('emailPlaceholder')" type="text" id="shareEmail" v-model="emailAddressesInput">
					<label for="shareName">{{ t('nameLabel') }}</label>
					<input placeholder="Name" type="text" id="shareName" v-model="emailName">
					<label for="shareMessage">{{ t('messageLabel') }}</label>
					<textarea style="flex-shrink: 0" :placeholder="t('messagePlaceholder')" id="shareMessage" v-model="emailMessage" required @focus="addAddress"></textarea>
					<template v-if="preview">
						<p>{{ t('preview') }}:</p>
						<pre class="mailpreview">{{ preview }}</pre>
					</template>
				</template>
			</template>
			<spinner v-else></spinner>
			<template v-slot:buttons>
				<action-button v-if="modeLink" :f="_ => copyToClipboard(shareUrl[selectedShareUrl])" :disabled="!shareUrl[selectedShareUrl]" icon="copy" importance="high">{{ t('copy') }}</action-button>
				<action-button v-if="modeEmail" :f="sendAllMails" :disabled="!canSend" icon="envelope" importance="high">{{ t('sendmail') }}</action-button>
			</template>
		</modal>`,
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

		strings: translations({
			de: {
				'sharetitle': 'Projekt teilen',
				'share': 'Teilen',
				'close': 'Schließen',
				'copy': 'Link kopieren',
				'sendmail': 'E-Mail verschicken',
				'read': 'Nur Lesen',
				'readMeaning': 'Der Benutzer kann das Projekt nur kopieren.',
				'write': 'Schreibzugriff',
				'writeMeaning': 'Der Benutzer kann das Projekt kopieren, Anwendungen starten und alle Daten ändern oder löschen.',
				'sharelink': 'Teile den folgenden Link',
				'quotareached': 'Du hast das Sendelimit erreicht und kannst heute keine weiteren E-Mails verschicken.',
				'preview': 'Vorschau',
				'messagePlaceholder': 'Deine Nachricht',
				'messageLabel': 'Nachricht',
				'nameLabel': 'Name (optional)',
				'emailPlaceholder': 'max@example.com oder Max Muster <max@example.com>, …',
				'emailInstruct': 'Bitte gib unten E-Mail-Adresse und Namen des Empfängers, sowie Deine Nachricht ein.',
				},
			en: {
				'sharetitle': 'Share project',
				'share': 'Share',
				'close': 'Close',
				'copy': 'Copy link',
				'sendmail': 'Send e-mail',
				'read': 'Read-only',
				'readMeaning': 'The user can only copy this project.',
				'write': 'Write access',
				'writeMeaning': 'The user can copy the project, start applications and modify or delete all data.',
				'sharelink': 'Share the link below',
				'quotareached': 'You’ve reached your email send quota. Please wait until tomorrow.',
				'preview': 'Preview',
				'messagePlaceholder': 'Your message',
				'messageLabel': 'Message',
				'nameLabel': 'Name (optional)',
				'emailPlaceholder': 'john@example.com or Jane Doe <jane@example.com>, …',
				'emailInstruct': 'Please enter email address and name of the recipient below, as well as your message.',
				},
			}),
	}),
	mixins: [i18nMixin],
	computed: {
		workspaces: function () { return this.state.workspaces; },
		workspace: function () {
			return this.workspaces ? this.workspaces.getById (this.wsid) : null;
		},
		shareMeaning: function () {
			if (!this.selectedShareUrl) {
				return this.t ('readMeaning');
			} else {
				return this.t ('writeMeaning');
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
					lang: this.language,
					template: 'invite',
					dryRun: dryRun,
					});
			const j = await r.json ();
			if (r.ok) {
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
					this.sendMail (this.emailAddresses[0], dryRun=true)
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


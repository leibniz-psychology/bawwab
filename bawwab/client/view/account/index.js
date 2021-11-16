import { store } from '../../app.js';
import { Settings } from '../../settings';
import { settingsProp } from '../../utils.js';
import template from './template.html';

export default {
	name: 'AccountView',
	template: template,
	data: _ => ({
		state: store.state,
	}),
	computed: {
		oauthInfo: function () {
			return this.state.session && this.state.session.oauthInfo;
		},
		canDelete: function () {
			return this.state.user && this.state.user.loginStatus == 'success';
		},
		username: function () { return this.state.user?.name; },
		/* used by settingsProp */
		settings: function () { return this.state.settings; },
		autocopySharedReadOnly: settingsProp ('autocopySharedReadOnly'),
		dontShowSharedReadOnlyPopUp: settingsProp ('dontShowSharedReadOnlyPopUp'),
		dontShowSharedWriteAccessPopUp: settingsProp ('dontShowSharedWriteAccessPopUp'),
	},
	methods: {
		mailto: function (a) {
			return `mailto:${a}`;
		},
	},
};


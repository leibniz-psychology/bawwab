import AccountDeleteView from './view/accountDelete.js';
import AccountView from './view/account.js';
import ActionView from './view/action.js';
import ApplicationView from './view/application.js';
import FaqView from './view/faq.js';
import IndexView from './view/index.js';
import LoginView from './view/login.js';
import LogoutView from './view/logout.js';
import NotFoundView from './view/notFound.js';
import OpenSourceView from './view/opensource.js';
import TermsOfServiceView from './view/tos.js';
import TermsOfServicePromptView from './view/tosPrompt.js';
import WorkspaceImportView from './view/workspaceImport.js';
import WorkspaceShareView from './view/workspaceShare.js';
import WorkspacePublishView from './view/workspacePublish.js';
import WorkspaceListView from './view/workspaceList.js';
import WorkspaceShowView from './view/workspaceShow.js';
import WorkspaceExportView from './view/workspaceExport.js';
import WorkspaceDeleteView from './view/workspaceDelete.js';
import WorkspacePackagesView from './view/workspacePackages.js';

import { createRouter, createWebHistory } from 'vue-router';

const routes = [
	{ path: '/workspaces', component: WorkspaceListView, name: 'workspaces', meta: { requireAuth: true } },
	{ path: '/workspaces/import', components: { default: WorkspaceListView, overlay: WorkspaceImportView }, name: 'workspaceImport', meta: { requireAuth: true } },
	{ path: '/workspaces/:wsid', component: WorkspaceShowView, name: 'workspace', props: true, meta: { requireAuth: true }  },
	{ path: '/workspaces/:wsid/delete', components: { default: WorkspaceShowView, overlay: WorkspaceDeleteView }, name: 'workspaceDelete', props: { default: true, overlay: true }, meta: { requireAuth: true } },
	{ path: '/workspaces/:wsid/share', components: { default: WorkspaceShowView, overlay: WorkspaceShareView }, name: 'workspaceShare', props: { default: true, overlay: true }, meta: { requireAuth: true } },
	{ path: '/workspaces/:wsid/publish', components: { default: WorkspaceShowView, overlay: WorkspacePublishView }, name: 'workspacePublish', props: { default: true, overlay: true }, meta: { requireAuth: true } },
	{ path: '/workspaces/:wsid/export', components: { default: WorkspaceShowView, overlay: WorkspaceExportView}, name: 'workspaceExport', props: { default: true, overlay: true }, meta: { requireAuth: true } },
	{ path: '/workspaces/:wsid/packages', components: { default: WorkspaceShowView, overlay: WorkspacePackagesView}, name: 'workspacePackages', props: { default: true, overlay: true }, meta: { requireAuth: true } },
	{ path: '/workspaces/:wsid/:appid/:appPath*',
		components: { default: WorkspaceShowView, overlay: ApplicationView },
		name: 'application',
		props: { default: true, overlay: function (route) {
			console.debug ('params', route.params);
			const appPath = route.params.appPath;
			let nextUrl = '/' + (appPath ? appPath : '');
			const params = new URLSearchParams (route.query);
			nextUrl += '?' + params.toString ();
			return {wsid: route.params.wsid, appid: route.params.appid, nextUrl: nextUrl};
		}},
		meta: { requireAuth: true } ,
		},
	{ path: '/terms', component: TermsOfServiceView, name: 'terms', props: { kind: 'tos' } },
	{ path: '/terms/prompt', components: { default: TermsOfServiceView, overlay: TermsOfServicePromptView }, name: 'termsPrompt', props: { default: { kind: 'tos' }, overlay: (route) => ({ next: route.query.next })} },
	{ path: '/privacy', component: TermsOfServiceView, name: 'privacy', props: { kind: 'privacy' } },
	{ path: '/account', component: AccountView, name: 'account', meta: { requireAuth: true }  },
	{ path: '/account/delete', components: { default: AccountView, overlay: AccountDeleteView }, name: 'accountDelete', meta: { requireAuth: true }  },
	{ path: '/logout', component: LogoutView, name: 'logout' },
	{ path: '/login/:status', component: LoginView, name: 'login', props: true },
	{ path: '/action/:token', component: ActionView, name: 'action', props: true, meta: { requireAuth: true }  },
	/* XXX: We should merge these two into a common markdown view? */
	{ path: '/faq', component: FaqView, name: 'faq' },
	{ path: '/opensource', component: OpenSourceView, name: 'opensource' },
	{ path: '/', component: IndexView, name: 'index' },
	{ path: '/:pathMatch(.*)*', component: NotFoundView }
]

export default router = createRouter ({
	routes: routes,
	history: createWebHistory (),
});


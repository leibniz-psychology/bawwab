export function trackNavigation (data) {
	_paq.push(['setReferrerUrl', data.referrer]);
	_paq.push(['setCustomUrl', data.url]);
	_paq.push(['setDocumentTitle', data.documentTitle]);
	_paq.push(['trackPageView']);
}

export function trackEvent (category, action, name, value) {
	_paq.push(['trackEvent', category, action, name, value]);
}


/* This is an object proxy, which redirects modifications to properties
 * and makes them sync’able.
 * The ES Proxy object cannot be extended through normal (i.e. ES2015)
 * means, so do it the old way. */
export default function (target) {
	const changes = new Map ();

	const proxy = new Proxy (target, {
			/* Intercept property get requests and show changed value if available,
			 * make original value available by prefixing with underscore */
			get: function (obj, prop, proxy) {
				if (prop === '_') {
					return obj;
				} else {
					if (changes.has (prop)) {
						return changes.get (prop);
					}
				}
				/* fall-through */
				return obj[prop];
			},

			/* Intercept property set requests and update changes array instead of
			 * the original object */
			set: function (obj, prop, value, proxy) {
				changes.set (prop, value);
				return true;
			}
		});

	proxy.sync = function () {
		for (const [k, v] of changes.entries ()) {
			target[k] = v;
		}
		changes.clear ();
	};
	proxy.reset = function () {
		changes.clear ();
	};

	return proxy;
}


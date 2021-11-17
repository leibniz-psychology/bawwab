/* inspired by https://stackoverflow.com/a/60786867 */
export function queryParamProp (key, defaultValue=null) {
	return {
		get () {
			const fromQuery = this.$route.query[key];
			return fromQuery ?? defaultValue;
		},
		set (value) {
			const q = {...this.$route.query};
			q[key] = value;
			console.log (q);
			this.$router.replace ({query: q});
		}
	}
}

/* Computed property from settings
 */
export function settingsProp (key, sync=true) {
	return {
		get () {
			if (this.settings) {
				return this.settings.get (key);
			} else {
				return null;
			}
		},
		async set (value) {
			if (this.settings) {
				this.settings.set (key, value);
				if (sync) {
					await this.settings.sync ();
				}
			} else {
				/* this should not happen */
				throw new Error ('settings unavailable');
			}
		}
	}
}

export class CancelledError extends Error {
};


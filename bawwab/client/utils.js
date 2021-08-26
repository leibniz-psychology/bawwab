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
			return this.settings.get (key);
		},
		async set (value) {
			this.settings.set (key, value);
			if (sync) {
				await this.settings.sync ();
			}
		}
	}
}

export class CancelledError extends Error {
};


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

export class CancelledError extends Error {
};


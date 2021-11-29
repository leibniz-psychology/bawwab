import {privateData} from "./config";

const settingsFileName = "settings.json"

export class Settings extends Map {
	constructor(username, settings) {
		super (settings);
		this.username = username;
	}

	/* Class method: Create Settings for user and load from his homedir
	 */
	static async load (username) {
		try {
			let response = await fetch (Settings.endpoint (username) + '/' + settingsFileName, {
				method: "GET",
			});

			let settings = undefined;
			if (response.ok) {
				settings = Object.entries (await response.json());
			}
			return new Settings (username, settings);
		} catch (error) {
			console.error("Failed to get user-settings from server!", error);
			throw error;
		}
	}

	static endpoint (username) {
		return `/api/filesystem${privateData}/${username}/.config/bawwab/userStorage`;
	}

	async put (path, content) {
		return await fetch(path, {
			method: "PUT",
			body: JSON.stringify(content)
		});
	}

	async sync() {
		const content = Object.fromEntries (this);
		const endpoint = Settings.endpoint (this.username);

		try {
			const path = endpoint + '/' + settingsFileName;
			let response = await this.put (path, content);

			if (!response.ok) {
				response = await fetch(endpoint, { method: "MKCOL" });
				if (response.ok) {
					/* retry */
					response = await this.put (path, content);
					if (!response.ok) {
						throw 'put';
					}
				} else {
					throw 'mkcol';
				}
			}
		} catch (error) {
			console.error("Failed to create userStorage-file!", error);
			throw error;
		}
	}
}


import { translations, i18nMixin } from '../i18n.js';

export default {
	name: 'OpenSourceView',
	data: _ => ({
		strings: translations ({
			de: {
				'content': `
# Software

PsychNotebook ist freie Software. Diese kann von jedem verwendet und für eigene Zwecke angepasst werden. Der Quelltext ist auf [GitHub](https://github.com/search?q=topic%3Apsychnotebook+org%3Aleibniz-psychology) verfügbar.

Weiterhin verwenden wir die folgende freie Software:

- [GNU Guix](https://guix.gnu.org/), ein auf Reproduzierbarkeit spezialisierter Paketmanager.
- [RStudio Server](https://www.rstudio.com/products/rstudio/#rstudio-server), eine Entwicklungsumgebung für R, welche den Bedingungen
der [GNU Affero General Public License Version
3](https://www.gnu.org/licenses/agpl-3.0.en.html) unterliegt. Den Quelltext findest Du auf
[GitHub](https://github.com/rstudio/rstudio/). Alle unseren Änderungen daran sind in unserem [Guix-Kanal](https://github.com/leibniz-psychology/guix-zpid)
öffentlich verfügbar.
- [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/).
`,
				},
			en: {
				'content': `
# Software

PsychNotebook is free software. It can be used or adapted by anyone for any purpose. Its source code is available on [GitHub](https://github.com/search?q=topic%3Apsychnotebook+org%3Aleibniz-psychology).

Additionally we use the following free software:

- [GNU Guix](https://guix.gnu.org/), a package manager specialized on reproducibility.
- [RStudio Server](https://www.rstudio.com/products/rstudio/#rstudio-server), a development environment for R, which is available under the terms of the [GNU Affero General Public License Version
3](https://www.gnu.org/licenses/agpl-3.0.en.html). Its source code is available on
[GitHub](https://github.com/rstudio/rstudio/). Our own changes can be studied using our public [Guix channel](https://github.com/leibniz-psychology/guix-zpid).
- [JupyterLab](https://jupyterlab.readthedocs.io/en/stable/).
`,
				},
			}),
		}),
	template: `<commonmark :safe="false" :level="2">{{ t('content') }}</commonmark>`,
	mixins: [i18nMixin],
};


import { translations, i18nMixin } from '../i18n.js';

export default {
	name: 'FaqView',
	template: `<div class="faq" v-html="t('content')">
</div>`,
	data: _ => ({
		/* application strings */
		strings: translations ({
			de: {
				content: `<h2>FAQ – Häufig gestellte Fragen</h2>
<h3>Was ist anders in PsychNotebook im Vergleich zu lokalen Installationen auf meinem eigenen PC?</h3>
<p>
PsychNotebook bietet diverse Software in einer eigenen Umgebung an, die mit anderen geteilt werden kann und Zusatzfunktionalitäten enthält.
</p>
<p>
Anwendungen, die in PsychNotebook bereitgestellt werden (z.B. RStudio, JupyterLab), sollten prinzipiell genauso verwendet werden können, wie als hätte man sie sich auf dem eigenen PC installiert. Hier gibt es jedoch folgende Einschränkungen:
</p>
<ol>
<li><p><strong>Pakete installieren, z.B. R-Pakete</strong></p>
<p>Die R-Funktion <code>install.packages()</code> ist in PsychNotebook nicht nutzbar. Neue Pakete kannst Du über den Menüpunkt Pakete verwalten hinzufügen, den Du auf der Seite Deines Projekts findest. Achtung, das Hinzufügen kann eine Weile dauern. </p>
<p>Falls Dein gewünschtes Paket im Paketmanager nicht verfügbar ist, sende eine E-Mail an psychnotebook@leibniz-psychology.org und gib darin den Namen des Pakets an, welches installiert werden soll. Wir melden uns dann bei Dir, wenn das Paket verfügbar ist.</p>
<p>Einmal installierte Pakete kannst Du in R wie gewohnt mit der Funktion <code>library()</code> aufrufen.</p>
</li>
<li><p><strong>Erweiterungen (“extensions”) in JupyterLab</strong></p>
<p>Erweiterungen können zur Zeit leider nicht in PsychNotebook hinzugefügt werden. </p>
</li>
</ol>

<h3>Welche Anwendung nutze ich für was?</h3>
<p>
R Studio eignet sich für die Auswertung von Daten, d. h. um statistische Analysen zu rechnen, Ergebnisgrafiken zu erstellen oder Daten zu inspizieren.
</p>

<p>
JupyterLab eignet sich für die Präsentation von Ergebnissen oder Analysen. Mit JupyterLab kannst Du formatierten Fließtext (R Markdown) und ausführbaren Code (R/Python) miteinander integrieren und Präsentationsfolien erstellen. 
</p>

<h3>
Ich möchte ein R Markdown Tutorial mit learnR erstellen. Wie gehe ich vor?
</h3>
<ol>
<li><p>Erstelle Dir ein neues Projekt in PsychNotebook.</p></li>
<li><p>Installiere Dir zunächst das Paket <kbd>psychnotebook-app-rmarkdown</kbd> über den Paketmanager. Das Paket learnR ist schon vorinstalliert.</p></li>
<li><p>Starte nun RStudio in Deinem Projekt und erstelle Dein Tutorial. Die Erstellung von learnR Tutorials funktioniert wie in Deiner lokalen R Installation (mehr Informationen findest Du in der Dokumentation von learnR).</p></li>
<li><p>Achte darauf, dass Deine Tutorial-Datei im Root-Folder liegt, d. h. im Verzeichnis <kbd>/home/joeuser</kbd>.</p></li>
<li><p>Damit jemand Dein Tutorial absolvieren kann, kannst Du Dein Projekt mit Lesezugriff teilen. Die Person kann sich dann Dein Projekt kopieren und das Tutorial über das R Markdown Symbol auf der Projektseite starten.</p></li>
</ol>

<h3>
Mein Problem taucht hier nicht auf. An wen kann ich mich wenden?
</h3>

<p>
Eine Ressourcensammlung zu R findest Du auf <a href="https://support.rstudio.com/hc/en-us/articles/200552336-Getting-Help-with-R">dieser Seite</a>.
</p>

<p>
Die Dokumentation von JupyterLab findest Du <a href="https://jupyterlab.readthedocs.io/en/stable/">hier</a>.
</p>

<p>
Für Probleme, die direkt PsychNotebook betreffen, schreib uns eine E-Mail (psychnotebook@leibniz-psychology.org)
</p>`,
				},
			en: {
				content: `
<h2>FAQ – Frequently asked questions</h2>
<h3>What is different in PsychNotebook compared to local installations on my own PC?</h3>

<p>PsychNotebook provides various software in an online environment which can be shared with others and offers additional functionalities.</p>

<p>Applications provided in PsychNotebook (e.g. RStudio, JupyterLab) should in principle be able to be used in the same way as if you had installed them on your own PC. However, the following restrictions exist:</p>

<ol>
<li>
<p><strong>Installing packages, e.g. R packages</strong></p>
<p>The R function <code>install.packages()</code> does not work in PsychNotebook. You can add new packages via the menu item Manage packages on the project page. Be aware that adding packages may take a while. </p>

<p>If your desired package is not available in the package manager, send an email to psychnotebook@leibniz-psychology.org including the name of the package. We will contact you, once the package will be available. </p>

<p>Once packages are installed, you can call them in R as usual with the function <code>library()</code>.</p>
</li>

<li><p><strong>Extensions in JupyterLab</strong></p>
<p>At this time, extensions cannot be added to PsychNotebook. </p>
</li>
</ol>


<h3>Which application do I use for which purpose?</h3>
<p>R Studio is most suitable for evaluating data, i.e. calculating statistical analyses, creating result graphs or inspecting data.</p>

<p>JupyterLab is most suitable for presenting results or analyses. With JupyterLab you can easily integrate formatted text (R Markdown) and executable code (R/Python) and create presentation slides. </p>


<h3>I want to create a R Markdown tutorial with learnR. How do I proceed?</h3>

<ol>
<li><p>Create a new project in PsychNotebook. </p></li>
<li><p>Install the package <kbd>psychnotebook-app-rmarkdown</kbd> via the package manager. The package learnR should be installed already. </p></li>
<li><p>Start RStudio in your project and create your tutorial. Find more information about this step in the learnR documentation. </p></li>
<li><p>Make sure that you save your tutorial file in the root folder, that is, in the directory  <kbd>/home/joeuser</kbd>.</p></li>
<li><p>To allow others to take your tutorial, you can share your project via read access with them. They can then copy your project and start the tutorial via the R Markdown icon on the project page. </p></li>
</ol>


<h3>My problem is not covered here. Where can I turn to?</h3>

<p>A collection of resources for R can be found on <a href="https://support.rstudio.com/hc/en-us/articles/200552336-Getting-Help-with-R">this page</a>.</p>

<p>You can find the documentation of JupyterLab <a href="https://jupyterlab.readthedocs.io/en/stable/">here</a>.</p>

<p>For issues directly concerning PsychNotebook, write us an email (psychnotebook@leibniz-psychology.org).</p>
`,
				},
			}),
	}),
	mixins: [i18nMixin],
};


# Hilfe

## Inhaltsverzeichnis
- [Registrieren](#register)
- [Benutzerkonto](#useraccount)
- [Neues Projekt erstellen](#new-project)
    - [Komplett neu erstellen](#new-project-from-scratch)
    - [Kopieren öffentlicher Projekte](#copy-public-projects)
    - [Ein Projekt importieren](#import-project)
    - [Zugriff auf mit Dir geteilte Projecte](#access-shared-projects)
    - [Risiken](#risks)
- [Arbeiten mit Psychnotebook](#working-with-psychnotebook)
    - [Dashboard](#dashboard)
    - [Projekte](#projects)
    - [Anwendungen ausführen](#execute-application)
    - [Pakete installieren](#install-packages)
- [Projekte teilen](#share-project)
    - [Projekte teilen mit Kopierrechten](#share-project-copy-access)
    - [Projekte teilen mit Schreibzugriff](#share-project-write-access)
- [Projekte veröffentlichen](#publish-project)
- [Projekte exportieren](#export-project)
- [FAQ - Häufig gestellte Fragen](#faq)
    - [Was ist anders in PsychNotebook im Vergleich zu lokalen Installationen?](#whats-different)
    - [Welche Anwendung nutze ich für was?](#which-application)
    - [Wie erstelle ich ein R Markdown Tutorial mit learnR?](#make-tutorial)
- [Hilfe erhalten und Fehler melden](#get-help)

## Registrieren<a id="register"></a>

Bevor Du Projekte erstellen oder darauf zugreifen kannst, musst Du ein Konto registrieren. Das ZPID bietet ein Single Sign-On System an, mit dem Du Dich mit demselben Benutzernamen und Passwort bei allen Produkten des ZPID anmelden kannst. Du kannst für das Single Sign-On System entweder Deinen ORCID-Account verwenden oder einen neuen (Leibniz-Psychologie-) Account erstellen.

## Benutzerkonto<a id="useraccount"></a>

Deine gespeicherten Kontodaten kannst Du einsehen, wenn Du in der oberen rechten Ecke des Menüs auf deine Initialen klickst. Es öffnet sich ein Dropdown-Menü, in dem Du durch Klicken auf "Benutzerkonto" Deine Kontodaten sowie eine Option zum Löschen Deines Kontos siehst. 

## Ein neues Projekt erstellen<a id="new-project"></a>

### Komplett neu erstellen<a id="new-project-from-scratch"></a>

Um ein neues Projekt zu erstellen, klicke im oberen Menü auf "Projekte". Das Dashboard, d. h. die Übersicht über alle Projekte, wird angezeigt. Klicke auf die Schaltfläche "Neues Projekt", die sich rechts oberhalb der Projekttabelle befindet, um ein Projekt von Grund auf neu zu erstellen. Füge einen Titel und eine Beschreibung für Dein Projekt hinzu und starte eine Anwendung (RStudio oder JupyterLab), um Code zu schreiben oder beliebige Forschungsmaterialien in dein Projekt hochzuladen. 

### Kopieren öffentlicher Projekte<a id="copy-public-projects"></a>

Die Projekttabelle hat drei Registerkarten/Tabs, die "Meine Projekte", "Gemeinsame Projekte" und "Öffentliche Projekte" heißen. Wähle den Tab "Öffentliche Projekte", um die Projekte zu sehen, die mit allen PsychNotebook-Benutzern geteilt wurden. Wähle ein Projekt aus, indem Du auf dessen Titel oder Beschreibung klickst. Auf der Projektseite kannst Du dann mit dem Menüpunkt "kopieren" eine Momentaufnahme des aktuellen Status des Projekts zu Deinen eigenen Projekten hinzufügen. Deine Kopie erscheint dann unter dem Reiter "Meine Projekte" und Du kannst daran arbeiten.

### Ein Projekt importieren<a id="import-project"></a>

PsychNotebook-Projekte können als Zip- oder Tarball-Dateien exportiert werden. Diese Dateien können wieder in PsychNotebook importiert werden. Um ein zuvor exportiertes PsychNotebook-Projekt zu importieren, gehe durch einen Klick auf "Projekte" zur Projektübersicht/Dashboard. Klicke dort auf die Schaltfläche "Projekt importieren", die sich rechts oberhalb der Projekttabelle befindet. Du wirst aufgefordert, die Datei auf Deinem lokalen System auszuwählen. Mit einem Klick auf "importieren" schließt Du den Vorgang ab. Das importierte Projekt erscheint unter der Registerkarte "Meine Projekte".

### Zugriff auf mit Dir geteilte Projekte<a id="access-shared-projects"></a>

Projekte können per Link oder durch Versenden einer E-Mail aus PsychNotebook, die einen Link zu dem Projekt enthält, geteilt werden.

Dabei gibt es zwei Varianten: das Teilen mit Kopierrechten oder mit Schreibzugriff.

*Kopierrechte*: Du kannst eine unabhängigen Kopie erstellen, die ein "Schnappschuss" des geteilten Projektes ist. Das heißt, dass die Kopie zum Zeitpunkt des Kopierens exakt dem Originalprojekt der teilenden Person entspricht. Danach entwickeln sich die beiden Projekte jedoch unabhängig voneinander und werden niemals synchronisiert. In der Kopie des geteilten Projektes hast Du die gleichen umfassenden Rechte, wie in einem von Dir persönlich erstellten Projekt. Die Person, die das Originalprojekt mit Dir geteilt hat, kann deine Kopie weder einsehen noch verändern. 

Um eine solche Kopie zu erstellen, klicke in der Projektseite des geteilten Projektes auf den Button "kopieren".

*Schreibzugriff*: Du und die teilende Person arbeiten am selben Projekt. Eure Änderungen am Projekt werden synchronisiert, sodass diese von der jeweils anderen Person eingesehen und bearbeitet werden können.

In dieser Variante kannst Du direkt von der Projektseite des geteilten Projektes aus die von Dir gewünschte Anwendung starten und mit der Bearbeitung beginnen.

Achtung: diese Funktion ist derzeit experimentell und es kann zu unerwartetem Verhalten kommen.

### Risiken<a id="risks"></a>

PsychNotebook kann technisch nicht feststellen, ob Projekte Code enthalten, der bei seiner Ausführung schädliche oder unerwünschte Effekte hat. Deshalb solltest du nur geteilte Projekte von Personen kopieren/öffnen/ausführen, die du persönlich kennst und denen du vertraust!

## Arbeiten mit PsychNotebook<a id="working-with-psychnotebook"></a>

### Dashboard<a id="dashboard"></a>

Das Dashboard enthält eine Übersicht über alle Projekte, die in drei Registerkarten unterteilt sind: 

1) Projekte, die Du selbst erstellt hast ("Meine Projekte"), 

2) Projekte, die speziell für Dich freigegeben wurden ("Geteilte Projekte") und 

3) Projekte, die mit allen Benutzern von PsychNotebook geteilt wurden ("Öffentliche Projekte"). 

### Projekte<a id="projects"></a>

PsychNotebook ist in Projekten strukturiert, auf die Du mit verschiedenen Anwendungen (z. B. RStudio und JupyterLab) zugreifen kannst. Wenn Du also eine Datei in RStudio hinzugefügt hast, wird diese Datei auch mit JupyterLab in diesem Projekt zugänglich sein. Projekte können alle Arten von Forschungsmaterialien enthalten, z. B. Code, Daten oder Textdokumente. 

Eine detaillierte Ansicht der Projektinformationen und aller Aktionen, die auf Projektebene durchgeführt werden können (z. B. teilen, kopieren, exportieren, löschen, etc.) wird auf der Projektseite dargestellt. Klicke im Dashboard auf den Titel oder die Beschreibung eines Projekts, um dessen Projektseite zu öffnen. 

### Anwendungen ausführen (z. B. RStudio and JupyterLab)<a id="execute-application"></a>

Du kannst auf den Inhalt eines Projekts zugreifen, indem Du es mit einer Anwendung startest. Standardmäßig sind RStudio und JupyterLab für neue Projekte vorinstalliert. Klicke auf das RStudio- oder JupyterLab-Symbol eines Projekts, das im Dashboard und auf der Projektseite angezeigt wird, um die jeweilige Anwendung zu starten. Du kannst auch mehrere Anwendungen und Projekte gleichzeitig ausführen, wenn Du sie in separaten Tabs in Deinem Browser öffnest.  

### Pakete installieren<a id="install-packages"></a>

Falls Du versucht hast, ein R-Paket zu installieren, wirst Du bemerkt haben, dass die R-Funktion `install.packages()` in PsychNotebook nicht funktioniert. Stattdessen kannst Du neue Pakete hinzufügen, indem Du auf der Projektseite auf "Pakete verwalten" klickst und dort dann über das sich öffnende Dialogfenster nach dem benötigten Paket suchst. Beachte, dass das Hinzufügen von Paketen eine Weile dauern kann. Wenn in dem Projekt bereits eine Anwendung läuft, wenn Du ein neues Paket hinzufügst, dann musst Du die Anwendung beenden und neu starten, bevor das neue Paket verfügbar ist. Sobald die Pakete installiert sind, kannst Du sie in R wie gewohnt mit der Funktion `library()` laden.

Es ist möglich, auch andere Pakete als R-Pakete zu installieren. Tatsächlich können alle Pakete, die für Guix, einer Software, die das Rückgrat von PsychNotebook bildet, verfügbar sind, in PsychNotebook installiert werden. Bitte beachte, dass dies zwar möglich, aber nicht für jedes Paket ratsam ist.

Wenn Dein gewünschtes Paket nicht in der "Pakete verwalten"-Suche gefunden wird, kannst Du eine Anfrage zur Installation dieses Pakets an psychnotebook@leibniz-psychology.org senden. Gib dabei bitte den Namen des Pakets an, idealerweise auch einen Link zu dessen Dokumentation (z. B. auf CRAN). 

## Projekte teilen<a id="share-project"></a>

Um ein Projekt zu teilen, gehe auf die Projektseite, indem Du auf den Titel oder die Beschreibung des Projekts im Dashboard klickst. Wähle im Projektmenü "Teilen". Es öffnet sich ein Dialogfenster, in dem Du die Zugriffsrechte, die der Empfänger erhalten soll (Nur-Lese- oder Schreibzugriff), und die Art der Freigabe (Link oder E-Mail) auswählen kannst. Links, die Du zum Freigeben eines Projekts erzeugst, sind (fast) unbegrenzt gültig und können zur Erstellung mehrerer Kopien verwendet werden.   

### Projekte teilen mit Kopierrechten<a id="share-project-copy-access"></a>

Wenn Du im Dropdown-Menü "Kopierrechte" auswählst, kann der Empfänger des Projektlinks seine eigene Kopie des freigegebenen Projekts erstellen. Diese Kopie ist unabhängig, d. h. Änderungen an der Kopie haben keinen Einfluss auf das Originalprojekt. 

### Projekte teilen mit Schreibzugriff<a id="share-project-write-access"></a>

Wenn Du im Dropdown-Menü "Schreibzugriff" auswählst, erhält der Empfänger des Projektlinks dieselben Berechtigungen für das Projekt wie Du, der/die Teilende. Achtung, diese Funktion ist derzeit experimentell und es kann zu unerwartetem Verhalten kommen.

## Projekte veröffentlichen<a id="publish-project"></a>

Wir möchten Dich dazu ermutigen, von Dir erstellte Lerninhalte (z. B. Tutorials und Code für statistische Analysen) mit anderen zu teilen! Um ein Projekt mit allen Benutzern von PsychNotebook zu teilen, kannst Du es veröffentlichen. Gehe dazu auf die Projektseite des jeweiligen Projekts und klicke im Projektmenü auf "Veröffentlichen". Es öffnet sich ein Dialogfenster, das Du bestätigen musst, um fortzufahren. Einmal veröffentlicht, kann Dein Projekt von anderen Benutzern kopiert werden.

Dein veröffentlichtes Projekt wird im Dashboard unter dem Reiter "Öffentliche Projekte" präsentiert. Für Dich wird es auch unter "Meine Projekte" aufgelistet. Sei Dir bewusst, dass es sich um dasselbe Projekt handelt - wenn Du Dein Projekt nach der Veröffentlichung bearbeitest (auch wenn Du es unter dem Reiter "Meine Projekte" gestartet hast), sind die Änderungen sofort für alle sichtbar. Du kannst Deine Projekte nach der Veröffentlichung zurückziehen, indem Du Sie löschst, aber Kopien, die bereits von anderen Benutzern erstellt wurden, bleiben davon unberührt.

## Projekte exportieren<a id="export-project"></a>

Um Dein Projekt zu archivieren, kannst Du es auf Dein lokales System exportieren. Rufe die Projektseite auf, indem Du im Dashboard auf den Titel und oder die Beschreibung des Projekts klickst. Klicke im Projektmenü auf "Exportieren". Es öffnet sich ein Dialogfenster, in dem Du auswählen kannst, ob Du dein Projekt als ZIP- oder Tarball-Datei exportieren möchtest. Sofern Du nicht Linux auf deinem lokalen System verwendest, wähle die ZIP-Option. Bestätige mit einem Klick auf "exportieren". Die komprimierte Datei enthält alle Materialien, die Du zu Deinem Projekt hinzugefügt hast, sowie alle Abhängigkeiten, mit denen sich die genaue Umgebung Deines Projekts wiederherstellen lässt. Dein Projekt wird dadurch reproduzierbar. Du kannst die ZIP-Datei zu einem späteren Zeitpunkt wieder in PsychNotebook importieren und dann Dein Projekt wieder ausführen und bearbeiten. 

## FAQ - Häufig gestellte Fragen<a id="faq"></a>

### Was ist anders in PsychNotebook im Vergleich zu lokalen Installationen auf meinem eigenen PC?<a id="whats-different"></a>

PsychNotebook bietet diverse Software in einer eigenen Umgebung an, die mit anderen geteilt werden kann und Zusatzfunktionalitäten enthält.

Anwendungen, die in PsychNotebook bereitgestellt werden (z.B. RStudio, JupyterLab), sollten prinzipiell genauso verwendet werden können, als hätte man sie sich auf dem eigenen PC installiert. Hier gibt es jedoch folgende Einschränkungen:

1.  Pakete installieren, z. B. R-Pakete: Lies den Abschnitt dazu weiter oben für mehr Informationen.

2.  Erweiterungen ("extensions") in JupyterLab: Erweiterungen können zur Zeit leider nicht in PsychNotebook hinzugefügt werden.

### Welche Anwendung nutze ich für was?<a id="which-application"></a>

R Studio eignet sich für die Auswertung von Daten, d. h. um statistische Analysen zu rechnen, Ergebnisgrafiken zu erstellen oder Daten zu inspizieren.

JupyterLab eignet sich für die Präsentation von Ergebnissen oder Analysen. Mit JupyterLab kannst Du formatierten Fließtext (R Markdown) und ausführbaren Code (R/Python) miteinander integrieren und Präsentationsfolien erstellen.

### Ich möchte ein R Markdown Tutorial mit learnR erstellen. Wie gehe ich vor?<a id="make-tutorial"></a>

1.  Erstelle Dir ein neues Projekt in PsychNotebook.

2.  Installiere Dir zunächst das Paket psychnotebook-app-rmarkdown über den Paketmanager. Das Paket learnR ist schon vorinstalliert.

3.  Starte nun RStudio in Deinem Projekt und erstelle Dein Tutorial. Die Erstellung von learnR Tutorials funktioniert wie in Deiner lokalen R-Installation (mehr Informationen findest Du in der Dokumentation von learnR).

4.  Achte darauf, dass Deine Tutorial-Datei im Root-Folder liegt, d. h. im Verzeichnis /home/joeuser.

5.  Damit jemand Dein Tutorial absolvieren kann, kannst Du Dein Projekt mit Lesezugriff teilen. Die Person kann sich dann Dein Projekt kopieren und das Tutorial über das R Markdown Symbol auf der Projektseite starten.

## Hilfe erhalten und Fehler melden<a id="get-help"></a>

Eine Ressourcensammlung zu R findest Du auf [dieser Seite](https://support.rstudio.com/hc/en-us/articles/200552336-Getting-Help-with-R).

Die Dokumentation von JupyterLab findest Du [hier](https://jupyterlab.readthedocs.io/en/stable/).

Für Probleme, die direkt PsychNotebook betreffen, schreib eine E-Mail an psychnotebook@leibniz-psychology.org.

# Help

## Table of Contents
- [Signing up](#register)
- [Account](#useraccount)
- [Creating a new project](#new-project)
    - [From scratch](#new-project-from-scratch)
    - [Copying public projects](#copy-public-projects)
    - [Importing a project](#import-project)
    - [Accessing projects shared with you](#access-shared-projects)
    - [Risks](#risks)
- [Working with PsychNotebook](#working-with-psychnotebook)
    - [Dashboard](#dashboard)
    - [Projects](#projects)
    - [Running Applications](#execute-application)
    - [Installing packages](#install-packages)
- [Sharing projects](#share-project)
    - [Sharing projects as copy access](#share-project-copy-access)
    - [Sharing projects with write access](#share-project-write-access)
- [Publishing projects](#publish-project)
- [Exporting projects](#export-project)
- [FAQ](#faq)
    - [What is different in PsychNotebook compared to local installations?](#whats-different)
    - [Which application do I use for which purpose?](#which-application)
    - [How do I create a R Markdown tutorial with learnR?](#make-tutorial)
- [Getting help and reporting bugs](#get-help)

## Signing up<a id="register"></a>

Before you can create or access projects, you need to register an account. ZPID offers a single sign-on system that allows you to log in to all of ZPID's products with the same username and password. To register for the single sign-on system, you can choose to use your ORCID account or to create a new, Leibniz Psychology, account.

## Account<a id="useraccount"></a>

You can view your saved account information by clicking on your initials in the upper right corner of the menu. A drop-down menu will open where you can click on "account" to see your account details and an option to delete your account. 

## Creating a new project<a id="new-project"></a>

### From scratch<a id="new-project-from-scratch"></a>

To create a new project, click on „projects" in the top menu. The dashboard, that is the overview of all projects, will be shown. Click on the button „new project" located right above the project table to create a new project from scratch. Add a title and a description of your project and start an application (RStudio or JupyterLab) to write code, or upload any research materials into your project. 

### Copying public projects<a id="copy-public-projects"></a>

The project table has three tabs, called "my projects", "shared projects", and "public projects". Select the tab "public projects" to see the projects that have been shared with all PsychNotebook users. Select a project by clicking on its title or description. On the project page, you can select "copy" to add a snapshot of the current status of the project to your own projects. Your copy will appear under the tab "my projects" and you will be able to modify its contents.

### Importing a project<a id="import-project"></a>

PsychNotebook projects can be exported as zip or tarball files. These files can be re-imported into PsychNotebook again. To import a previously exported PsychNotebook project, go to the project overview (the dashboard) by clicking on "projects" in the top menu. Click on the button „import project" located right above the project table. You will be prompted to select the file from your local system. Clicking "import" finishes the process. The imported project will appear under the tab "my projects".

### Accessing projects shared with you<a id="access-shared-projects"></a>

Projects can be shared by link or by sending an email from PsychNotebook containing a link to the project.

There are two options: Sharing with copy access or with write access.

*Copy access*: You can create an independent copy that is a "snapshot" of the shared project. This means that at the time of copying, the copy looks exactly the same as the original project of the person sharing. After that, however, the two projects evolve independently and are never synchronized. In the copy of the shared project you have the same comprehensive rights as in a project created by you personally. The person who shared the original project with you cannot view or modify your copy. 

To create such a copy, click the "copy" button on the project page of the shared project.

*Write access*: You and the sharing person work on the exact same project. Your changes to the project will be synchronized so that they can be viewed and edited by the other person.

Using this option, you can start to work with the project by starting your desired application directly from the project page of the shared project.

Be careful, this feature is currently experimental and unexpected behavior may occur.

### Risks<a id="risks"></a>

PsychNotebook cannot technically identify whether projects contain code that has harmful or undesirable effects when executed. Therefore you should only copy/open/execute shared projects from people you personally know and trust!

## Working with PsychNotebook<a id="working-with-psychnotebook"></a>

### Dashboard<a id="dashboard"></a>

The dashboard contains an overview of all projects divided in three tabs: 

1) projects that you created ("my projects"), 

2) projects that were shared with you specifically ("shared projects") and 

3) projects that were shared with all users of PsychNotebook ("public projects"). 

### Projects<a id="projects"></a>

PsychNotebook is structured in projects that can be accessed by different applications, e.g. RStudio and JupyterLab. Thus, if you added a file in RStudio, this file will also be accessible with JupyterLab in that project. Projects can contain all kinds of research materials, such as code, data, or text documents.

A detailed view of the project information and all actions that can be performed on the project (e.g., share, copy, export, delete, etc.) , is presented on the project page. In the dashboard, click on a project's title or description to open its project page. 

### Running Applications (e.g., RStudio and JupyterLab)<a id="execute-application"></a>

You can access the content of a project by starting it with an application. By default, RStudio and JupyterLab are pre-installed for new projects. Click on the RStudio or JupyterLab icon of a project that is displayed in the dashboard and on the project page, to start the respective application. It is also possible to run and work with multiple applications and projects at the same time if you open them in separate tabs in your browser.  

### Installing packages<a id="install-packages"></a>

If you tried to install a R package, you will notice that the R function `install.packages()` does not work in PsychNotebook. Instead, you can add new packages by clicking on "Manage packages" on the project page and then searching for the package you need. Be aware that adding packages may take a while. If an application is already running when you added a new package, you need to quit the application and restart it. Once packages are installed, you can call them in R as usual with the function `library()`.

It is possible to install packages other than R packages. In fact, all packages that are available on Guix, a software that constitutes the backbone of PsychNotebook, can be installed in PsychNotebook. Please note that while possible, it may not be advisable for every package.

If your desired package cannot be found in the "manage packages" search, you can send a request for installing this package to <psychnotebook@leibniz-psychology.org>. Make sure to include the name of the package, ideally a link to its documentation (e.g. on CRAN). 

## Sharing projects<a id="share-project"></a>

To share a project, go on the project page by clicking on the title or description of the project in the dashboard. Select "share" in the project menu. A dialogue will open where you can select the access rights that will be given to the receiver (copy access or write access) and the mode of sharing (link or email). Links that you generate to share a project will be valid (almost) indefinitely and can be used to make multiple copies.   

### Sharing projects as copy access<a id="share-project-copy-access"></a>

Selecting "copy access" in the dropdown menu will allow the receiver of the project link to make their own copy of the shared project. This copy will be independent, thus, changes in the copy will not influence the original project. 

### Sharing projects with write access<a id="share-project-write-access"></a>

Selecting "write access" in the dropdown menu will give the receiver of the project link the same permissions of the project as you, the sharer. Be careful, this feature is currently experimental and unexpected behavior can occur.

## Publishing projects<a id="publish-project"></a>

We want to encourage you to share educational content (e.g., tutorials and code for statistical analyses) that you created with others! To share a project with all users of PsychNotebook, you can publish it. To do so, go to the project page of the respective project and click "publish" in the project menu. A dialogue window will open that you need to confirm to proceed. Once published, your project can be copied by other users.

Your published project is presented under the tab "public projects" in the dashboard. For you, it will also be listed under "my projects". Be aware that this is the same project - if you edit your project after publishing it (even if you started it under the tab "my projects"), the changes will be visible to everyone immediately. You can retract your projects after publication by deleting them but copies that have already been made by other users will remain unaffected.

## Exporting projects<a id="export-project"></a>

To archive your project, you can export it to your local system. Go to the project page by clicking on the title and or description of your project in the dashboard. In the project menu, click on "export". A dialogue window will open where you can select whether you want to export your project as ZIP or tarball file. Unless you use Linux on your local system, select the ZIP-option. Confirm by clicking on "export". The compressed file will contain all the materials that you added to your project as well as all the dependencies that can restore the exact environment of your project. Your project will be reproducible. You can re-import the ZIP-file to PsychNotebook at a later point in time and you will still be able to run and edit your project. 

## FAQ<a id="faq"></a>

### What is different in PsychNotebook compared to local installations on my own PC?<a id="whats-different"></a>

PsychNotebook provides various software in an online environment which can be shared with others and offers additional functionalities.

Applications provided in PsychNotebook (e.g. RStudio, JupyterLab) should in principle be able to be used in the same way as if you had installed them on your own PC. However, the following restrictions exist:

1.  Installing packages, e.g. R packages: Read the section above for more information.

2.  Extensions in JupyterLab: At this time, extensions cannot be added to PsychNotebook.

### Which application do I use for which purpose?<a id="which-application"></a>

RStudio is most suitable for evaluating data, i.e. calculating statistical analyses, creating result graphs or inspecting data.

JupyterLab is most suitable for presenting results or analyses. With JupyterLab you can easily integrate formatted text (R Markdown) and executable code (R/Python) and create presentation slides.

### I want to create a R Markdown tutorial with learnR. How do I proceed?<a id="make-tutorial"></a>

1.  Create a new project in PsychNotebook.

2.  Install the package psychnotebook-app-rmarkdown (see above section about installing packages). The package learnR should be installed already.

3.  Start RStudio in your project and create your tutorial. Find more information about this step in the learnR documentation.

4.  Make sure that you save your tutorial file in the root folder, that is, in the directory /home/joeuser.

5.  To allow others to take your tutorial, you can share your project via read access with them. They can then copy your project and start the tutorial via the R Markdown icon on the project page.

## Getting help and reporting bugs<a id="get-help"></a>

A collection of resources for R can be found on [this page](https://support.rstudio.com/hc/en-us/articles/200552336-Getting-Help-with-R).

You can find the documentation of JupyterLab [here](https://jupyterlab.readthedocs.io/en/stable/).

For issues directly concerning PsychNotebook, write an email to psychnotebook@leibniz-psychology.org.

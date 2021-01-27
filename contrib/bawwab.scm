(define-module (bawwab)
  #:use-module ((guix licenses) #:prefix license:)
  #:use-module (gnu packages)
  #:use-module (gnu packages python-xyz)
  #:use-module (gnu packages python-web)
  #:use-module (gnu packages check)
  #:use-module (gnu packages time)
  #:use-module (gnu packages fonts)
  #:use-module (gnu packages databases)
  #:use-module (gnu packages shellutils)
  #:use-module (gnu packages ssh)
  #:use-module (gnu packages web)
  #:use-module ((zpid packages tortoise) #:prefix zpid:)
  #:use-module (guix packages)
  #:use-module (guix download)
  #:use-module (guix build-system python)
  #:use-module (guix gexp)
  #:use-module (srfi srfi-1)
  #:use-module (srfi srfi-26))

(define %source-dir (dirname (dirname (current-filename))))

(package
  (name "bawwab")
  (version "0.1")
  (source (local-file %source-dir #:recursive? #t))
  (build-system python-build-system)
  (arguments
    `(#:tests? #f
      ;; Required, since guix will set the source directory to r/o and building
      ;; would re-generate assets.
      #:configure-flags '("--skip-build")))
  (propagated-inputs
   `(("python-asyncssh" ,python-asyncssh)
     ("python-furl" ,python-furl)
     ("python-pyyaml" ,python-pyyaml)
     ("python-sanic" ,python-sanic)
     ("python-aiohttp" ,python-aiohttp)
     ("python-pytz" ,python-pytz)
     ("font-awesome" ,font-awesome)
     ("python-tortoise-orm" ,zpid:python-tortoise-orm)
     ("python-aiosqlite" ,python-aiosqlite)))
  (native-inputs `(("esbuild" ,esbuild)))
  (home-page #f)
  (synopsis #f)
  (description #f)
  (license #f))


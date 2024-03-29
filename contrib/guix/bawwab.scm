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
  #:use-module (gnu packages mail)
  #:use-module (gnu packages node)
  #:use-module (gnu packages openldap)
  #:use-module (guix packages)
  #:use-module (guix download)
  #:use-module (guix build-system python)
  #:use-module (guix gexp)
  #:use-module (srfi srfi-1)
  #:use-module (srfi srfi-26))

(define-public python-aiosmtplib
  (package
    (name "python-aiosmtplib")
    (version "1.1.4")
    (source
      (origin
        (method url-fetch)
        (uri (pypi-uri "aiosmtplib" version))
        (sha256
          (base32
            "0ha5n8fwm2rx86clhas5s1cnq7was3xm9jbg4ywhbakmcjhd0w42"))))
    (build-system python-build-system)
    (arguments
     '(#:tests? #f ; Tests fail.
       #:phases
       (modify-phases %standard-phases
         (replace 'check
           (lambda* (#:key tests? inputs outputs #:allow-other-keys)
            (when tests?
             (add-installed-pythonpath inputs outputs)
             (invoke "pytest" "-vv"))
             #t)))))
    (native-inputs
      `(("python-pytest" ,python-pytest)
        ("python-pytest-asyncio" ,python-pytest-asyncio)
        ("python-aiosmtpd" ,python-aiosmtpd)))
    (home-page "https://github.com/cole/aiosmtplib")
    (synopsis "asyncio SMTP client")
    (description "asyncio SMTP client")
    (license license:expat)))

(define %source-dir (dirname (dirname (dirname (current-filename)))))

(define-public bawwab
  (package
    (name "bawwab")
    (version "0.1")
    (source (local-file %source-dir #:recursive? #t))
    (build-system python-build-system)
    (arguments (list #:tests? #f)) ; No tests.
    (propagated-inputs
     `(("python-asyncssh" ,python-asyncssh)
       ("python-furl" ,python-furl)
       ("python-pyyaml" ,python-pyyaml)
       ("python-sanic" ,python-sanic)
       ("python-websockets" ,python-websockets)
       ("python-aiohttp" ,python-aiohttp)
       ("python-pytz" ,python-pytz)
       ("python-tortoise-orm" ,python-tortoise-orm)
       ("python-aiosqlite" ,python-aiosqlite)
       ("python-aiosmtplib" ,python-aiosmtplib)
       ("python-bonsai" ,python-bonsai)
       ("python-pypika-tortoise" ,python-pypika-tortoise)
       ("python-structlog" ,python-structlog)))
    (home-page #f)
    (synopsis #f)
    (description #f)
    (license #f)))


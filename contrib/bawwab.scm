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
  #:use-module (guix packages)
  #:use-module (guix download)
  #:use-module (guix build-system python)
  #:use-module (guix build-system node)
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

(define-public node-babel-parser-7.13.13
  (package
    (name "node-babel-parser")
    (version "7.13.13")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@babel/parser/-/parser-7.13.13.tgz")
        (sha256
          (base32
            "0awgvrnx8qr0fhzj61krnaq9j6x2jy3li3b3lx2365akb5i4gmb5"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page
      "https://babel.dev/docs/en/next/babel-parser")
    (synopsis "A JavaScript parser")
    (description "A JavaScript parser")
    (license license:expat)))

(define-public node-babel-helper-validator-identifier-7.12.11
  (package
    (name "node-babel-helper-validator-identifier")
    (version "7.12.11")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@babel/helper-validator-identifier/-/helper-validator-identifier-7.12.11.tgz")
        (sha256
          (base32
            "02pl51v3wf8mkych0gwdfgsdh3icaxswhl89nbwzqw0x05saq2my"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page
      "https://www.npmjs.com/package/node-babel-helper-validator-identifier")
    (synopsis "Validate identifier/keywords name")
    (description "Validate identifier/keywords name")
    (license license:expat)))

(define-public node-lodash-4.17.21
  (package
    (name "node-lodash")
    (version "4.17.21")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/lodash/-/lodash-4.17.21.tgz")
        (sha256
          (base32
            "017qragyfl5ifajdx48lvz46wr0jc1llikgvc2fhqakhwp4pl23a"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page "https://lodash.com/")
    (synopsis "Lodash modular utilities.")
    (description "Lodash modular utilities.")
    (license license:expat)))

(define-public node-to-fast-properties-2.0.0
  (package
    (name "node-to-fast-properties")
    (version "2.0.0")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/to-fast-properties/-/to-fast-properties-2.0.0.tgz")
        (sha256
          (base32
            "10q99rgk8nfl8k7q0aqmik4wkbm8zp4z0rpwbm8b0gr4pi4gw4y7"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page
      "https://github.com/sindresorhus/to-fast-properties#readme")
    (synopsis
      "Force V8 to use fast properties for an object")
    (description
      "Force V8 to use fast properties for an object")
    (license license:expat)))

(define-public node-babel-types-7.13.14
  (package
    (name "node-babel-types")
    (version "7.13.14")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@babel/types/-/types-7.13.14.tgz")
        (sha256
          (base32
            "0zwl8bvr1b48rrp76a82xpbpgdqpxy8zj847cg0c8a9xf0nhv1kl"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (inputs
      `(("node-to-fast-properties"
         ,node-to-fast-properties-2.0.0)
        ("node-lodash" ,node-lodash-4.17.21)
        ("node-babel-helper-validator-identifier"
         ,node-babel-helper-validator-identifier-7.12.11)))
    (home-page
      "https://babel.dev/docs/en/next/babel-types")
    (synopsis
      "Babel Types is a Lodash-esque utility library for AST nodes")
    (description
      "Babel Types is a Lodash-esque utility library for AST nodes")
    (license license:expat)))

(define-public node-estree-walker-2.0.2
  (package
    (name "node-estree-walker")
    (version "2.0.2")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/estree-walker/-/estree-walker-2.0.2.tgz")
        (sha256
          (base32
            "0n1wn3ii6q3dcjy2sbsawsysgyad1hlijhb3as6mdid977jk2a9h"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page
      "https://github.com/Rich-Harris/estree-walker#readme")
    (synopsis "Traverse an ESTree-compliant AST")
    (description "Traverse an ESTree-compliant AST")
    (license license:expat)))

(define-public node-source-map-0.6.1
  (package
    (name "node-source-map")
    (version "0.6.1")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz")
        (sha256
          (base32
            "11ib173i7xf5sd85da9jfrcbzygr48pppz5csl15hnpz2w6s3g5x"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page
      "https://github.com/mozilla/source-map")
    (synopsis "Generates and consumes source maps")
    (description
      "Generates and consumes source maps")
    (license license:bsd-3)))

(define-public node-vue-compiler-core-3.0.11
  (package
    (name "node-vue-compiler-core")
    (version "3.0.11")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/compiler-core/-/compiler-core-3.0.11.tgz")
        (sha256
          (base32
            "1f06fxbihwhgsg4yaa0ps5qls5ilp1iill0d73s6alsi6wwnrmbx"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (inputs
      `(("node-source-map" ,node-source-map-0.6.1)
        ("node-estree-walker" ,node-estree-walker-2.0.2)
        ("node-babel-types" ,node-babel-types-7.13.14)
        ("node-babel-parser" ,node-babel-parser-7.13.13)
        ("node-vue-shared" ,node-vue-shared-3.0.11)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/compiler-core#readme")
    (synopsis "@vue/compiler-core")
    (description "@vue/compiler-core")
    (license license:expat)))

(define-public node-vue-compiler-dom-3.0.11
  (package
    (name "node-vue-compiler-dom")
    (version "3.0.11")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/compiler-dom/-/compiler-dom-3.0.11.tgz")
        (sha256
          (base32
            "0cn5sr8qn047q93qxpib3p18939v79ld2khinbk9lv3zmc533yfk"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (inputs
      `(("node-vue-compiler-core"
         ,node-vue-compiler-core-3.0.11)
        ("node-vue-shared" ,node-vue-shared-3.0.11)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/compiler-dom#readme")
    (synopsis "@vue/compiler-dom")
    (description "@vue/compiler-dom")
    (license license:expat)))

(define-public node-vue-shared-3.0.11
  (package
    (name "node-vue-shared")
    (version "3.0.11")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/shared/-/shared-3.0.11.tgz")
        (sha256
          (base32
            "1sx11hwzjf36apv5dlryr59xqgh9a6vq92p3hi1zd7nlf0siw7a2"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/shared#readme")
    (synopsis
      "internal utils shared across @vue packages")
    (description
      "internal utils shared across @vue packages")
    (license license:expat)))

(define-public node-vue-reactivity-3.0.11
  (package
    (name "node-vue-reactivity")
    (version "3.0.11")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/reactivity/-/reactivity-3.0.11.tgz")
        (sha256
          (base32
            "1nbs8a98zqy49fqn7mqlzxbrj0b4lp9brp4b6r9d0vgicscf2cm0"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (inputs
      `(("node-vue-shared" ,node-vue-shared-3.0.11)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/reactivity#readme")
    (synopsis "@vue/reactivity")
    (description "@vue/reactivity")
    (license license:expat)))

(define-public node-vue-runtime-core-3.0.11
  (package
    (name "node-vue-runtime-core")
    (version "3.0.11")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/runtime-core/-/runtime-core-3.0.11.tgz")
        (sha256
          (base32
            "11d9aq3spvfal4iqc4jfp1f96v7113awlhlg78cq425qn4bsclml"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (inputs
      `(("node-vue-reactivity"
         ,node-vue-reactivity-3.0.11)
        ("node-vue-shared" ,node-vue-shared-3.0.11)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/runtime-core#readme")
    (synopsis "@vue/runtime-core")
    (description "@vue/runtime-core")
    (license license:expat)))

(define-public node-csstype-2.6.16
  (package
    (name "node-csstype")
    (version "2.6.16")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/csstype/-/csstype-2.6.16.tgz")
        (sha256
          (base32
            "0pfnh8dhx3bf32rhcmcnf7b1ixppskdyx93qir3khfn2m6zzij6a"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page
      "https://github.com/frenic/csstype#readme")
    (synopsis
      "Strict TypeScript and Flow types for style based on MDN data")
    (description
      "Strict TypeScript and Flow types for style based on MDN data")
    (license license:expat)))

(define-public node-vue-runtime-dom-3.0.11
  (package
    (name "node-vue-runtime-dom")
    (version "3.0.11")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/runtime-dom/-/runtime-dom-3.0.11.tgz")
        (sha256
          (base32
            "1b0vg1mfh8ann2if999qbmfzqq8w20sd0isrcalclvypcw25qgrx"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (inputs
      `(("node-csstype" ,node-csstype-2.6.16)
        ("node-vue-runtime-core"
         ,node-vue-runtime-core-3.0.11)
        ("node-vue-shared" ,node-vue-shared-3.0.11)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/runtime-dom#readme")
    (synopsis "@vue/runtime-dom")
    (description "@vue/runtime-dom")
    (license license:expat)))

(define-public node-vue-3.0.11
  (package
    (name "node-vue")
    (version "3.0.11")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/vue/-/vue-3.0.11.tgz")
        (sha256
          (base32
            "148mvi5xlflfsdar48frwq6qkihlhl19lynfqw5q1kyy86y6nnjv"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (inputs
      `(("node-vue-runtime-dom"
         ,node-vue-runtime-dom-3.0.11)
        ("node-vue-compiler-dom"
         ,node-vue-compiler-dom-3.0.11)
        ("node-vue-shared" ,node-vue-shared-3.0.11)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/vue#readme")
    (synopsis "vue")
    (description "vue")
    (license license:expat)))

(define-public node-vue-router-4.0.6
  (package
    (name "node-vue-router")
    (version "4.0.6")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/vue-router/-/vue-router-4.0.6.tgz")
        (sha256
          (base32
            "1k05rhv5j3yanq1xwv9vz2y4gh10dn7pzv7qlmqfp3cw10hzjb0w"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page
      "https://www.npmjs.com/package/node-vue-router")
    (synopsis
      "> This is the repository for Vue Router 4 (for Vue 3)")
    (description
      "> This is the repository for Vue Router 4 (for Vue 3)")
    (license license:expat)))

(define-public node-purecss-2.0.5
  (package
    (name "node-purecss")
    (version "2.0.5")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/purecss/-/purecss-2.0.5.tgz")
        (sha256
          (base32
            "0fbwj6biaghw7hb31i7c7ympxvv52plalh03qxx52j6xf8ypg9n3"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page "https://purecss.io")
    (synopsis
      "Pure is a ridiculously tiny CSS library you can use to start any web project.")
    (description
      "Pure is a ridiculously tiny CSS library you can use to start any web project.")
    (license license:bsd-3)))

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
  (inputs
    `(("node-vue" ,node-vue-3.0.11)
      ("node-vue-router" ,node-vue-router-4.0.6)
      ("node-purecss" ,node-purecss-2.0.5)))
  (native-inputs
   `(("esbuild" ,esbuild)
     ;; Propagate NODE_PATH to build environment, so esbuild can find external
     ;; modules.
     ("node" ,node)))
  (propagated-inputs
   `(("python-asyncssh" ,python-asyncssh)
     ("python-furl" ,python-furl)
     ("python-pyyaml" ,python-pyyaml)
     ("python-sanic" ,python-sanic)
     ("python-aiohttp" ,python-aiohttp)
     ("python-pytz" ,python-pytz)
     ("font-awesome" ,font-awesome)
     ("python-tortoise-orm" ,python-tortoise-orm)
     ("python-aiosqlite" ,python-aiosqlite)
     ("python-aiosmtplib" ,python-aiosmtplib)))
  (home-page #f)
  (synopsis #f)
  (description #f)
  (license #f))


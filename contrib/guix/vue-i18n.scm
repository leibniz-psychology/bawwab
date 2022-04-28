(define-module (vue-i18n)
  #:use-module ((guix licenses) #:prefix license:)
  #:use-module (guix packages)
  #:use-module (guix download)
  #:use-module (guix build-system node)
  #:use-module (vue))

(define-public node-intlify-devtools-if-9.1.9
  (package
    (name "node-intlify-devtools-if")
    (version "9.1.9")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@intlify/devtools-if/-/devtools-if-9.1.9.tgz")
        (sha256
          (base32
            "0ja5pa06hgaz2vq2xqmxg82r3bg8dxx8f398sqgwgvyp9p29a2c6"))))
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
      `(("node-intlify-shared"
         ,node-intlify-shared-9.1.9)))
    (home-page
      "https://github.com/intlify/vue-i18n-next/tree/master/packages/devtools-if#readme")
    (synopsis "intlify/devtools-if")
    (description "intlify/devtools-if")
    (license license:expat)))

(define-public node-intlify-core-base-9.1.9
  (package
    (name "node-intlify-core-base")
    (version "9.1.9")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@intlify/core-base/-/core-base-9.1.9.tgz")
        (sha256
          (base32
            "0y2mck7im9wx4nv6yc59g50csd3cjnn639kar5j4s0p7468bn23w"))))
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
      `(("node-intlify-vue-devtools"
         ,node-intlify-vue-devtools-9.1.9)
        ("node-intlify-shared"
         ,node-intlify-shared-9.1.9)
        ("node-intlify-runtime"
         ,node-intlify-runtime-9.1.9)
        ("node-intlify-message-resolver"
         ,node-intlify-message-resolver-9.1.9)
        ("node-intlify-message-compiler"
         ,node-intlify-message-compiler-9.1.9)
        ("node-intlify-devtools-if"
         ,node-intlify-devtools-if-9.1.9)))
    (home-page
      "https://github.com/intlify/vue-i18n-next/tree/master/packages/core-base#readme")
    (synopsis "intlify/core-base")
    (description "intlify/core-base")
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

(define-public node-intlify-message-compiler-9.1.9
  (package
    (name "node-intlify-message-compiler")
    (version "9.1.9")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@intlify/message-compiler/-/message-compiler-9.1.9.tgz")
        (sha256
          (base32
            "08dzbw95a7s6jhxk6kdfv8ap3r0db7wcbpx9qc3zwl0n7izga2jg"))))
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
        ("node-intlify-shared"
         ,node-intlify-shared-9.1.9)
        ("node-intlify-message-resolver"
         ,node-intlify-message-resolver-9.1.9)))
    (home-page
      "https://github.com/intlify/vue-i18n-next/tree/master/packages/message-compiler#readme")
    (synopsis "intlify/message-compiler")
    (description "intlify/message-compiler")
    (license license:expat)))

(define-public node-intlify-message-resolver-9.1.9
  (package
    (name "node-intlify-message-resolver")
    (version "9.1.9")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@intlify/message-resolver/-/message-resolver-9.1.9.tgz")
        (sha256
          (base32
            "0anx45gvpqhz37i6l16nck1k9nmp4gi9kqq42kw61qz683dfhn5s"))))
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
      "https://github.com/intlify/vue-i18n-next/tree/master/packages/message-resolver#readme")
    (synopsis "intlify/message-resolver")
    (description "intlify/message-resolver")
    (license license:expat)))

(define-public node-intlify-runtime-9.1.9
  (package
    (name "node-intlify-runtime")
    (version "9.1.9")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@intlify/runtime/-/runtime-9.1.9.tgz")
        (sha256
          (base32
            "00758sk26am617czx8vmrm5827q126imigixb0vchwg0blcb3lj3"))))
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
      `(("node-intlify-shared"
         ,node-intlify-shared-9.1.9)
        ("node-intlify-message-resolver"
         ,node-intlify-message-resolver-9.1.9)
        ("node-intlify-message-compiler"
         ,node-intlify-message-compiler-9.1.9)))
    (home-page
      "https://github.com/intlify/vue-i18n-next/tree/master/packages/runtime#readme")
    (synopsis "intlify/runtime")
    (description "intlify/runtime")
    (license license:expat)))

(define-public node-intlify-shared-9.1.9
  (package
    (name "node-intlify-shared")
    (version "9.1.9")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@intlify/shared/-/shared-9.1.9.tgz")
        (sha256
          (base32
            "0640ad3ig09dskwiwpkrxm4yzj0lxhxjq768880mzmy5q0z0qv49"))))
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
      "https://github.com/intlify/vue-i18n-next/tree/master/packages/shared#readme")
    (synopsis "intlify/shared")
    (description "intlify/shared")
    (license license:expat)))

(define-public node-intlify-vue-devtools-9.1.9
  (package
    (name "node-intlify-vue-devtools")
    (version "9.1.9")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@intlify/vue-devtools/-/vue-devtools-9.1.9.tgz")
        (sha256
          (base32
            "0y7y8hiinyrahkvmwlyx8z7hwzlhgakm9q399z9s4n4axm5s8sh7"))))
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
      `(("node-intlify-shared"
         ,node-intlify-shared-9.1.9)
        ("node-intlify-runtime"
         ,node-intlify-runtime-9.1.9)
        ("node-intlify-message-resolver"
         ,node-intlify-message-resolver-9.1.9)))
    (home-page
      "https://github.com/intlify/vue-i18n-next/tree/master/packages/vue-devtools#readme")
    (synopsis "intlify/vue-devtools")
    (description "intlify/vue-devtools")
    (license license:expat)))

(define-public node-vue-i18n-9.1.9
  (package
    (name "node-vue-i18n")
    (version "9.1.9")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/vue-i18n/-/vue-i18n-9.1.9.tgz")
        (sha256
          (base32
            "1cf5by57xp01hx6vzgq749i4dv82q2pbmp67xik9sv3vzgbk94h1"))))
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
      `(("node-vue-devtools-api"
         ,node-vue-devtools-api-6.0.0-beta.20.1)
        ("node-intlify-vue-devtools"
         ,node-intlify-vue-devtools-9.1.9)
        ("node-intlify-shared"
         ,node-intlify-shared-9.1.9)
        ("node-intlify-core-base"
         ,node-intlify-core-base-9.1.9)
        ("node-vue" ,node-vue-3.2.22)))
    (home-page
      "https://github.com/intlify/vue-i18n-next/tree/master/packages/vue-i18n#readme")
    (synopsis
      "Internationalization plugin for Vue.js")
    (description
      "Internationalization plugin for Vue.js")
    (license license:expat)))


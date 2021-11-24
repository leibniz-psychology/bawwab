(define-module (vue-router)
  #:use-module ((guix licenses) #:prefix license:)
  #:use-module (guix packages)
  #:use-module (guix download)
  #:use-module (guix build-system node)
  #:use-module (vue))

(define-public node-vue-router-4.0.12
  (package
    (name "node-vue-router")
    (version "4.0.12")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/vue-router/-/vue-router-4.0.12.tgz")
        (sha256
          (base32
            "07ng94yhbhakdn76pqvc7113iz8p3r9cv9b0ykq49qx1n3gykxds"))))
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
         ,node-vue-devtools-api-6.0.0-beta.20.1)))
    (home-page
      "https://www.npmjs.com/package/node-vue-router")
    (synopsis
      "> This is the repository for Vue Router 4 (for Vue 3)")
    (description
      "> This is the repository for Vue Router 4 (for Vue 3)")
    (license license:expat)))


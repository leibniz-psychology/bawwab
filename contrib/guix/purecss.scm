(define-module (purecss)
  #:use-module ((guix licenses) #:prefix license:)
  #:use-module (guix packages)
  #:use-module (guix download)
  #:use-module (guix build-system node))

(define-public node-purecss-2.0.6
  (package
    (name "node-purecss")
    (version "2.0.6")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/purecss/-/purecss-2.0.6.tgz")
        (sha256
          (base32
            "0r9ymp1y9arb26r98ik2n16d5z6zz2xiwk40f6bzcsj73q64ii9k"))))
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


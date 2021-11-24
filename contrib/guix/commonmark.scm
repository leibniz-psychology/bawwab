(define-module (commonmark)
  #:use-module ((guix licenses) #:prefix license:)
  #:use-module (guix packages)
  #:use-module (guix download)
  #:use-module (guix build-system node))

(define-public node-entities-2.0.3
  (package
    (name "node-entities")
    (version "2.0.3")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/entities/-/entities-2.0.3.tgz")
        (sha256
          (base32
            "09y7w1ydxif9rsmwj8a3m7cn09nin54l3gm93f4kkb4a6n1rjpsw"))))
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
      "https://github.com/fb55/entities#readme")
    (synopsis
      "Encode & decode XML and HTML entities with ease")
    (description
      "Encode & decode XML and HTML entities with ease")
    (license #f)))

(define-public node-mdurl-1.0.1
  (package
    (name "node-mdurl")
    (version "1.0.1")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/mdurl/-/mdurl-1.0.1.tgz")
        (sha256
          (base32
            "17hy8nfhys0rvxxdb68wi1n9my78a29walz1qnfwm5qghp7sn5n1"))))
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
      "https://github.com/markdown-it/mdurl#readme")
    (synopsis "URL utilities for markdown-it")
    (description "URL utilities for markdown-it")
    (license license:expat)))

(define-public node-minimist-1.2.5
  (package
    (name "node-minimist")
    (version "1.2.5")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/minimist/-/minimist-1.2.5.tgz")
        (sha256
          (base32
            "0l23rq2pam1khc06kd7fv0ys2cq0mlgs82dxjxjfjmlksgj0r051"))))
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
      "https://github.com/substack/minimist")
    (synopsis "parse argument options")
    (description "parse argument options")
    (license license:expat)))

(define-public node-string-prototype-repeat-0.2.0
  (package
    (name "node-string-prototype-repeat")
    (version "0.2.0")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/string.prototype.repeat/-/string.prototype.repeat-0.2.0.tgz")
        (sha256
          (base32
            "1h91lmzvriny714mal4lbsccqbn8wp20af92p5f20k5hqbisjmjr"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page "http://mths.be/repeat")
    (synopsis
      "A robust & optimized `String.prototype.repeat` polyfill, based on the ECMAScript 6 specification.")
    (description
      "A robust & optimized `String.prototype.repeat` polyfill, based on the ECMAScript 6 specification.")
    (license #f)))

(define-public node-commonmark-0.30.0
  (package
    (name "node-commonmark")
    (version "0.30.0")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/commonmark/-/commonmark-0.30.0.tgz")
        (sha256
          (base32
            "0xv7m8h6dqj82r7q4l4w3nqib0lzmvpiwan2c7zvk6zmrrf8gsib"))))
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
      `(("node-string-prototype-repeat"
         ,node-string-prototype-repeat-0.2.0)
        ("node-minimist" ,node-minimist-1.2.5)
        ("node-mdurl" ,node-mdurl-1.0.1)
        ("node-entities" ,node-entities-2.0.3)))
    (home-page "https://commonmark.org")
    (synopsis
      "a strongly specified, highly compatible variant of Markdown")
    (description
      "a strongly specified, highly compatible variant of Markdown")
    (license #f)))


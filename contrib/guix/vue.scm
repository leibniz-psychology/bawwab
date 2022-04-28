(define-module (vue)
  #:use-module ((guix licenses) #:prefix license:)
  #:use-module (guix packages)
  #:use-module (guix download)
  #:use-module (guix build-system node))

(define-public node-vue-reactivity-3.2.22
  (package
    (name "node-vue-reactivity")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/reactivity/-/reactivity-3.2.22.tgz")
        (sha256
          (base32
            "0gp4q7lg08m8pxgk414rbdpk28psnachwcbvlxz14lqpnwkgx7np"))))
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
      `(("node-vue-shared" ,node-vue-shared-3.2.22)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/reactivity#readme")
    (synopsis "vue/reactivity")
    (description "vue/reactivity")
    (license license:expat)))

(define-public node-vue-runtime-core-3.2.22
  (package
    (name "node-vue-runtime-core")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/runtime-core/-/runtime-core-3.2.22.tgz")
        (sha256
          (base32
            "1fjq97ff0ka1c8p9banz0ax6gfsz9x09lz3hr9bf1b6marapw9mh"))))
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
         ,node-vue-reactivity-3.2.22)
        ("node-vue-shared" ,node-vue-shared-3.2.22)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/runtime-core#readme")
    (synopsis "vue/runtime-core")
    (description "vue/runtime-core")
    (license license:expat)))

(define-public node-csstype-2.6.19
  (package
    (name "node-csstype")
    (version "2.6.19")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/csstype/-/csstype-2.6.19.tgz")
        (sha256
          (base32
            "126nc4xxqynxksbss4vryi5r6dr73q7x9nr05iiarsj2cmk6h65g"))))
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

(define-public node-vue-runtime-dom-3.2.22
  (package
    (name "node-vue-runtime-dom")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/runtime-dom/-/runtime-dom-3.2.22.tgz")
        (sha256
          (base32
            "0srnwzqydam91x3knwjbyr103hf1378b5nnd1p30m6s5f9866ajs"))))
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
      `(("node-csstype" ,node-csstype-2.6.19)
        ("node-vue-runtime-core"
         ,node-vue-runtime-core-3.2.22)
        ("node-vue-shared" ,node-vue-shared-3.2.22)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/runtime-dom#readme")
    (synopsis "vue/runtime-dom")
    (description "vue/runtime-dom")
    (license license:expat)))

(define-public node-vue-ref-transform-3.2.22
  (package
    (name "node-vue-ref-transform")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/ref-transform/-/ref-transform-3.2.22.tgz")
        (sha256
          (base32
            "118zxrc8xagd5a2wciz4bq2lix7zmbd43wb5crp4nqisf69da0my"))))
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
      `(("node-magic-string" ,node-magic-string-0.25.7)
        ("node-estree-walker" ,node-estree-walker-2.0.2)
        ("node-vue-shared" ,node-vue-shared-3.2.22)
        ("node-vue-compiler-core"
         ,node-vue-compiler-core-3.2.22)
        ("node-babel-parser" ,node-babel-parser-7.16.4)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/dev/packages/ref-transform#readme")
    (synopsis "vue/ref-transform")
    (description "vue/ref-transform")
    (license license:expat)))

(define-public node-sourcemap-codec-1.4.8
  (package
    (name "node-sourcemap-codec")
    (version "1.4.8")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/sourcemap-codec/-/sourcemap-codec-1.4.8.tgz")
        (sha256
          (base32
            "08b6ydyfckjgccn2g3sy028diin7wdzhdjmy7nlbsz0mqf9adxv0"))))
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
      "https://github.com/Rich-Harris/sourcemap-codec")
    (synopsis "Encode/decode sourcemap mappings")
    (description "Encode/decode sourcemap mappings")
    (license license:expat)))

(define-public node-magic-string-0.25.7
  (package
    (name "node-magic-string")
    (version "0.25.7")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/magic-string/-/magic-string-0.25.7.tgz")
        (sha256
          (base32
            "0ja79rknjcv5qrw6lna3rwmgxvdshqaa6gixnk6dqwzc23z6fcwj"))))
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
      `(("node-sourcemap-codec"
         ,node-sourcemap-codec-1.4.8)))
    (home-page
      "https://github.com/rich-harris/magic-string#readme")
    (synopsis "Modify strings, generate sourcemaps")
    (description
      "Modify strings, generate sourcemaps")
    (license license:expat)))

(define-public node-nanoid-3.1.30
  (package
    (name "node-nanoid")
    (version "3.1.30")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/nanoid/-/nanoid-3.1.30.tgz")
        (sha256
          (base32
            "10bk58fcrl1hyjzfgazg6w3mpb70fmwhyi73x857f4a7xijn7if2"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build))))
    (home-page "https://github.com/ai/nanoid#readme")
    (synopsis
      "A tiny (130 bytes), secure URL-friendly unique string ID generator")
    (description
      "A tiny (130 bytes), secure URL-friendly unique string ID generator")
    (license license:expat)))

(define-public node-picocolors-1.0.0
  (package
    (name "node-picocolors")
    (version "1.0.0")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/picocolors/-/picocolors-1.0.0.tgz")
        (sha256
          (base32
            "10zk2pciqiyxjapg6yp7n02nbvvyy00a6k8sz7jibsh6lhmyqqk0"))))
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
      "https://github.com/alexeyraspopov/picocolors#readme")
    (synopsis
      "The tiniest and the fastest library for terminal output formatting with ANSI colors")
    (description
      "The tiniest and the fastest library for terminal output formatting with ANSI colors")
    (license license:isc)))

(define-public node-source-map-js-0.6.2
  (package
    (name "node-source-map-js")
    (version "0.6.2")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/source-map-js/-/source-map-js-0.6.2.tgz")
        (sha256
          (base32
            "1892a6i1njikf9a4c4y77qpinbvrfikgzh1pxja7f28biz790v8s"))))
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
      "https://github.com/7rulnik/source-map")
    (synopsis "Generates and consumes source maps")
    (description
      "Generates and consumes source maps")
    (license license:bsd-3)))

(define-public node-postcss-8.3.11
  (package
    (name "node-postcss")
    (version "8.3.11")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/postcss/-/postcss-8.3.11.tgz")
        (sha256
          (base32
            "060sabpaiy5wqvfif6mnqw3crdfh0b3rhyj350d4p926l5wnsjim"))))
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
      `(("node-source-map-js" ,node-source-map-js-0.6.2)
        ("node-picocolors" ,node-picocolors-1.0.0)
        ("node-nanoid" ,node-nanoid-3.1.30)))
    (home-page "https://postcss.org/")
    (synopsis
      "Tool for transforming styles with JS plugins")
    (description
      "Tool for transforming styles with JS plugins")
    (license license:expat)))

(define-public node-vue-compiler-sfc-3.2.22
  (package
    (name "node-vue-compiler-sfc")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/compiler-sfc/-/compiler-sfc-3.2.22.tgz")
        (sha256
          (base32
            "1xy7sz5b5x9f7kj05nvihjhf01h253kg5hjniddndgs8krvybmza"))))
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
      `(("node-postcss" ,node-postcss-8.3.11)
        ("node-source-map" ,node-source-map-0.6.1)
        ("node-magic-string" ,node-magic-string-0.25.7)
        ("node-estree-walker" ,node-estree-walker-2.0.2)
        ("node-vue-shared" ,node-vue-shared-3.2.22)
        ("node-vue-ref-transform"
         ,node-vue-ref-transform-3.2.22)
        ("node-vue-compiler-ssr"
         ,node-vue-compiler-ssr-3.2.22)
        ("node-vue-compiler-dom"
         ,node-vue-compiler-dom-3.2.22)
        ("node-vue-compiler-core"
         ,node-vue-compiler-core-3.2.22)
        ("node-babel-parser" ,node-babel-parser-7.16.4)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/compiler-sfc#readme")
    (synopsis "vue/compiler-sfc")
    (description "vue/compiler-sfc")
    (license license:expat)))

(define-public node-vue-shared-3.2.22
  (package
    (name "node-vue-shared")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/shared/-/shared-3.2.22.tgz")
        (sha256
          (base32
            "0qgkw442ki6ih9r252ii22ax9x3zsy7m3qdifl8f8f9mx3a4iwh0"))))
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
      "internal utils shared across vue packages")
    (description
      "internal utils shared across vue packages")
    (license license:expat)))

(define-public node-babel-parser-7.16.4
  (package
    (name "node-babel-parser")
    (version "7.16.4")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@babel/parser/-/parser-7.16.4.tgz")
        (sha256
          (base32
            "1gvg2s58rqwy04qyijc8k7nnx3ifaa6jz2hg91zjrby64dyc6896"))))
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

(define-public node-vue-compiler-core-3.2.22
  (package
    (name "node-vue-compiler-core")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/compiler-core/-/compiler-core-3.2.22.tgz")
        (sha256
          (base32
            "0fgijz3b8si94byiwphxw2l40ya5dxf93ifkfh1r8bhknmnygc4d"))))
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
        ("node-babel-parser" ,node-babel-parser-7.16.4)
        ("node-vue-shared" ,node-vue-shared-3.2.22)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/compiler-core#readme")
    (synopsis "vue/compiler-core")
    (description "vue/compiler-core")
    (license license:expat)))

(define-public node-vue-compiler-dom-3.2.22
  (package
    (name "node-vue-compiler-dom")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/compiler-dom/-/compiler-dom-3.2.22.tgz")
        (sha256
          (base32
            "00brp7rsi1zs4wgzzq7y7f822q4f071vn0nz5ld1ajv3p0fb0zm1"))))
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
         ,node-vue-compiler-core-3.2.22)
        ("node-vue-shared" ,node-vue-shared-3.2.22)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/compiler-dom#readme")
    (synopsis "vue/compiler-dom")
    (description "vue/compiler-dom")
    (license license:expat)))

(define-public node-vue-compiler-ssr-3.2.22
  (package
    (name "node-vue-compiler-ssr")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/compiler-ssr/-/compiler-ssr-3.2.22.tgz")
        (sha256
          (base32
            "12w7gm5ssj9whkbksg0q36rkai4wji634zcq6svh9dw0hckw3bx5"))))
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
      `(("node-vue-compiler-dom"
         ,node-vue-compiler-dom-3.2.22)
        ("node-vue-shared" ,node-vue-shared-3.2.22)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/compiler-ssr#readme")
    (synopsis "vue/compiler-ssr")
    (description "vue/compiler-ssr")
    (license license:expat)))

(define-public node-vue-server-renderer-3.2.22
  (package
    (name "node-vue-server-renderer")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/server-renderer/-/server-renderer-3.2.22.tgz")
        (sha256
          (base32
            "0s39sihxnyasm90sqrxq2d4x9xwy4bqkqyh9q1vwfw3lyin1wv2i"))))
    (build-system node-build-system)
    (arguments
      `(#:tests?
        #f
        #:phases
        (modify-phases
          %standard-phases
          (delete 'configure)
          (delete 'build)
          (add-after 'unpack 'patch-for-newer-quickcheck
           (lambda _
             ;; Remove circular dependency on vue.
             (substitute* "package.json"
               (("\"vue\": \"3.2.22\"")
                "")))))))
    (inputs
      `(("node-vue-compiler-ssr"
         ,node-vue-compiler-ssr-3.2.22)
        ("node-vue-shared" ,node-vue-shared-3.2.22)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/server-renderer#readme")
    (synopsis "vue/server-renderer")
    (description "vue/server-renderer")
    (license license:expat)))

(define-public node-vue-3.2.22
  (package
    (name "node-vue")
    (version "3.2.22")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/vue/-/vue-3.2.22.tgz")
        (sha256
          (base32
            "0v4m4p0lj66l0madyj7ha96ssgsvn1vcvgl4y1vljigpa54gf3vp"))))
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
      `(("node-vue-server-renderer"
         ,node-vue-server-renderer-3.2.22)
        ("node-vue-compiler-sfc"
         ,node-vue-compiler-sfc-3.2.22)
        ("node-vue-runtime-dom"
         ,node-vue-runtime-dom-3.2.22)
        ("node-vue-compiler-dom"
         ,node-vue-compiler-dom-3.2.22)
        ("node-vue-shared" ,node-vue-shared-3.2.22)))
    (home-page
      "https://github.com/vuejs/vue-next/tree/master/packages/vue#readme")
    (synopsis
      "The progressive JavaScript framework for buiding modern web UI.")
    (description
      "The progressive JavaScript framework for buiding modern web UI.")
    (license license:expat)))

(define-public node-vue-devtools-api-6.0.0-beta.20.1
  (package
    (name "node-vue-devtools-api")
    (version "6.0.0-beta.20.1")
    (source
      (origin
        (method url-fetch)
        (uri "https://registry.npmjs.org/@vue/devtools-api/-/devtools-api-6.0.0-beta.20.1.tgz")
        (sha256
          (base32
            "0ns4g65q7a03gzw0rv0baswk7kc23jlkd1clyl3rnfysi6jzgjxi"))))
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
      "https://github.com/vuejs/vue-devtools#readme")
    (synopsis
      "Interact with the Vue devtools from the page")
    (description
      "Interact with the Vue devtools from the page")
    (license license:expat)))


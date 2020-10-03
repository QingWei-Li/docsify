const liveServer = require('live-server')
const isSSR = !!process.env.SSR
const middleware = []

if (isSSR) {
  const Renderer = require('./packages/docsify-server-renderer/build.js')
  const renderer = new Renderer({
    template: `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>docsify</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
    <link rel="stylesheet" href="/themes/vue.css" title="vue">
  </head>
  <body>
    <!--inject-app-->
    <!--inject-config-->
  <script src="/lib/docsify.js"></script>
  </body>
  </html>`,
    config: {
      name: 'docsify',
      repo: 'docsifyjs/docsify',
      basePath: 'docs/',
      baseUrl: '/',
      loadNavbar: true,
      loadSidebar: true,
      subMaxLevel: 3,
      auto2top: true,
      alias: {
        '.*?/awesome': 'https://raw.githubusercontent.com/docsifyjs/awesome-docsify/master/README.md',
        '.*?/changelog': 'https://raw.githubusercontent.com/docsifyjs/docsify/master/CHANGELOG.md',
        '/.*/_navbar.md': '/_navbar.md',
        '/zh-cn/(.*)': 'https://cdn.jsdelivr.net/gh/docsifyjs/docs-zh@master/$1',
        '/de-de/(.*)': 'https://raw.githubusercontent.com/docsifyjs/docs-de/master/$1',
        '/ru-ru/(.*)': 'https://raw.githubusercontent.com/docsifyjs/docs-ru/master/$1',
        '/es/(.*)': 'https://raw.githubusercontent.com/docsifyjs/docs-es/master/$1'
      },
    },
    path: './'
  })

  middleware.push(function(req, res, next) {
    if (/\.(css|js)$/.test(req.url)) {
      return next()
    }
    renderer.renderToString(req.url).then(html => res.end(html))
  })
}

const params = {
  port: 3000,
  watch: ['lib', 'docs', 'themes'],
  middleware
}

liveServer.start(params)

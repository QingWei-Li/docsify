const path = require('path')
const LiveServer = require('live-server')

const fixturePath = path.join(__dirname, './fixtures/docs')
const args = process.argv.slice(2)
console.log('[e2e tests] : args passed to live server', args)
const params = {
  port: args[0] || 3000,
  root: args[1] || fixturePath,
  open: false,
  middleware: [
    function(req, res, next) {
      if (req.url === '/_media/delayed.md') {
        setTimeout(next, 250);
      } else {
        next();
      }
    },
  ],
  // NoBrowser: true
};
LiveServer.start(params)
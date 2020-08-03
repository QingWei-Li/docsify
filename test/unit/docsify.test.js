/* global before after */
/* eslint-disable no-global-assign */
require = require('esm')(module /* , options */);

const http = require('http');
const handler = require('serve-handler');
const { expect } = require('chai');
const { initJSDOM } = require('../_helper');

const port = 9753;
const docsifySite = 'http://127.0.0.1:' + port;

const markup = /* html */ `<!DOCTYPE html>
  <html>
    <head></head>
    <body>
      <div id="app"></div>
      <script src="/lib/docsify.js"></script>
    </body>
  </html>
`;

/** @type {ReturnType<typeof http.createServer>} */
let server;

describe('Docsify public API', () => {
  before(async () => {
    server = http.createServer((request, response) => {
      // You pass two more arguments for config and middleware
      // More details here: https://github.com/zeit/serve-handler#options
      return handler(request, response);
    });

    await new Promise(r => server.listen(port, r));
  });

  after(async () => {
    server.close(err => {
      if (err) {
        console.error(err); // eslint-disable-line
        process.exit(1);
      }
      // eslint-disable-next-line
      console.log('Server closed.');
    });
  });

  it('global APIs are available', async () => {
    // const DOM = new (require('jsdom').JSDOM)(markup, {
    const DOM = initJSDOM(markup, {
      url: docsifySite,
      runScripts: 'dangerously',
      resources: 'usable',
    });

    const { documentReady } = require('../../src/core/util/dom');
    await new Promise(resolve => documentReady(resolve, DOM.window.document));

    // If the script was built successfully for production, then it should load
    // and the following APIs should be available:
    expect(typeof DOM.window.Docsify).to.equal('object');
    expect(typeof DOM.window.Docsify.util).to.equal('object');
    expect(typeof DOM.window.Docsify.dom).to.equal('object');
    expect(typeof DOM.window.Docsify.get).to.equal('function');
    expect(typeof DOM.window.Docsify.slugify).to.equal('function');
    expect(typeof DOM.window.Docsify.version).to.equal('string');
    expect(typeof DOM.window.DocsifyCompiler).to.equal('function');
    expect(typeof DOM.window.marked).to.equal('function');
    expect(typeof DOM.window.Prism).to.equal('object');
  });

  describe('Docsify config function', function() {
    it('allows $docsify to be a function', async function() {
      initJSDOM(markup, { url: docsifySite });

      window.configFunctionCalled = false;

      window.$docsify = function(vm) {
        // Check public API (that which is available at this point)
        expect(vm).to.be.an.instanceof(Object);
        expect(vm.constructor.name).to.equal('Docsify');
        expect(vm.$fetch).to.be.an.instanceof(Function);
        expect(vm.$resetEvents).to.be.an.instanceof(Function);

        window.configFunctionCalled = true;

        return {};
      };

      const { documentReady } = require('../../src/core/util/dom');
      const { Docsify } = require('../../src/core/Docsify');
      await new Promise(resolve => documentReady(resolve));

      new Docsify(); // eslint-disable-line

      expect(window.configFunctionCalled).to.equal(true);
    });

    it('provides the hooks and vm API to plugins', async function() {
      initJSDOM(markup, { url: docsifySite });

      window.pluginFunctionCalled = false;

      window.$docsify = function(vm) {
        const vm1 = vm;
        return {
          plugins: [
            function(hook, vm2) {
              expect(vm1).to.equal(vm2);

              expect(hook.init).to.be.an.instanceof(Function);
              expect(hook.beforeEach).to.be.an.instanceof(Function);
              expect(hook.afterEach).to.be.an.instanceof(Function);
              expect(hook.doneEach).to.be.an.instanceof(Function);
              expect(hook.mounted).to.be.an.instanceof(Function);
              expect(hook.ready).to.be.an.instanceof(Function);

              window.pluginFunctionCalled = true;
            },
          ],
        };
      };

      const { documentReady } = require('../../src/core/util/dom');
      const { Docsify } = require('../../src/core/Docsify');
      await new Promise(resolve => documentReady(resolve));

      new Docsify(); // eslint-disable-line

      expect(window.pluginFunctionCalled).to.equal(true);
    });
  });
});

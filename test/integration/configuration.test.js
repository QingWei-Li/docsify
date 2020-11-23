const docsifyInit = require('../helpers/docsify-init');

// Suite
// -----------------------------------------------------------------------------
describe('Configuration Tests', function() {
  // Tests
  // ---------------------------------------------------------------------------
  test('Configuration hideSidebar', async () => {
    // Init docsify basic fully site
    const docsifyInitConfig = {
      config: {
        name: 'Docsify Name',
        hideSidebar: true,
      },
      markdown: {
        coverpage: `
          # Docsify Test

          > Testing a magical documentation site generator

          [GitHub](https://github.com/docsifyjs/docsify/)
        `,
        homepage: `
          # Hello World

          This is the homepage.
        `,
        navbar: `
          - [docsify.js.org](https://docsify.js.org/#/)
        `,
        sidebar: `
          - [Test Page](test)
        `,
      },
      routes: {
        '/test.md': `
          # Test Page

          This is a custom route.
        `,
        '/data-test-scripturls.js': `
          document.body.setAttribute('data-test-scripturls', 'pass');
        `,
      },
      script: `
        document.body.setAttribute('data-test-script', 'pass');
      `,
      scriptURLs: ['/data-test-scripturls.js', '/lib/plugins/search.min.js'],
      style: `
        body {
          background: red !important;
        }
      `,
      styleURLs: ['/lib/themes/vue.css'],
    };

    await docsifyInit({
      ...docsifyInitConfig,
    });

    // Verify config options
    expect(typeof window.$docsify).toEqual('object');
    expect(window.$docsify).toHaveProperty('hideSidebar', true);

    // Verify sidebar not exist
    expect(document.querySelector('aside.sidebar')).toBeNull();
    expect(document.querySelector('button.sidebar-toggle')).toBeNull();
  });
});

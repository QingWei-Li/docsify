import initGlobalAPI from '../../src/core/global-api.js';

// Suite
// -----------------------------------------------------------------------------
describe('initGlobalAPI', function() {
  // Tests
  // ---------------------------------------------------------------------------
  test('it makes Docsify APIs available globally', () => {
    initGlobalAPI();

    expect(typeof window.Docsify).toEqual('object');
    expect(typeof window.Docsify.util).toEqual('object');
    expect(typeof window.Docsify.dom).toEqual('object');
    expect(typeof window.Docsify.get).toEqual('function');
    expect(typeof window.Docsify.slugify).toEqual('function');
    expect(typeof window.Docsify.version).toEqual('string');
    expect(typeof window.DocsifyCompiler).toEqual('function');
    expect(typeof window.marked).toEqual('function');
    expect(typeof window.Prism).toEqual('object');
  });
});

const docsifyInit = require('../helpers/docsify-init');

// Suite
// -----------------------------------------------------------------------------
describe('Docsify', function() {
  // Tests
  // ---------------------------------------------------------------------------
  test('allows $docsify configuration to be a function', async () => {
    const testConfig = jest.fn(vm => {
      expect(vm).toBeInstanceOf(Object);
      expect(vm.constructor.name).toEqual('Docsify');
      expect(vm.$fetch).toBeInstanceOf(Function);
      expect(vm.$resetEvents).toBeInstanceOf(Function);
      expect(vm.route).toBeInstanceOf(Object);
    });

    await docsifyInit({
      config: testConfig,
    });

    expect(typeof Docsify).toEqual('object');
    expect(testConfig).toHaveBeenCalled();
  });

  test('provides the hooks and vm API to plugins', async () => {
    const testConfig = jest.fn(vm => {
      const vm1 = vm;

      return {
        plugins: [
          function(hook, vm2) {
            expect(vm1).toEqual(vm2);

            expect(hook.init).toBeInstanceOf(Function);
            expect(hook.beforeEach).toBeInstanceOf(Function);
            expect(hook.beforeEmbed).toBeInstanceOf(Function);
            expect(hook.afterEmbed).toBeInstanceOf(Function);
            expect(hook.afterEach).toBeInstanceOf(Function);
            expect(hook.doneEach).toBeInstanceOf(Function);
            expect(hook.mounted).toBeInstanceOf(Function);
            expect(hook.ready).toBeInstanceOf(Function);
          },
        ],
      };
    });

    await docsifyInit({
      config: testConfig,
    });

    expect(typeof Docsify).toEqual('object');
    expect(testConfig).toHaveBeenCalled();
  });
});

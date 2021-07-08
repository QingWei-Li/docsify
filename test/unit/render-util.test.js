const {
  removeAtag,
  getAndRemoveConfig,
} = require('../../src/core/render/utils');

const { tree } = require(`../../src/core/render/tpl`);

const { slugify } = require(`../../src/core/render/slugify`);

// Suite
// -----------------------------------------------------------------------------
describe('core/render/utils', () => {
  // removeAtag()
  // ---------------------------------------------------------------------------
  describe('removeAtag()', () => {
    test('removeAtag from a link', () => {
      const result = removeAtag('<a href="www.example.com">content</a>');

      expect(result).toEqual('content');
    });
  });

  // getAndRemoveConfig()
  // ---------------------------------------------------------------------------
  describe('getAndRemoveConfig()', () => {
    test('parse simple config', () => {
      const result = getAndRemoveConfig(
        `[filename](_media/example.md ':include')`
      );

      expect(result).toMatchObject({
        config: {},
        str: `[filename](_media/example.md ':include')`,
      });
    });

    test('parse config with arguments', () => {
      const result = getAndRemoveConfig(
        `[filename](_media/example.md ':include :foo=bar :baz test')`
      );

      expect(result).toMatchObject({
        config: {
          foo: 'bar',
          baz: true,
        },
        str: `[filename](_media/example.md ':include test')`,
      });
    });

    test('parse config with double quotes', () => {
      const result = getAndRemoveConfig(
        `[filename](_media/example.md ":include")`
      );

      expect(result).toMatchObject({
        config: {},
        str: `[filename](_media/example.md ":include")`,
      });
    });

    test('parse quotes without first colon', () => {
      const result = getAndRemoveConfig(
        `[filename](_media/example.md 'include :foo=bar')`
      );

      expect(result).toMatchObject({
        config: { foo: 'bar' },
        str: `[filename](_media/example.md 'include')`,
      });
    });

    test('dont parse with different quotes', () => {
      const result = getAndRemoveConfig(
        `[filename](_media/example.md ":include')`
      );

      expect(result).toMatchObject({
        config: {},
        str: `[filename](_media/example.md ":include')`,
      });
    });

    test('parse headings without quotes', () => {
      const result = getAndRemoveConfig('### Hello, world! :id=hello-world');

      expect(result).toMatchObject({
        config: { id: 'hello-world' },
        str: '### Hello, world!',
      });
    });
  });
});

describe('core/render/tpl', () => {
  test('remove html tag in tree', () => {
    const result = tree([
      {
        level: 2,
        slug: '#/cover?id=basic-usage',
        title: '<span style="color:red">Basic usage</span>',
      },
      {
        level: 2,
        slug: '#/cover?id=custom-background',
        title: 'Custom background',
      },
      {
        level: 2,
        slug: '#/cover?id=test',
        title:
          '<img src="/docs/_media/favicon.ico" data-origin="/_media/favicon.ico" alt="ico">Test',
      },
    ]);

    expect(result).toEqual(
      `<ul class="app-sub-sidebar"><li><a class="section-link" href="#/cover?id=basic-usage" title="Basic usage"><span style="color:red">Basic usage</span></a></li><li><a class="section-link" href="#/cover?id=custom-background" title="Custom background">Custom background</a></li><li><a class="section-link" href="#/cover?id=test" title="Test"><img src="/docs/_media/favicon.ico" data-origin="/_media/favicon.ico" alt="ico">Test</a></li></ul>`
    );
  });
});

describe('core/render/slugify', () => {
  test('slugify()', () => {
    const result = slugify(
      `Bla bla bla <svg aria-label="broken" class="broken" viewPort="0 0 1 1"><circle cx="0.5" cy="0.5"/></svg>`
    );
    const result2 = slugify(
      `Another <span style="font-size: 1.2em" class="foo bar baz">broken <span class="aaa">example</span></span>`
    );
    expect(result).toEqual(`bla-bla-bla-`);
    expect(result2).toEqual(`another-broken-example`);
  });
});

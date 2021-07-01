# Doc helper

docsify extends Markdown syntax to make your documents more readable.

> Note: For the special code syntax cases, you'd better put them within a code backticks to avoid any conflicting from configurations or emojis.

## Important content

Important content like:

```markdown
!> **Time** is money, my friend!
```

is rendered as:

!> **Time** is money, my friend!

## General tips

General tips like:

```markdown
?> _TODO_ unit test
```

are rendered as:

?> _TODO_ unit test

## Ignore to compile link

Some time we will put some other relative path to the link, you have to need to tell docsify you don't need to compile this link. For example

```md
[link](/demo/)
```

It will be compiled to `<a href="/#/demo/">link</a>` and will be loaded `/demo/README.md`. Maybe you want to jump to `/demo/index.html`.

Now you can do that

```md
[link](/demo/ ':ignore')
```

You will get `<a href="/demo/">link</a>`html. Do not worry, you can still set title for link.

```md
[link](/demo/ ':ignore title')

<a href="/demo/" title="title">link</a>
```

## Set target attribute for link

```md
[link](/demo ':target=_blank')
[link](/demo2 ':target=_self')
```

## Disable link

```md
[link](/demo ':disabled')
```

## Cross-Origin link

Only when you both set the `routerMode: 'history'` and `externalLinkTarget: '_self'`, you need add this configuration for those Cross-Origin links.

```md
[example.com](https://example.com/ ':crossorgin')
```

## Github Task Lists

```md
- [ ] foo
- bar
- [x] baz
- [] bam <~ not working
  - [ ] bim
  - [ ] lim
```

- [ ] foo
- bar
- [x] baz
- [] bam <~ not working
  - [ ] bim
  - [ ] lim

## Image

### Resizing

```md
![logo](https://docsify.js.org/_media/icon.svg ':size=WIDTHxHEIGHT')
![logo](https://docsify.js.org/_media/icon.svg ':size=50x100')
![logo](https://docsify.js.org/_media/icon.svg ':size=100')

<!-- Support percentage -->

![logo](https://docsify.js.org/_media/icon.svg ':size=10%')
```

![logo](https://docsify.js.org/_media/icon.svg ':size=50x100')
![logo](https://docsify.js.org/_media/icon.svg ':size=100')
![logo](https://docsify.js.org/_media/icon.svg ':size=10%')

### Customise class

```md
![logo](https://docsify.js.org/_media/icon.svg ':class=someCssClass')
```

### Customise ID

```md
![logo](https://docsify.js.org/_media/icon.svg ':id=someCssId')
```

### Lazy Loading

See the `loading` field of MDN's [browser compatibility](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#Browser_compatibility) table for details of browser support. If the browser does not support lazy-loading then the attribute will be ignored and images will load immediately, as normal.

```md
![logo](https://docsify.js.org/_media/icon.svg ':loading=lazy')
```

## Customise ID for headings

```md
### Hello, world! :id=hello-world
```

## Markdown in html tag

You need to insert a space between the html and markdown content.
This is useful for rendering markdown content in the details element.

```markdown
<details>
<summary>Self-assessment (Click to expand)</summary>

- Abc
- Abc

</details>
```

<details>
<summary>Self-assessment (Click to expand)</summary>

- Abc
- Abc

</details>

Or markdown content can be wrapped in html tag.

```markdown
<div style='color: red'>

- listitem
- listitem
- listitem

</div>
```

<div style='color: red'>

- Abc
- Abc

</div>

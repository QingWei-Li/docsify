# Doc helper

docsify extends Markdown syntax to make your documents more readable.

## important content

Important content like:

```markdown
> [!] **Time** is money, my friend!
```

is rendered as:

> [!] **Time** is money, my friend!

## General tips

General tips like:

```markdown
> [?] _TODO_ unit test
```

are rendered as:

> [?] _TODO_ unit test

## More tips

```markdown
> [x] bad

> [v] good
```

> [x] bad

> [v] good

## Details

````markdown
> [details] Sample code
>
> js code
>
> ```javascript
> console.log("foo");
> ```

> [details:open] Sample code open
>
> js code
>
> ```javascript
> console.log("foo");
> ```
````

> [details] Sample code
>
> js code
>
> ```javascript
> console.log("foo");
> ```

> [details:open] Sample code open
>
> js code
>
> ```javascript
> console.log("foo");
> ```

## Ignore to compile link

Some time we will put some other relative path to the link, you have to need to tell docsify you don't need to compile this link. For example

```md
[link](/demo/)
```

It will be compiled to `<a href="/#/demo/">link</a>` and will be loaded `/demo/README.md`. Maybe you want to jump to `/demo/index.html`.

Now you can do that

```md
[link](/demo/ ":ignore")
```

You will get `<a href="/demo/">link</a>`html. Do not worry, you can still set title for link.

```md
[link](/demo/ ":ignore title")

<a href="/demo/" title="title">link</a>
```

## Set target attribute for link

```md
[link](/demo ":target=_blank")
[link](/demo2 ":target=_self")
```

## Disable link

```md
[link](/demo ":disabled")
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

## Image resizing

```md
![logo](https://docsify.js.org/_media/icon.svg ":size=50x100")
![logo](https://docsify.js.org/_media/icon.svg ":size=100")

<!-- Support percentage -->

![logo](https://docsify.js.org/_media/icon.svg ":size=10%")
```

![logo](https://docsify.js.org/_media/icon.svg ":size=50x100")
![logo](https://docsify.js.org/_media/icon.svg ":size=100")
![logo](https://docsify.js.org/_media/icon.svg ":size=10%")

## Customise ID for headings

```md
### 你好，世界！ :id=hello-world
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

# Generate static html

> _Experimental feature_

Generating static html files is good for SEO and speeds up the first rendering.

But this is not an advantage of docsify. If you only need powerful static documentation, choose another documentation tool like Gitbook or Vuepress.

## Configuration

You can configure it in a special config file.

_config.js_

```js
module.exports = {
  template: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Doc</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
  <meta name="viewport" content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
  <link rel="stylesheet" href="//unpkg.com/docsify/lib/themes/vue.css" title="vue">
</head>
<body>
  <!--inject-app-->
  <!--inject-config-->
<script src="//unpkg.com/docsify/lib/docsify.min.js"></script>
</body>
</html>`, // or html file path

  config: {
    // docsify config
    coverpage: true
  }
};
```

## Generate

Please use docsify-cli 5.0+ and run this command.

```sh
docsify static docs -c config.js
```

## Simple Demo

This is an example showing the docsify official documentation generating static files. [docsify-static-demo](https://github.com/docsifyjs/docsify-static-demo)

const copyDir = require('copy-dir')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const setup = async () => {
  const PORT = process.env.PORT || 3000
  global.__LIVESERVER__ = null
  global.PORT = PORT

  /**
   * IN this test suite, we are going to test our docs site with all the css,js linked to our local build packages
   *
   *  1.1 Copy ../docs --> ./fixtures/docs
   *  1.2 copy lib,themes --> ./fixtures/
   *  2. change the content of fixtures/docs/index.html to use all the links from our local build
   *  3. now jest runner will run to test all the *.spec.js files
   *
   */

  const shippedDirs = ['lib', 'themes']

  // 1
  const docsPath = path.join(process.cwd(), './docs')
  const fixtureDocsPath = path.join(__dirname, './fixtures/docs')
  const embeddedFiles = [
    {
      tag: '## Tag attribute',
      srcFile: 'embed-order.md',
      dstFile: 'embed-files.md',
    },
  ];

  // 1.1
  console.log('[cypress test docs] Copying the docs --> cypress/fixtures/docs')
  copyDir.sync(docsPath, fixtureDocsPath)

  // 1.2
  shippedDirs.forEach(dir => {
    const fromPath = path.join(process.cwd(), dir)
    const toPath = path.join(__dirname, `./fixtures/docs/${dir}`)
    console.log(
      `[cypress test docs] Copying  ${dir} --> cypress/fixtures/docs/${dir}`
    )
    copyDir.sync(fromPath, toPath)
  })

  // 1.3
  embeddedFiles.forEach(({ tag, srcFile, dstFile }) => {
    const content = fs.readFileSync(`${__dirname}/inline/${srcFile}`).toString();
    const originalFile = `${fixtureDocsPath}/${dstFile}`;

    let originalContent = fs
      .readFileSync(originalFile)
      .toString()
      .split('\n');
    const tagLine = originalContent.findIndex(l => l.indexOf(tag) >= 0);
    originalContent.splice(tagLine, 0, content);

    fs.writeFileSync(originalFile, originalContent.join('\n'));
  });

  // 2
  console.log(
    '[cypress test docs] Replacing content the tpl/index.html --> cypress/fixtures/docs/index.html'
  )
  const indexHTMLtplPath = path.join(
    __dirname,
    './fixtures/tpl/docs.index.html'
  )
  const fixtureIndexPath = path.join(__dirname, './fixtures/docs/index.html')
  const data = fs.readFileSync(indexHTMLtplPath, 'utf8')

  // 3
  const fixturePath = path.join(__dirname, './fixtures/docs')

  fs.writeFileSync(fixtureIndexPath, data, 'utf8')
  const child = spawn('node', [
    path.join(__dirname, './live.server.js'),
    PORT,
    fixturePath
  ])
  child.on('exit', code => {
    console.log(`Child process exited with code ${code}`)
  })
  child.stdout.on('data', data => {
    console.log(`stdout: ${data}`)
  })
  child.stderr.on('data', data => {
    console.log(`stderr: ${data}`)
  })

  // LiveServer.start(params)
  global.__LIVESERVER__ = child
}

setup()

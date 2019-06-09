'use strict';

const fs = require('fs');
const path = require('path');
const process = require('process');
const { spawn } = require('child_process');

const util = require('./util');
const paths = require('./paths');

const EXAMPLES = ['Counter', 'Timer', 'Todo', 'Chat'];

const exampleListItems = EXAMPLES.map(
  e => `<li><a href="./${e.toLowerCase()}.html">${e} Example</a></li>`
).join('\n      ');

const indexHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Chat Example</title>
  </head>

  <body>
    <h1>React Model Store Examples</h1>
    <ul>
      ${exampleListItems}
    </ul>
  </body>
</html>
`;

clean();
build(Promise.resolve())
  .then(() => mkIndexHtml())
  .catch(err =>
    setTimeout(() => {
      console.error(err);
      process.exit(1);
    })
  );

function clean() {
  if (fs.existsSync(paths.publicExampleDir)) {
    const stat = fs.statSync(paths.publicExampleDir);
    if (stat.isDirectory) {
      fs.readdirSync(paths.publicExampleDir)
        .filter(f => !f.startsWith('.'))
        .forEach(f => util.rmall(path.resolve(paths.publicExampleDir, f)));
    } else {
      fs.unlinkSync(paths.publicExampleDir);
      fs.mkdirSync(paths.publicExampleDir);
    }
  } else {
    fs.mkdirSync(paths.publicExampleDir, { recursive: true });
  }
}

function mkIndexHtml() {
  fs.writeFileSync(paths.publicExampleIndexFile, indexHtml);
}

function build(promise) {
  EXAMPLES.forEach(e => {
    const args = [
      paths.parcelFile,
      'build',
      path.resolve(paths.exampleDir, `${e.toLocaleLowerCase()}.html`),
      '--out-dir',
      paths.publicExampleDir,
      '--public-url',
      '.',
    ];
    promise = promise.then(
      () =>
        new Promise((resolve, reject) => {
          console.log(`Build ${e} Example`);
          spawn('node', args, { stdio: 'inherit' }).on('exit', code => {
            if (code) {
              reject(new Error('failed to execute parcel'));
            } else {
              resolve();
            }
          });
        })
    );
  });
  return promise;
}

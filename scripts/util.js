const fs = require('fs');
const path = require('path');
const readline = require('readline');

const { YEAR } = require('./constants');
const paths = require('./paths');

const RE_START = /^\s*\/{2,3}\s*START\s*DEVELOPMENT\s*BLOCK\s*$/;
const RE_END = /^\s*\/{2,3}\s*END\s*DEVELOPMENT\s*BLOCK\s*$/;
const RE_WHITESPACE = /^\s*$/;

const rmall = (exports.rmall = function(path_) {
  'use strict';
  if (fs.existsSync(path_)) {
    if (fs.statSync(path_).isDirectory()) {
      fs.readdirSync(path_).forEach(p => rmall(path.resolve(path_, p)));
      fs.rmdirSync(path_);
    } else {
      fs.unlinkSync(path_);
    }
  }
});

function readPackage() {
  'use strict';

  const data = fs.readFileSync(paths.packageFile, { encoding: 'utf8' });
  return JSON.parse(data);
}

function createSrcHeader(pkg) {
  const author = pkg.author || '';
  const license = pkg.license || '';
  let year = new Date().getUTCFullYear();
  year = year > YEAR ? `${YEAR}-${year}` : `${year}`;
  let description = '';
  if (pkg.amdName) {
    description += pkg.amdName;
  }
  if (pkg.version) {
    description += ` v${pkg.version}`;
  }
  return `/**
 * @license ${description}
 * (c) ${year} ${author}
 * License: ${license}
 */

`;
}

exports.generateSrcFile = function() {
  'use strict';

  let pkg;
  let writeStream;
  try {
    pkg = readPackage();
    if (fs.existsSync(paths.releaseSrcFile)) {
      rmall(paths.releaseSrcFile);
    }
    writeStream = fs.createWriteStream(paths.releaseSrcFile);
  } catch (err) {
    return Promise.reject(err);
  }

  return new Promise(resolve => {
    let promise = Promise.resolve();

    function write(buf_) {
      promise = promise.then(
        () =>
          new Promise((resolve, reject) =>
            writeStream.write(buf_, err => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            })
          )
      );
    }

    const header = createSrcHeader(pkg);
    write(header);

    const readStream = fs.createReadStream(paths.developmentSrcFile, {
      encoding: 'utf8',
    });
    const reader = readline.createInterface(readStream);

    let ignore = false;
    let buf = null;

    reader.on('line', line => {
      if (ignore) {
        if (RE_END.test(line)) {
          ignore = false;
        }
      } else {
        if (RE_START.test(line)) {
          if (buf !== null && !RE_WHITESPACE.test(buf)) {
            write(buf);
          }
          ignore = true;
          buf = null;
        } else {
          if (buf !== null) {
            write(buf);
          }
          buf = line + '\n';
        }
      }
    });

    reader.on('close', () => {
      try {
        if (buf !== null) {
          write(buf);
        }
      } finally {
        readStream.close();
      }
      promise.then(() => resolve());
    });
  }).finally(() => {
    writeStream.close();
  });
};

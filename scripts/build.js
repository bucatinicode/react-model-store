'use strict';

const fs = require('fs');
const readline = require('readline');
const process = require('process');
const { spawn } = require('child_process');

const util = require('./util');
const paths = require('./paths');

const RE_START = /^\s*\/{2,3}\s*START\s*DEVELOPMENT\s*BLOCK\s*$/;
const RE_END = /^\s*\/{2,3}\s*END\s*DEVELOPMENT\s*BLOCK\s*$/;
const RE_WHITESPACE = /^\s*$/;

const tsconfig = {
  include: ['build/src'],
  exclude: ['node_modules', 'example', 'src', 'tests', 'scripts'],
  compilerOptions: {
    target: 'ES5',
    module: 'es2015',
    jsx: 'react',
    declaration: true,
    declarationMap: true,
    sourceMap: true,
    strict: true,
    noImplicitAny: true,
    strictNullChecks: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    noImplicitReturns: true,
    noFallthroughCasesInSwitch: true,
    esModuleInterop: true,
  },
};

prepare()
  .then(omitDevBlock)
  .then(build)
  .then(fixEOL)
  .finally(dispose)
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });

function prepare() {
  return Promise.resolve().then(() => {
    util.rmall(paths.buildSrcDir);
    util.rmall(paths.libraryDir);

    fs.mkdirSync(paths.buildSrcDir, { recursive: true });

    fs.writeFileSync(paths.tsconfigFile, JSON.stringify(tsconfig));
  });
}

function omitDevBlock() {
  const writeStream = fs.createWriteStream(paths.buildSrcFile);
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

    const readStream = fs.createReadStream(paths.srcFile, { encoding: 'utf8' });
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
}

function build() {
  const args = [
    paths.microbundleFile,
    'build',
    '--external',
    'react',
    '--globals',
    'react=React',
    '--strict',
    '--no-compress',
  ];
  return new Promise((resolve, reject) => {
    spawn('node', args, { stdio: 'inherit' }).on('exit', code => {
      if (code) {
        reject(new Error('failed to execute microbundle'));
      } else {
        resolve();
      }
    });
  });
}

function fixEOL() {
  const files = fs.readdirSync(paths.libraryDir);
  files.forEach(name => {
    if (name.endsWith('.d.ts')) {
      const file = paths.libraryFile(name);
      const data = fs.readFileSync(file, { encoding: 'utf8' });
      fs.writeFileSync(file, data.split('\r\n').join('\n'));
    }
  });
}

function dispose() {
  delete tsconfig['include'];
  delete tsconfig['exclude'];
  fs.writeFileSync(
    paths.tsconfigFile,
    JSON.stringify(tsconfig, undefined, 2) + '\n'
  );
}

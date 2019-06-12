'use strict';

const fs = require('fs');
const process = require('process');
const { spawn } = require('child_process');

const { DEVELOPMENT_SOURCE_FILENAME } = require('./constants');
const util = require('./util');
const paths = require('./paths');

const RE_LIBRARY = /\.(m?js|ts)$/;

const tsconfig = {
  include: ['src'],
  exclude: [
    'node_modules',
    'example',
    'tests',
    'scripts',
    `src/${DEVELOPMENT_SOURCE_FILENAME}`,
  ],
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
  .then(util.generateSrcFile)
  .then(build)
  .then(fixEOL)
  .finally(dispose)
  .catch(err => {
    console.error(err.message);
    process.exit(1);
  });

function prepare() {
  return Promise.resolve().then(() => {
    util.rmall(paths.libraryDir);
    fs.writeFileSync(paths.tsconfigFile, JSON.stringify(tsconfig));
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
    if (RE_LIBRARY.test(name)) {
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

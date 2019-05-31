const path = require('path');
const fs = require('fs');
const readline = require('readline');
const process = require('process');
const { spawn } = require('child_process');

const RE_START = /^\s*\/{2,3}\s*START\s*DEVELOPMENT\s*BLOCK\s*$/;
const RE_END = /^\s*\/{2,3}\s*END\s*DEVELOPMENT\s*BLOCK\s*$/;
const RE_WHITESPACE = /^\s*$/;

const PACKAGE_NAME = 'react-model-store';
const SOURCE_FILENAME = `${PACKAGE_NAME}.ts`;

const tsconfig = {
  include: ['build/src'],
  exclude: ['node_modules', 'example', 'src', 'tests', 'scripts'],
  extends: './config/tsconfig',
  compilerOptions: {
    target: 'ES5',
    module: 'es2015',
    jsx: 'react',
  },
};

const rootDir = path.dirname(__dirname);
const buildDir = path.resolve(rootDir, 'build');
const libraryDir = path.resolve(rootDir, 'lib');
const tsconfigFile = path.resolve(rootDir, 'tsconfig.json');
const microbuldleFile = path.resolve(
  rootDir,
  'node_modules/microbundle/dist/cli.js'
);
const sourceDir = path.resolve(rootDir, 'src');
const sourceFile = path.resolve(sourceDir, SOURCE_FILENAME);
const destDir = path.resolve(buildDir, 'src');
const destFile = path.resolve(destDir, SOURCE_FILENAME);

rmall(destDir);
rmall(libraryDir);

fs.mkdirSync(destDir, { recursive: true });

fs.writeFileSync(tsconfigFile, JSON.stringify(tsconfig, undefined, 2));

let promise = Promise.resolve();

promise = promise.then(() => {
  const writeStream = fs.createWriteStream(destFile, 'utf-8');
  const readStream = fs.createReadStream(sourceFile, 'utf-8');
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
          write(writeStream, buf);
        }
        ignore = true;
        buf = null;
      } else {
        if (buf !== null) {
          write(writeStream, buf);
        }
        buf = line + '\n';
      }
    }
  });

  reader.on('close', () => {
    try {
      if (buf !== null) {
        write(writeStream, buf);
      }
    } finally {
      readStream.close();
    }
    promise = promise
      .finally(() => writeStream.close())
      .then(build)
      .finally(dispose)
      .catch(err => {
        console.error(err.message);
        process.exit(1);
      });
  });
});

function build() {
  const args = [
    microbuldleFile,
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

function dispose() {
  delete tsconfig['include'];
  delete tsconfig['exclude'];
  fs.writeFileSync(tsconfigFile, JSON.stringify(tsconfig, undefined, 2));
}

function write(stream, buf_) {
  promise = promise.then(
    () =>
      new Promise((resolve, reject) =>
        stream.write(buf_, err => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        })
      )
  );
}

function rmall(path_) {
  if (fs.existsSync(path_)) {
    if (fs.statSync(path_).isDirectory()) {
      fs.readdirSync(path_).forEach(p => rmall(path.resolve(path_, p)));
      fs.rmdirSync(path_);
    } else {
      fs.unlinkSync(path_);
    }
  }
}

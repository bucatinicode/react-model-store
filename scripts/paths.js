const path = require('path');

const {
  DEVELOPMENT_SOURCE_FILENAME,
  RELEASE_SOURCE_FILENAME,
} = require('./constants');

const rootDir = (exports.rootDir = path.dirname(__dirname));
const buildDir = (exports.buildDir = path.resolve(rootDir, 'build'));
const srcDir = (exports.srcDir = path.resolve(rootDir, 'src'));

const libraryDir = (exports.libraryDir = path.resolve(rootDir, 'lib'));
exports.exampleDir = path.resolve(rootDir, 'example');
const publicDir = (exports.publicDir = path.resolve(buildDir, 'gh-pages'));
const publicExampleDir = (exports.publicExampleDir = path.resolve(
  publicDir,
  'example'
));

exports.tsconfigFile = path.resolve(rootDir, 'tsconfig.json');
exports.microbundleFile = path.resolve(
  rootDir,
  'node_modules/microbundle/dist/cli.js'
);
exports.parcelFile = path.resolve(rootDir, 'node_modules/parcel/bin/cli.js');
exports.developmentSrcFile = path.resolve(srcDir, DEVELOPMENT_SOURCE_FILENAME);
exports.releaseSrcFile = path.resolve(srcDir, RELEASE_SOURCE_FILENAME);

exports.publicExampleIndexFile = path.resolve(publicExampleDir, 'index.html');

exports.libraryFile = function(name) {
  return path.resolve(libraryDir, name);
};

const path = require('path');

const { SOURCE_FILENAME } = require('./util');

const rootDir = (exports.rootDir = path.dirname(__dirname));
const buildDir = (exports.buildDir = path.resolve(rootDir, 'build'));
const srcDir = (exports.srcDir = path.resolve(rootDir, 'src'));
const buildSrcDir = (exports.buildSrcDir = path.resolve(buildDir, 'src'));

exports.libraryDir = path.resolve(rootDir, 'lib');
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
exports.srcFile = path.resolve(srcDir, SOURCE_FILENAME);
exports.buildSrcFile = path.resolve(buildSrcDir, SOURCE_FILENAME);

exports.publicExampleIndexFile = path.resolve(publicExampleDir, 'index.html');

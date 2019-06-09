const fs = require('fs');
const path = require('path');

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

const PACKAGE_NAME = (exports.PACKAGE_NAME = 'react-model-store');
exports.SOURCE_FILENAME = `${PACKAGE_NAME}.ts`;

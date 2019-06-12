'use strict';

const process = require('process');

const util = require('./util');

util.generateSrcFile().catch(err => {
  console.error(err.message);
  process.exit(1);
});

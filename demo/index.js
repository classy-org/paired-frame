'use strict';

const express = require('express');
const parentView = require('./src/parent.view');
const childView = require('./src/child.view');

const app = express();

app.use('/static', express.static('lib'));

app.use('/static', express.static('demo/public'));

app.use((req, res, next) => {
  const { hostname } = req;
  if (hostname === 'parent.loc') {
    parentView(req, res, next);
  }
  else if (hostname === 'child.loc') {
    childView(req, res, next);
  }
});

app.listen(3000);

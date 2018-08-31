'use strict';

module.exports = (req, res, next) => {
  res.send(`
<!doctype html>
<html ng-app="pfp">

<head>
  <link rel="stylesheet" href="/static/style.css">
</head>

<body style="overflow:hidden;">
  <ui-view></ui-view>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/angular.js/1.7.2/angular.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/1.0.20/angular-ui-router.min.js"></script>
  <script src="/static/PairedFrame.min.js"></script>
  <script src="/static/child.js"></script>
</body>

</html>
`);
};

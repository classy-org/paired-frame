'use strict';

module.exports = (req, res, next) => {
  res.send(`
<!doctype html>
<html>

<head>
  <link rel="stylesheet" href="/static/style.css">
</head>

<div id="root"></div>

<body>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react/16.4.2/umd/react.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.4.2/umd/react-dom.production.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-router/4.3.1/react-router.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/react-router-dom/4.3.1/react-router-dom.min.js"></script>
  <script src="/static/PairedFrame.min.js"></script>
  <script src="/static/parent.js"></script>
</body>

</html>
`);
};

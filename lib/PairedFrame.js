'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var PairedFrame =
/*#__PURE__*/
function () {
  function PairedFrame(_ref) {
    var _this = this;

    var _ref$autoNavigate = _ref.autoNavigate,
        autoNavigate = _ref$autoNavigate === void 0 ? false : _ref$autoNavigate,
        _ref$autoResize = _ref.autoResize,
        autoResize = _ref$autoResize === void 0 ? false : _ref$autoResize,
        _ref$debug = _ref.debug,
        debug = _ref$debug === void 0 ? false : _ref$debug,
        _ref$mapPath = _ref.mapPath,
        mapPath = _ref$mapPath === void 0 ? null : _ref$mapPath,
        _ref$resizeElement = _ref.resizeElement,
        resizeElement = _ref$resizeElement === void 0 ? null : _ref$resizeElement,
        _ref$sendHeight = _ref.sendHeight,
        sendHeight = _ref$sendHeight === void 0 ? false : _ref$sendHeight,
        _ref$sendHistory = _ref.sendHistory,
        sendHistory = _ref$sendHistory === void 0 ? false : _ref$sendHistory,
        _ref$targetIframe = _ref.targetIframe,
        targetIframe = _ref$targetIframe === void 0 ? null : _ref$targetIframe,
        _ref$targetOrigin = _ref.targetOrigin,
        targetOrigin = _ref$targetOrigin === void 0 ? null : _ref$targetOrigin,
        _ref$targetWindow = _ref.targetWindow,
        targetWindow = _ref$targetWindow === void 0 ? null : _ref$targetWindow;

    _classCallCheck(this, PairedFrame);

    if (!targetOrigin || !targetWindow) {
      throw new Error('Failed to instantiate PairedFrame: config must include a ' + 'targetOrigin and targetWindow.');
    }

    if (autoResize && !resizeElement) {
      throw new Error('Failed to instantiate PairedFrame: config must include a ' + 'resizeElement when autoResize is true.');
    }

    this.config = Object.freeze({
      // Boolean; if true, will match counterpart's pathname
      autoNavigate: autoNavigate,
      // Boolean; if true, will match counterpart's scrollHeight
      autoResize: autoResize,
      // Boolean; if true, events will be logged to console
      debug: debug,
      // Function; converts counterpart pathname to local pathname
      mapPath: mapPath,
      // HTMLElement; reference to wrapper element around counterpart iframe
      resizeElement: resizeElement,
      // Boolean; if true, scrollHeight will be broadcast to counterpart
      sendHeight: sendHeight,
      // Boolean; if true, pathname will be broadcast to counterpart
      sendHistory: sendHistory,
      // HTMLIframeElement; reference to the iframe that loads the counterpart
      targetIframe: targetIframe,
      // String; counterpart origin
      targetOrigin: targetOrigin,
      // Window; reference to counterpart contentWindow
      targetWindow: targetWindow
    }); // Registry of wrapped event callbacks

    this.registry = {}; // Registry of raw event callbacks

    this.callbacks = new WeakMap(); // Boolean; if true, frame will adjust height in upcoming animation frame

    this.hasPendingHeightUpdate = false; // Pathname of this frame

    this.localPath = null; // ScrollHeight of this frame

    this.localHeight = 0; // Pathname of counterpart

    this.remotePath = null; // ScrollHeight of counterpart

    this.remoteHeight = 0;
    addEventListener('message', function (e) {
      return _this.receive(e);
    });
    this.onReady(function () {
      _this.once('ping', _this.init);

      _this.send('ping');
    });
  }
  /* ------------------------------------------------------------------------ *
   * EventEmitter
   * ------------------------------------------------------------------------ */


  _createClass(PairedFrame, [{
    key: "listeners",
    value: function listeners(eventName) {
      var _this2 = this;

      return (this.registry[eventName] || []).map(function (cb) {
        return _this2.callbacks.get(cb);
      });
    }
  }, {
    key: "listenerCount",
    value: function listenerCount(eventName) {
      return (this.registry[eventName] || []).length;
    }
  }, {
    key: "eventNames",
    value: function eventNames() {
      return Object.keys(this.registry);
    }
  }, {
    key: "on",
    value: function on(eventName, cb) {
      var listeners = this.registry[eventName] || [];
      listeners.push(cb);
      this.registry[eventName] = listeners;
      this.callbacks.set(cb, cb);
      return this;
    }
  }, {
    key: "once",
    value: function once(eventName, cb) {
      var _this3 = this;

      var wrapped = function wrapped() {
        _this3.off(eventName, wrapped);

        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }

        cb.call.apply(cb, [_this3].concat(args));
      };

      this.callbacks.set(wrapped, cb);
      return this.on(eventName, wrapped);
    }
  }, {
    key: "off",
    value: function off(eventName, cb) {
      if (!this.registry[eventName]) return this;
      var idx = this.registry[eventName].findIndex(function (el) {
        return el === cb;
      });
      if (idx === -1) return this;
      this.registry[eventName].splice(idx, 1);
      return this;
    }
  }, {
    key: "emit",
    value: function emit(eventName, data) {
      var _this4 = this;

      // Grab count first in case callbacks register more listeners
      var count = this.listenerCount(eventName);
      (this.registry[eventName] || []).forEach(function (cb) {
        return cb.call(_this4, data);
      });
      return Boolean(count);
    }
    /* ------------------------------------------------------------------------ *
     * PostMessages
     * ------------------------------------------------------------------------ */

  }, {
    key: "send",
    value: function send(eventName, data) {
      var _this$config = this.config,
          debug = _this$config.debug,
          targetOrigin = _this$config.targetOrigin,
          targetWindow = _this$config.targetWindow;
      targetWindow.postMessage({
        name: eventName,
        data: data
      }, targetOrigin);
      this.debug('postmessage_sent', eventName, data);
      return true;
    }
  }, {
    key: "receive",
    value: function receive(_ref2) {
      var _ref2$data = _ref2.data,
          eventName = _ref2$data.name,
          data = _ref2$data.data,
          origin = _ref2.origin,
          source = _ref2.source;
      var _this$config2 = this.config,
          debug = _this$config2.debug,
          targetOrigin = _this$config2.targetOrigin,
          targetWindow = _this$config2.targetWindow;
      if (origin !== targetOrigin) return;
      this.debug('postmessage_received', eventName, data);
      return this.emit(eventName, data);
    }
    /* ------------------------------------------------------------------------ *
     * Helpers
     * ------------------------------------------------------------------------ */

  }, {
    key: "notify",
    value: function notify(eventName, data) {
      return this.send(eventName, data);
    }
  }, {
    key: "dialog",
    value: function dialog(data) {
      var _this5 = this;

      if (this.inDialog) return;
      this.inDialog = true;
      return new Promise(function (resolve) {
        _this5.once('dialog-closed', function (_ref3) {
          var result = _ref3.result;
          _this5.inDialog = false;
          resolve(result);
        });

        _this5.send('dialog-opened', data);
      });
    }
  }, {
    key: "onDialog",
    value: function onDialog(cb) {
      var _this6 = this;

      this.on('dialog-opened', function (data) {
        Promise.resolve(cb(data)).then(function () {
          _this6.send('dialog-closed', {
            result: result
          });
        });
      });
    }
    /* ------------------------------------------------------------------------ *
     * Synchronization
     * ------------------------------------------------------------------------ */

  }, {
    key: "heartbeat",
    value: function heartbeat() {
      var _this7 = this;

      setInterval(function () {
        return _this7.send('heartbeat');
      }, 1000);

      var panic = function panic() {
        _this7.emit('connection-lost');

        _this7.once('heartbeat', function () {
          return _this7.emit('connection-restored');
        });
      };

      var checkPulse = function checkPulse() {
        clearTimeout(_this7.panicId);
        _this7.panicId = setTimeout(panic, 2000);
      };

      this.on('heartbeat', checkPulse);
    }
  }, {
    key: "sendHeight",
    value: function sendHeight() {
      var _this8 = this;

      var measureHeight = function measureHeight() {
        var height = Math.min(document.body.scrollHeight, document.documentElement.scrollHeight);

        if (height !== _this8.localHeight) {
          _this8.localHeight = height;

          _this8.send('resize', {
            height: height
          });
        }

        requestAnimationFrame(measureHeight);
      };

      measureHeight();
    }
  }, {
    key: "autoResize",
    value: function autoResize() {
      var _this9 = this;

      var updateHeight = function updateHeight() {
        if (_this9.localHeight !== _this9.remoteHeight) {
          _this9.config.resizeElement.style.height = "".concat(_this9.remoteHeight, "px");
          _this9.localHeight = _this9.remoteHeight;
        }

        requestAnimationFrame(updateHeight);
      };

      this.on('resize', function (_ref4) {
        var height = _ref4.height;
        _this9.remoteHeight = height;
      });
      updateHeight();
    }
  }, {
    key: "sendHistory",
    value: function sendHistory() {
      var _this10 = this;

      var checkPath = function checkPath() {
        var path = document.location.pathname;

        if (path !== _this10.localPath) {
          _this10.localPath = path;

          _this10.send('navigate', {
            path: path
          });
        }

        requestAnimationFrame(checkPath);
      };

      checkPath();
    }
  }, {
    key: "autoNavigate",
    value: function autoNavigate() {
      var _this11 = this;

      var mapPath = this.config.mapPath;
      this.on('navigate', function (_ref5) {
        var path = _ref5.path;
        _this11.remotePath = path;
        var normalizedPath = mapPath ? mapPath(path) : path;

        if (!normalizedPath) {
          _this11.warn('Failed to map remote path to local; aborting navigation.');

          return;
        }

        if (normalizedPath === document.location.pathname) return;
        history.replaceState(null, '', normalizedPath);
        var popstateEvent;

        if (typeof Event === 'function') {
          popstateEvent = new Event('popstate');
        } else {
          popstateEvent = document.createEvent('Event');
          popstateEvent.initEvent('popstate', true, true);
        }

        popstateEvent.state = null;
        dispatchEvent(popstateEvent);
      });
    }
    /* ------------------------------------------------------------------------ *
     * Utils
     * ------------------------------------------------------------------------ */

  }, {
    key: "onReady",
    value: function onReady(cb) {
      var _this12 = this;

      var documentReady = new Promise(function (res) {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', res);
        } else {
          res();
        }
      });
      var iframeReady = new Promise(function (res) {
        if (_this12.config.targetIframe) {
          _this12.config.targetIframe.addEventListener('load', res);
        } else {
          res();
        }
      });
      Promise.all([documentReady, iframeReady]).then(function () {
        cb();
      });
    }
  }, {
    key: "debug",
    value: function debug(action, eventName, data) {
      if (!this.config.debug) return;
      console.debug(JSON.stringify({
        '[host]': location.hostname,
        '[action]': action,
        name: eventName,
        data: data
      }, null, 2));
    }
  }, {
    key: "warn",
    value: function warn(msg) {
      console.warn("[PairedFrame] ".concat(msg));
    }
    /* ------------------------------------------------------------------------ *
     * Init
     * ------------------------------------------------------------------------ */

  }, {
    key: "init",
    value: function init() {
      // Both frames ultimately send both a "marco" ping (on startup) and a "polo"
      // ping (in response to the first ping they receive from the counterpart).
      // The final "polo" ping is ignored by whichever frame initialized first.
      this.send('ping');
      this.emit('ready');
      this.heartbeat();
      if (this.config.sendHeight) this.sendHeight();
      if (this.config.sendHistory) this.sendHistory();
      if (this.config.autoResize) this.autoResize();
      if (this.config.autoNavigate) this.autoNavigate();
    }
  }]);

  return PairedFrame;
}();
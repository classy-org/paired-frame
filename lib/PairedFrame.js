'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var PairedFrame =
/*#__PURE__*/
function () {
  function PairedFrame(targetWindow, targetOrigin) {
    var _this = this;

    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, PairedFrame);

    // Destructure options and apply defaults
    var _opts$applyHeight = opts.applyHeight,
        applyHeight = _opts$applyHeight === void 0 ? false : _opts$applyHeight,
        _opts$applyHistory = opts.applyHistory,
        applyHistory = _opts$applyHistory === void 0 ? false : _opts$applyHistory,
        _opts$debug = opts.debug,
        debug = _opts$debug === void 0 ? false : _opts$debug,
        _opts$iframeElement = opts.iframeElement,
        iframeElement = _opts$iframeElement === void 0 ? null : _opts$iframeElement,
        _opts$mapPath = opts.mapPath,
        mapPath = _opts$mapPath === void 0 ? null : _opts$mapPath,
        _opts$resizeElement = opts.resizeElement,
        resizeElement = _opts$resizeElement === void 0 ? null : _opts$resizeElement,
        _opts$watchHeight = opts.watchHeight,
        watchHeight = _opts$watchHeight === void 0 ? false : _opts$watchHeight,
        _opts$watchHistory = opts.watchHistory,
        watchHistory = _opts$watchHistory === void 0 ? false : _opts$watchHistory; // Create immutable configuration

    this.config = Object.freeze({
      applyHeight: applyHeight,
      applyHistory: applyHistory,
      debug: debug,
      iframeElement: iframeElement,
      mapPath: mapPath,
      targetOrigin: targetOrigin,
      targetWindow: targetWindow,
      watchHeight: watchHeight,
      watchHistory: watchHistory,
      resizeElement: resizeElement
    }); // EventEmitter

    this.registry = {};
    this.rawListeners = new WeakMap(); // State

    this.localPath = null;
    this.localHeight = 0;
    this.remoteHeight = 0;
    this.pendingHeightUpdate = false;
    this.inDialog = false; // Startup

    window.addEventListener('message', function (e) {
      return _this.receive(e);
    });
    this.onReady(function () {
      _this.once('ping', _this.init);

      _this.send('ping');
    });
  }
  /* ------------------------------------------------------------------------ *
   * Implement EventEmitter
   * ------------------------------------------------------------------------ */


  _createClass(PairedFrame, [{
    key: "listeners",
    value: function listeners(eventName) {
      var _this2 = this;

      return (this.registry[eventName] || []).map(function (cb) {
        return _this2.rawListeners.get(cb);
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
      this.rawListeners.set(cb, cb);
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

      this.rawListeners.set(wrapped, cb);
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
     * postMessage management
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

      if (debug) {
        console.log(JSON.stringify({
          '[host]': location.hostname,
          '[action]': 'SENT',
          name: eventName,
          data: data
        }, null, 2));
      }

      return true;
    }
  }, {
    key: "receive",
    value: function receive(_ref) {
      var _ref$data = _ref.data,
          eventName = _ref$data.name,
          data = _ref$data.data,
          origin = _ref.origin,
          source = _ref.source;
      var _this$config2 = this.config,
          debug = _this$config2.debug,
          targetOrigin = _this$config2.targetOrigin,
          targetWindow = _this$config2.targetWindow;
      if (source !== targetWindow) return;
      if (origin !== targetOrigin) return;

      if (debug) {
        console.log(JSON.stringify({
          '[host]': location.hostname,
          '[action]': 'RECEIVED',
          name: eventName,
          data: data
        }, null, 2));
      }

      return this.emit(eventName, data);
    }
    /* ------------------------------------------------------------------------ *
     * User interfaces
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
        _this5.once('dialog-closed', function (_ref2) {
          var result = _ref2.result;
          _this5.inDialog = false;
          resolve(result);
        });

        _this5.send('dialog-opened', data);
      });
    }
    /* ------------------------------------------------------------------------ *
     * Synchronization
     * ------------------------------------------------------------------------ */

  }, {
    key: "heartbeat",
    value: function heartbeat() {
      var _this6 = this;

      setInterval(function () {
        return _this6.send('heartbeat');
      }, 1000);
    }
  }, {
    key: "watchHeight",
    value: function watchHeight() {
      var _this7 = this;

      var watcher = function watcher() {
        var height = Math.min(document.body.scrollHeight, document.documentElement.scrollHeight);

        if (height !== _this7.localHeight) {
          _this7.localHeight = height;

          _this7.send('resize', {
            height: height
          });
        }

        requestAnimationFrame(watcher);
      };

      watcher();
    }
  }, {
    key: "applyHeight",
    value: function applyHeight() {
      var _this8 = this;

      var target = this.config.resizeElement;
      if (!target) return;

      var updater = function updater() {
        if (_this8.localHeight !== _this8.remoteHeight) {
          target.style.height = "".concat(_this8.remoteHeight, "px");
          _this8.localHeight = _this8.remoteHeight;
        }

        requestAnimationFrame(updater);
      };

      this.on('resize', function (_ref3) {
        var height = _ref3.height;
        _this8.remoteHeight = height;
      });
      updater();
    }
  }, {
    key: "watchHistory",
    value: function watchHistory() {
      var _this9 = this;

      var watcher = function watcher() {
        var path = document.location.pathname;

        if (path !== _this9.localPath) {
          _this9.localPath = path;

          _this9.send('navigate', {
            path: path
          });
        }

        requestAnimationFrame(watcher);
      };

      watcher();
    }
  }, {
    key: "applyHistory",
    value: function applyHistory() {
      var mapPath = this.config.mapPath;
      this.on('navigate', function (_ref4) {
        var path = _ref4.path;
        var normalizedPath = mapPath ? mapPath(path) : path;
        if (!normalizedPath) return;
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
        window.dispatchEvent(popstateEvent);
      });
    }
    /* ------------------------------------------------------------------------ *
     * Utils
     * ------------------------------------------------------------------------ */

  }, {
    key: "onReady",
    value: function onReady(cb) {
      var iframeElement = this.config.iframeElement;
      setTimeout(function () {
        var documentReady = new Promise(function (res) {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', res);
          } else {
            res();
          }
        });
        var iframeReady = new Promise(function (res) {
          if (iframeElement) {
            iframeElement.addEventListener('load', res);
          } else {
            res();
          }
        });
        Promise.all([documentReady, iframeReady]).then(function () {
          cb();
        });
      });
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
      if (this.config.watchHeight) this.watchHeight();
      if (this.config.watchHistory) this.watchHistory();
      if (this.config.applyHeight) this.applyHeight();
      if (this.config.applyHistory) this.applyHistory();
    }
  }]);

  return PairedFrame;
}();
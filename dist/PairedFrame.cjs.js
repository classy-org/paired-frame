'use strict';

var PairedFrame = (function () {
    function PairedFrame(_a) {
        var _b = _a.autoNavigate, autoNavigate = _b === void 0 ? false : _b, _c = _a.autoResize, autoResize = _c === void 0 ? false : _c, _d = _a.debug, debug = _d === void 0 ? false : _d, _e = _a.providePath, providePath = _e === void 0 ? null : _e, _f = _a.resizeElement, resizeElement = _f === void 0 ? null : _f, _g = _a.sendHeight, sendHeight = _g === void 0 ? false : _g, _h = _a.sendHistory, sendHistory = _h === void 0 ? false : _h, targetOrigin = _a.targetOrigin, targetWindow = _a.targetWindow, _j = _a.translatePath, translatePath = _j === void 0 ? null : _j;
        var _this = this;
        if (!targetOrigin || !targetWindow) {
            throw new Error('Failed to instantiate PairedFrame: config must include a targetOrigin and targetWindow.');
        }
        if (autoResize && !resizeElement) {
            throw new Error('Failed to instantiate PairedFrame: config must include a resizeElement when autoResize is true.');
        }
        this.config = Object.freeze({
            autoNavigate: autoNavigate,
            autoResize: autoResize,
            debug: debug,
            providePath: providePath,
            resizeElement: resizeElement,
            sendHeight: sendHeight,
            sendHistory: sendHistory,
            targetOrigin: targetOrigin,
            targetWindow: targetWindow,
            translatePath: translatePath
        });
        this.registry = {};
        this.callbacks = new WeakMap();
        this.dialogs = {};
        this.hasPendingHeightUpdate = false;
        this.localPath = null;
        this.localHeight = 0;
        this.remotePath = null;
        this.remoteHeight = 0;
        this.uniqueId = 0;
        this.boundReceiver = this.receive.bind(this);
        addEventListener('message', this.boundReceiver);
        this.onReady(function () {
            _this.once('hello', _this.init);
            _this.send('hello');
        });
    }
    PairedFrame.prototype.listeners = function (eventName) {
        var _this = this;
        return (this.registry[eventName] || []).map(function (cb) { return _this.callbacks.get(cb); });
    };
    PairedFrame.prototype.listenerCount = function (eventName) {
        return (this.registry[eventName] || []).length;
    };
    PairedFrame.prototype.eventNames = function () {
        return Object.keys(this.registry);
    };
    PairedFrame.prototype.on = function (eventName, cb) {
        var listeners = this.registry[eventName] || [];
        listeners.push(cb);
        this.registry[eventName] = listeners;
        this.callbacks.set(cb, cb);
        return this;
    };
    PairedFrame.prototype.once = function (eventName, cb) {
        var _this = this;
        var wrapped = function (data) {
            _this.off(eventName, wrapped);
            cb.call(_this, data);
        };
        this.callbacks.set(wrapped, cb);
        return this.on(eventName, wrapped);
    };
    PairedFrame.prototype.off = function (eventName, cb) {
        if (!this.registry[eventName])
            return this;
        var idx = this.registry[eventName].findIndex(function (el) { return el === cb; });
        if (idx === -1)
            return this;
        this.registry[eventName].splice(idx, 1);
        return this;
    };
    PairedFrame.prototype.emit = function (eventName, data) {
        var _this = this;
        var count = this.listenerCount(eventName);
        (this.registry[eventName] || []).forEach(function (cb) { return cb.call(_this, data); });
        return Boolean(count);
    };
    PairedFrame.prototype.send = function (eventName, data) {
        var _a = this.config, targetOrigin = _a.targetOrigin, targetWindow = _a.targetWindow;
        targetWindow.postMessage({ name: eventName, data: data }, targetOrigin);
        this.debug('postmessage_sent', eventName, data);
        return true;
    };
    PairedFrame.prototype.receive = function (_a) {
        var message = _a.data, origin = _a.origin, source = _a.source;
        var _b = this.config, targetOrigin = _b.targetOrigin, targetWindow = _b.targetWindow;
        if (origin !== targetOrigin)
            return;
        if (source !== targetWindow)
            return;
        if (typeof message !== 'object' || !message.name)
            return;
        var eventName = message.name, data = message.data;
        this.debug('postmessage_received', eventName, data);
        return this.emit(eventName, data);
    };
    PairedFrame.prototype.dialog = function (config) {
        var _this = this;
        var id = location.hostname + ":" + ++this.uniqueId;
        this.send('dialog-opened', { id: id, config: config });
        return new Promise(function (resolve) { return (_this.dialogs[id] = resolve); });
    };
    PairedFrame.prototype.onDialog = function (cb) {
        var _this = this;
        this.on('dialog-opened', function (_a) {
            var id = _a.id, config = _a.config;
            Promise.resolve(cb(config)).then(function (result) {
                return _this.send('dialog-closed', { id: id, result: result });
            });
        });
    };
    PairedFrame.prototype.resolveDialogs = function () {
        var _this = this;
        this.on('dialog-closed', function (_a) {
            var id = _a.id, result = _a.result;
            _this.dialogs[id](result);
            delete _this.dialogs[id];
        });
    };
    PairedFrame.prototype.heartbeat = function () {
        var _this = this;
        setInterval(function () { return _this.send('heartbeat'); }, 1000);
        var panic = function () {
            _this.emit('connection-lost');
            _this.once('heartbeat', function () { return _this.emit('connection-restored'); });
        };
        var checkPulse = function () {
            clearTimeout(_this.pulseId);
            _this.pulseId = window.setTimeout(panic, 2000);
        };
        this.on('heartbeat', checkPulse);
    };
    PairedFrame.prototype.sendHeight = function () {
        var _this = this;
        var measureHeight = function () {
            var height = Math.min(document.body.scrollHeight, document.documentElement.scrollHeight);
            if (height !== _this.localHeight) {
                _this.localHeight = height;
                _this.send('resize', { height: height });
            }
            requestAnimationFrame(measureHeight);
        };
        measureHeight();
    };
    PairedFrame.prototype.autoResize = function () {
        var _this = this;
        var updateHeight = function () {
            if (_this.config.resizeElement && _this.localHeight !== _this.remoteHeight) {
                _this.config.resizeElement.style.height = _this.remoteHeight + "px";
                _this.localHeight = _this.remoteHeight;
            }
            requestAnimationFrame(updateHeight);
        };
        this.on('resize', function (_a) {
            var height = _a.height;
            _this.remoteHeight = height;
        });
        updateHeight();
    };
    PairedFrame.prototype.sendHistory = function () {
        var _this = this;
        var providePath = this.config.providePath;
        var checkPath = function () {
            var path = location.pathname;
            if (path !== _this.localPath) {
                var requestedPath = providePath ? providePath(path) : null;
                _this.localPath = path;
                _this.send('navigate', { path: path, requestedPath: requestedPath });
            }
            requestAnimationFrame(checkPath);
        };
        checkPath();
    };
    PairedFrame.prototype.autoNavigate = function () {
        var _this = this;
        var translatePath = this.config.translatePath;
        this.on('navigate', function (_a) {
            var path = _a.path, requestedPath = _a.requestedPath;
            _this.remotePath = path;
            var normalizedPath = translatePath ? translatePath(path, requestedPath)
                : path;
            if (!normalizedPath || normalizedPath === location.pathname)
                return;
            history.replaceState(null, '', normalizedPath);
            var popstateEvent;
            if (typeof Event === 'function') {
                popstateEvent = new Event('popstate');
            }
            else {
                popstateEvent = document.createEvent('Event');
                popstateEvent.initEvent('popstate', true, true);
            }
            popstateEvent.state = null;
            dispatchEvent(popstateEvent);
        });
    };
    PairedFrame.prototype.onReady = function (cb) {
        var _a = this.config, targetOrigin = _a.targetOrigin, targetWindow = _a.targetWindow;
        var localReady = new Promise(function (resolve) {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            }
            else {
                resolve();
            }
        });
        var remoteReady = new Promise(function (resolve) {
            if (targetOrigin === origin) {
                resolve();
            }
            else {
                var intervalId_1 = setInterval(function () {
                    try {
                        if (targetWindow.origin !== origin) {
                            resolve();
                            clearInterval(intervalId_1);
                        }
                    }
                    catch (err) {
                        resolve();
                        clearInterval(intervalId_1);
                    }
                }, 100);
            }
        });
        Promise.all([localReady, remoteReady]).then(cb);
    };
    PairedFrame.prototype.debug = function (action, eventName, data) {
        if (!this.config.debug)
            return;
        console.debug(JSON.stringify({
            '[host]': location.hostname,
            '[action]': action,
            name: eventName,
            data: data
        }, null, 2));
    };
    PairedFrame.prototype.destroy = function () {
        removeEventListener('message', this.boundReceiver);
    };
    PairedFrame.prototype.init = function () {
        this.send('hello');
        this.emit('ready');
        this.heartbeat();
        this.resolveDialogs();
        if (this.config.sendHeight)
            this.sendHeight();
        if (this.config.sendHistory)
            this.sendHistory();
        if (this.config.autoResize)
            this.autoResize();
        if (this.config.autoNavigate)
            this.autoNavigate();
    };
    return PairedFrame;
}());

module.exports = PairedFrame;

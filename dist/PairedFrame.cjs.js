'use strict';

var PairedFrame = (function () {
    function PairedFrame(_a) {
        var _b = _a.autoNavigate, autoNavigate = _b === void 0 ? false : _b, _c = _a.autoResize, autoResize = _c === void 0 ? false : _c, _d = _a.providePath, providePath = _d === void 0 ? null : _d, _e = _a.resizeElement, resizeElement = _e === void 0 ? null : _e, _f = _a.sendHeight, sendHeight = _f === void 0 ? false : _f, _g = _a.sendHistory, sendHistory = _g === void 0 ? false : _g, targetOrigin = _a.targetOrigin, targetWindow = _a.targetWindow, _h = _a.translatePath, translatePath = _h === void 0 ? null : _h;
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
            providePath: providePath,
            resizeElement: resizeElement,
            sendHeight: sendHeight,
            sendHistory: sendHistory,
            targetOrigin: targetOrigin,
            targetWindow: targetWindow,
            translatePath: translatePath
        });
        this.destroyed = false;
        this.registry = {};
        this.callbacks = new WeakMap();
        this.dialogs = {};
        this.hasPendingHeightUpdate = false;
        this.localPath = null;
        this.localHeight = 0;
        this.remotePath = null;
        this.remoteHeight = 0;
        this.uniqueId = 0;
        this.boundMessageHandler = this.handleMessages.bind(this);
        this.on('load', function () {
            window.addEventListener('message', _this.boundMessageHandler);
            _this.on('ping', function () { return _this.init(); });
            _this.on('pong', function () { return _this.init(); });
            _this.on('ping', function () { return _this.send('pong'); });
            _this.send('ping');
        });
        this.awaitLoad();
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
        if (this.destroyed)
            return false;
        var callbacks = (this.registry[eventName] || []).slice();
        callbacks.forEach(function (cb) { return setTimeout(cb.bind(_this, data)); });
        if (eventName !== '*') {
            this.emit('*', { name: eventName, data: data });
        }
        return Boolean(callbacks.length);
    };
    PairedFrame.prototype.send = function (eventName, data) {
        if (this.destroyed)
            return false;
        var _a = this.config, targetOrigin = _a.targetOrigin, targetWindow = _a.targetWindow;
        var message = { name: eventName, data: data };
        targetWindow.postMessage(message, targetOrigin);
        this.emit('postmessage-sent', { message: message, origin: targetOrigin });
        return true;
    };
    PairedFrame.prototype.dialog = function (config) {
        var _this = this;
        var id = window.location.hostname + ":" + ++this.uniqueId;
        this.emit('dialog-opened', { id: id, config: config });
        this.send('dialog-opened', { id: id, config: config });
        return new Promise(function (resolve) { return (_this.dialogs[id] = resolve); });
    };
    PairedFrame.prototype.onDialog = function (cb) {
        var _this = this;
        this.on('dialog-opened', function (_a) {
            var id = _a.id, config = _a.config;
            Promise.resolve(cb(config)).then(function (result) {
                _this.emit('dialog-closed', { id: id, result: result });
                _this.send('dialog-closed', { id: id, result: result });
            });
        });
        return this;
    };
    PairedFrame.prototype.destroy = function () {
        window.removeEventListener('message', this.boundMessageHandler);
        this.emit('destroy');
        this.destroyed = true;
        return true;
    };
    PairedFrame.prototype.awaitLoad = function () {
        var _this = this;
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
        Promise.all([localReady, remoteReady]).then(function () {
            _this.emit('load');
        });
    };
    PairedFrame.prototype.handleMessages = function (_a) {
        var message = _a.data, origin = _a.origin, source = _a.source;
        var _b = this.config, targetOrigin = _b.targetOrigin, targetWindow = _b.targetWindow;
        if (origin !== targetOrigin)
            return;
        if (source !== targetWindow)
            return;
        if (typeof message !== 'object' || !message.name)
            return;
        this.emit('postmessage-received', { message: message, origin: origin });
        var eventName = message.name, data = message.data;
        this.emit(eventName, data);
    };
    PairedFrame.prototype.heartbeat = function () {
        var _this = this;
        setInterval(function () { return _this.send('heartbeat'); }, 250);
        var panic = function () {
            _this.emit('connection-lost');
            _this.once('heartbeat', function () { return _this.emit('connection-restored'); });
        };
        var checkPulse = function () {
            clearTimeout(_this.pulseId);
            _this.pulseId = window.setTimeout(panic, 500);
        };
        this.on('heartbeat', checkPulse);
    };
    PairedFrame.prototype.handleDialogs = function () {
        var _this = this;
        this.on('dialog-closed', function (_a) {
            var id = _a.id, result = _a.result;
            if (id && typeof _this.dialogs[id] === 'function') {
                _this.dialogs[id](result);
                delete _this.dialogs[id];
            }
        });
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
                var previousHeight = _this.localHeight;
                _this.config.resizeElement.style.height = _this.remoteHeight + "px";
                _this.localHeight = _this.remoteHeight;
                _this.emit('height-updated', {
                    remoteHeight: _this.remoteHeight,
                    previousHeight: previousHeight,
                    currentHeight: _this.localHeight
                });
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
            var _a = window.location, hash = _a.hash, pathname = _a.pathname, search = _a.search;
            var localPath = "" + pathname + search + hash;
            if (localPath !== _this.localPath) {
                var requestedPath = providePath ? providePath(localPath) : null;
                _this.localPath = localPath;
                _this.send('navigate', { path: localPath, requestedPath: requestedPath });
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
            var _b = window.location, hash = _b.hash, pathname = _b.pathname, search = _b.search;
            var localPath = "" + pathname + search + hash;
            var normalizedPath = translatePath
                ? translatePath(path, requestedPath)
                : path;
            if (!normalizedPath || normalizedPath === localPath)
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
            _this.emit('path-updated', {
                remotePath: path,
                requestedPath: requestedPath,
                previousPath: localPath,
                currentPath: normalizedPath
            });
        });
    };
    PairedFrame.prototype.init = function () {
        this.off('ping', this.init);
        this.off('pong', this.init);
        this.heartbeat();
        this.handleDialogs();
        if (this.config.sendHeight)
            this.sendHeight();
        if (this.config.sendHistory)
            this.sendHistory();
        if (this.config.autoResize)
            this.autoResize();
        if (this.config.autoNavigate)
            this.autoNavigate();
        this.emit('ready');
    };
    return PairedFrame;
}());

module.exports = PairedFrame;

'use strict';

class PairedFrame {

  constructor (targetWindow, targetOrigin, opts={}) {

    // Destructure options and apply defaults
    const {
      applyHeight    = false,
      applyHistory   = false,
      debug          = false,
      iframeElement  = null,
      mapPath        = null,
      resizeElement  = null,
      watchHeight    = false,
      watchHistory   = false,
    } = opts;

    // Create immutable configuration
    this.config = Object.freeze({
      applyHeight,
      applyHistory,
      debug,
      iframeElement,
      mapPath,
      targetOrigin,
      targetWindow,
      watchHeight,
      watchHistory,
      resizeElement,
    });

    // EventEmitter
    this.registry = {};
    this.rawListeners = new WeakMap();

    // State
    this.localPath = null;
    this.localHeight = 0;
    this.remoteHeight = 0;
    this.pendingHeightUpdate = false;
    this.inDialog = false;

    // Startup
    window.addEventListener('message', (e) => this.receive(e));
    this.onReady(() => {
      this.once('ping', this.init);
      this.send('ping');
    });
  }


  /* ------------------------------------------------------------------------ *
   * Implement EventEmitter
   * ------------------------------------------------------------------------ */

  listeners (eventName) {
    return (this.registry[eventName] || []).map(cb => this.rawListeners.get(cb));
  }

  listenerCount (eventName) {
    return (this.registry[eventName] || []).length;
  }

  eventNames () {
    return Object.keys(this.registry);
  }

  on (eventName, cb) {
    const listeners = this.registry[eventName] || [];
    listeners.push(cb);
    this.registry[eventName] = listeners;
    this.rawListeners.set(cb, cb);
    return this;
  }

  once (eventName, cb) {
    const wrapped = (...args) => {
      this.off(eventName, wrapped);
      cb.call(this, ...args);
    };
    this.rawListeners.set(wrapped, cb);
    return this.on(eventName, wrapped);
  }

  off (eventName, cb) {
    if (!this.registry[eventName]) return this;
    const idx = this.registry[eventName].findIndex(el => el === cb);
    if (idx === -1) return this;
    this.registry[eventName].splice(idx, 1);
    return this;
  }

  emit (eventName, data) {
    // Grab count first in case callbacks register more listeners
    const count = this.listenerCount(eventName);
    (this.registry[eventName] || []).forEach(cb => cb.call(this, data));
    return Boolean(count);
  }


  /* ------------------------------------------------------------------------ *
   * postMessage management
   * ------------------------------------------------------------------------ */

  send (eventName, data) {
    const { debug, targetOrigin, targetWindow } = this.config;
    targetWindow.postMessage({ name: eventName, data }, targetOrigin);
    if (debug) {
      console.log(JSON.stringify({
        '[host]': location.hostname,
        '[action]': 'SENT',
        name: eventName,
        data
      }, null, 2));
    }
    return true;
  }

  receive ({ data: { name: eventName, data }, origin, source }) {
    const { debug, targetOrigin, targetWindow } = this.config;
    if (source !== targetWindow) return;
    if (origin !== targetOrigin) return;
    if (debug) {
      console.log(JSON.stringify({
        '[host]': location.hostname,
        '[action]': 'RECEIVED',
        name: eventName,
        data
      }, null, 2));
    }
    return this.emit(eventName, data);
  }


  /* ------------------------------------------------------------------------ *
   * User interfaces
   * ------------------------------------------------------------------------ */

  notify (eventName, data) {
    return this.send(eventName, data);
  }

  dialog (data) {
    if (this.inDialog) return;
    this.inDialog = true;
    return new Promise((resolve) => {
      this.once('dialog-closed', ({ result }) => {
        this.inDialog = false;
        resolve(result);
      });
      this.send('dialog-opened', data);
    });
  }


  /* ------------------------------------------------------------------------ *
   * Synchronization
   * ------------------------------------------------------------------------ */

  heartbeat () {
    setInterval(() => this.send('heartbeat'), 1000);
  }

  watchHeight () {
    const watcher = () => {
      const height = Math.min(document.body.scrollHeight, document.documentElement.scrollHeight);
      if (height !== this.localHeight) {
        this.localHeight = height;
        this.send('resize', { height });
      }
      requestAnimationFrame(watcher);
    }
    watcher();
  }

  applyHeight () {
    const target = this.config.resizeElement;
    if (!target) return;
    const updater = () => {
      if (this.localHeight !== this.remoteHeight) {
        target.style.height = `${this.remoteHeight}px`;
        this.localHeight = this.remoteHeight;
      }
      requestAnimationFrame(updater);
    }
    this.on('resize', ({ height }) => {
      this.remoteHeight = height;
    });
    updater();
  }

  watchHistory () {
    const watcher = () => {
      const path = document.location.pathname;
      if (path !== this.localPath) {
        this.localPath = path;
        this.send('navigate', { path });
      }
      requestAnimationFrame(watcher);
    }
    watcher();
  }

  applyHistory () {
    const { mapPath } = this.config;
    this.on('navigate', ({ path }) => {
      const normalizedPath = mapPath ? mapPath(path) : path;
      if (!normalizedPath) return;
      if (normalizedPath === document.location.pathname) return;
      history.replaceState(null, '', normalizedPath);
      let popstateEvent;
      if (typeof(Event) === 'function') {
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

  onReady (cb) {
    const { iframeElement } = this.config;
    setTimeout(() => {
      const documentReady = new Promise((res) => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', res);
        } else {
          res();
        }
      });
      const iframeReady = new Promise((res) => {
        if (iframeElement) {
          iframeElement.addEventListener('load', res);
        } else {
          res();
        }
      });
      Promise.all([documentReady, iframeReady]).then(() => {
        cb();
      });
    });
  }


  /* ------------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------------ */

  init () {
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
}
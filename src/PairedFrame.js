export default class PairedFrame {

  constructor({
    autoNavigate = false,
    autoResize = false,
    debug = false,
    resizeElement = null,
    sendHeight = false,
    sendHistory = false,
    targetOrigin = null,
    targetWindow = null,
    translatePath = null
  }) {

    if (!targetOrigin || !targetWindow) {
      throw new Error(
        'Failed to instantiate PairedFrame: config must include a targetOrigin and targetWindow.'
      );
    }

    if (autoResize && !resizeElement) {
      throw new Error(
        'Failed to instantiate PairedFrame: config must include a resizeElement when autoResize is true.'
      );
    }

    this.config = Object.freeze({
      autoNavigate,
      autoResize,
      debug,
      resizeElement,
      sendHeight,
      sendHistory,
      targetOrigin,
      targetWindow,
      translatePath
    });

    // Registry of wrapped event callbacks
    this.registry = {};

    // Registry of raw event callbacks
    this.callbacks = new WeakMap();

    // Registry of pending dialog results
    this.dialogs = {};

    // Boolean; if true, frame will adjust height in upcoming animation frame
    this.hasPendingHeightUpdate = false;

    // Pathname of this frame
    this.localPath = null;

    // ScrollHeight of this frame
    this.localHeight = 0;

    // Pathname of counterpart
    this.remotePath = null;

    // ScrollHeight of counterpart
    this.remoteHeight = 0;

    // Incrementor to create unique ids
    this.uniqueId = 0;

    // Reference to bound receive method that may be removed later
    this.boundReceiver = this.receive.bind(this);

    addEventListener('message', this.boundReceiver);
    this.onReady(() => {
      this.once('hello', this.init);
      this.send('hello');
    });
  }


  /* ------------------------------------------------------------------------ *
   * EventEmitter
   * ------------------------------------------------------------------------ */

  listeners(eventName) {
    return (this.registry[eventName] || []).map(cb => this.callbacks.get(cb));
  }

  listenerCount(eventName) {
    return (this.registry[eventName] || []).length;
  }

  eventNames() {
    return Object.keys(this.registry);
  }

  on(eventName, cb) {
    const listeners = this.registry[eventName] || [];
    listeners.push(cb);
    this.registry[eventName] = listeners;
    this.callbacks.set(cb, cb);
    return this;
  }

  once(eventName, cb) {
    const wrapped = (...args) => {
      this.off(eventName, wrapped);
      cb.call(this, ...args);
    };
    this.callbacks.set(wrapped, cb);
    return this.on(eventName, wrapped);
  }

  off(eventName, cb) {
    if (!this.registry[eventName]) return this;
    const idx = this.registry[eventName].findIndex(el => el === cb);
    if (idx === -1) return this;
    this.registry[eventName].splice(idx, 1);
    return this;
  }

  emit(eventName, data) {
    // Grab count first in case callbacks register more listeners
    const count = this.listenerCount(eventName);
    (this.registry[eventName] || []).forEach(cb => cb.call(this, data));
    return Boolean(count);
  }


  /* ------------------------------------------------------------------------ *
   * PostMessages
   * ------------------------------------------------------------------------ */

  send(eventName, data) {
    const { targetOrigin, targetWindow } = this.config;
    targetWindow.postMessage({ name: eventName, data }, targetOrigin);
    this.debug('postmessage_sent', eventName, data);
    return true;
  }

  receive({ data: message, origin, source }) {
    const { targetOrigin, targetWindow } = this.config;
    if (origin !== targetOrigin) return;
    if (source !== targetWindow) return;
    if (typeof message !== 'object' || !message.name) return;
    const { name: eventName, data } = message;
    this.debug('postmessage_received', eventName, data);
    return this.emit(eventName, data);
  }


  /* ------------------------------------------------------------------------ *
   * Dialogs
   * ------------------------------------------------------------------------ */

  dialog(config) {
    const id = `${location.hostname}:${++this.uniqueId}`;
    this.send('dialog-opened', { id, config });
    return new Promise(resolve => (this.dialogs[id] = resolve));
  }

  onDialog(cb) {
    this.on('dialog-opened', ({ id, config }) => {
      Promise.resolve(cb(config)).then(result =>
        this.send('dialog-closed', { id, result })
      );
    });
  }

  resolveDialogs() {
    this.on('dialog-closed', ({ id, result }) => {
      this.dialogs[id](result);
      delete this.dialogs[id];
    });
  }


  /* ------------------------------------------------------------------------ *
   * Synchronization
   * ------------------------------------------------------------------------ */

  heartbeat() {
    setInterval(() => this.send('heartbeat'), 1000);
    const panic = () => {
      this.emit('connection-lost');
      this.once('heartbeat', () => this.emit('connection-restored'));
    };
    const checkPulse = () => {
      clearTimeout(this.panicId);
      this.panicId = setTimeout(panic, 2000);
    };
    this.on('heartbeat', checkPulse);
  }

  sendHeight() {
    const measureHeight = () => {
      const height = Math.min(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      if (height !== this.localHeight) {
        this.localHeight = height;
        this.send('resize', { height });
      }
      requestAnimationFrame(measureHeight);
    };
    measureHeight();
  }

  autoResize() {
    const updateHeight = () => {
      if (this.localHeight !== this.remoteHeight) {
        this.config.resizeElement.style.height = `${this.remoteHeight}px`;
        this.localHeight = this.remoteHeight;
      }
      requestAnimationFrame(updateHeight);
    };
    this.on('resize', ({ height }) => {
      this.remoteHeight = height;
    });
    updateHeight();
  }

  sendHistory() {
    const checkPath = () => {
      const path = location.pathname;
      if (path !== this.localPath) {
        this.localPath = path;
        this.send('navigate', { path });
      }
      requestAnimationFrame(checkPath);
    };
    checkPath();
  }

  autoNavigate() {
    const { translatePath } = this.config;
    this.on('navigate', ({ path }) => {
      this.remotePath = path;
      const normalizedPath = translatePath ? translatePath(path) : path;
      if (!normalizedPath || normalizedPath === location.pathname) return;
      history.replaceState(null, '', normalizedPath);
      let popstateEvent;
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

  onReady(cb) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', cb);
    } else {
      cb();
    }
  }

  debug(action, eventName, data) {
    if (!this.config.debug) return;
    console.debug(
      JSON.stringify(
        {
          '[host]': location.hostname,
          '[action]': action,
          name: eventName,
          data
        },
        null,
        2
      )
    );
  }


  /* ------------------------------------------------------------------------ *
   * Destroy
   * ------------------------------------------------------------------------ */

  destroy() {
    removeEventListener('message', this.boundReceiver);
  }


  /* ------------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------------ */

  init() {
    // Both frames ultimately send both an initial "hello" (on startup) and a
    // return "hello" (in response to the first hello they receive from the
    // counterpart). The final "hello" is ignored by whichever frame
    // initialized first.
    this.send('hello');
    this.emit('ready');
    this.heartbeat();
    this.resolveDialogs();
    if (this.config.sendHeight) this.sendHeight();
    if (this.config.sendHistory) this.sendHistory();
    if (this.config.autoResize) this.autoResize();
    if (this.config.autoNavigate) this.autoNavigate();
  }
};

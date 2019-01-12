/* -------------------------------------------------------------------------- *
 * Types
 * -------------------------------------------------------------------------- */

interface PairedFrameOptions {
  autoNavigate: boolean;
  autoResize: boolean;
  providePath: Function | null;
  resizeElement: HTMLElement | null;
  sendHeight: boolean;
  sendHistory: boolean;
  targetOrigin: string;
  targetWindow: Window;
  translatePath: Function | null;
}

interface CallbackRegistry {
  [propname: string]: Function[];
}

interface DialogRegistry {
  [propname: string]: (result: any) => void;
}

interface ResizeMessage {
  height: number;
}

interface NavigateMessage {
  path: string;
  requestedPath: string | null;
}

interface DialogOpenedMessage {
  id: string;
  config?: any;
}

interface DialogClosedMessage {
  id: string;
  result?: any;
}

/* -------------------------------------------------------------------------- *
 * PairedFrame class
 * -------------------------------------------------------------------------- */

export default class PairedFrame {
  private config: PairedFrameOptions;
  private registry: CallbackRegistry;
  private callbacks: WeakMap<Function, Function>;
  private dialogs: DialogRegistry;
  private hasPendingHeightUpdate: boolean;
  private localPath: string | null;
  private localHeight: number;
  private remotePath: string | null;
  private remoteHeight: number;
  private uniqueId: number;
  private boundMessageHandler: EventListener;
  private pulseId: number;
  private destroyed: Boolean;

  constructor({
    autoNavigate = false,
    autoResize = false,
    providePath = null,
    resizeElement = null,
    sendHeight = false,
    sendHistory = false,
    targetOrigin,
    targetWindow,
    translatePath = null
  }: PairedFrameOptions) {
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
      providePath,
      resizeElement,
      sendHeight,
      sendHistory,
      targetOrigin,
      targetWindow,
      translatePath
    });

    // Boolean; if true, no postMessages will be sent or callbacks fired.
    this.destroyed = false;

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

    // Bound reference to message handler that can be deregistered later.
    this.boundMessageHandler = this.handleMessages.bind(this);

    // Each frame will receive either a single "ping" (if first to load) or a
    // single "pong" (if second to load). Either message triggers the frame to
    // initialize. Subsequent "ping" messages will continue to receive "pong"
    // responses so that the connection can be gracefully restored if the
    // counterpart frame is reloaded.
    this.on('load', () => {
      window.addEventListener('message', this.boundMessageHandler);
      this.on('ping', () => this.init());
      this.on('pong', () => this.init());
      this.on('ping', () => this.send('pong'));
      this.send('ping');
    });

    // Kick off watcher that will fire "load" event when frames are ready.
    this.awaitLoad();
  }

  /* ------------------------------------------------------------------------ *
   * Event Management
   * ------------------------------------------------------------------------ */

  listeners(eventName: string) {
    return (this.registry[eventName] || []).map(cb => this.callbacks.get(cb));
  }

  listenerCount(eventName: string) {
    return (this.registry[eventName] || []).length;
  }

  eventNames() {
    return Object.keys(this.registry);
  }

  on(eventName: string, cb: (data?: Object) => any) {
    const listeners = this.registry[eventName] || [];
    listeners.push(cb);
    this.registry[eventName] = listeners;
    this.callbacks.set(cb, cb);
    return this;
  }

  once(eventName: string, cb: (data?: Object) => any) {
    const wrapped = (data?: Object) => {
      this.off(eventName, wrapped);
      cb.call(this, data);
    };
    this.callbacks.set(wrapped, cb);
    return this.on(eventName, wrapped);
  }

  off(eventName: string, cb: (data?: Object) => any) {
    if (!this.registry[eventName]) return this;
    const idx = this.registry[eventName].findIndex(el => el === cb);
    if (idx === -1) return this;
    this.registry[eventName].splice(idx, 1);
    return this;
  }

  emit(eventName: string, data?: Object) {
    if (this.destroyed) return false;
    // Create shallow copy in case initial callbacks register or deregister
    // other callbacks.
    const callbacks = [...(this.registry[eventName] || [])];
    callbacks.forEach(cb => setTimeout(cb.bind(this, data)));
    if (eventName !== '*') {
      this.emit('*', { name: eventName, data });
    }
    return Boolean(callbacks.length);
  }

  send(eventName: string, data?: Object) {
    if (this.destroyed) return false;
    const { targetOrigin, targetWindow } = this.config;
    const message = { name: eventName, data };
    targetWindow.postMessage(message, targetOrigin);
    this.emit('postmessage-sent', { message, origin: targetOrigin });
    return true;
  }

  /* ------------------------------------------------------------------------ *
   * Frame Management
   * ------------------------------------------------------------------------ */

  dialog(config?: any) {
    const id = `${window.location.hostname}:${++this.uniqueId}`;
    this.emit('dialog-opened', { id, config });
    this.send('dialog-opened', { id, config });
    return new Promise(resolve => (this.dialogs[id] = resolve));
  }

  onDialog(cb: (config?: any) => any) {
    this.on('dialog-opened', ({ id, config }: DialogOpenedMessage) => {
      Promise.resolve(cb(config)).then(result => {
        this.emit('dialog-closed', { id, result });
        this.send('dialog-closed', { id, result });
      });
    });
    return this;
  }

  destroy() {
    window.removeEventListener('message', this.boundMessageHandler);
    this.emit('destroy');
    this.destroyed = true;
    return true;
  }

  /* ------------------------------------------------------------------------ *
   * Internal
   * ------------------------------------------------------------------------ */

  // Defer work until both frames have loaded enough to avoid a console error.
  private awaitLoad() {
    const { targetOrigin, targetWindow } = this.config;
    const localReady = new Promise(resolve => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
    const remoteReady = new Promise(resolve => {
      if (targetOrigin === origin) {
        resolve();
      } else {
        const intervalId = setInterval(() => {
          try {
            if (targetWindow.origin !== origin) {
              resolve();
              clearInterval(intervalId);
            }
          } catch (err) {
            resolve();
            clearInterval(intervalId);
          }
        }, 100);
      }
    });
    Promise.all([localReady, remoteReady]).then(() => {
      this.emit('load');
    });
  }

  // PostMessage handler; inspect, log, and emit data from postMessage events.
  private handleMessages({ data: message, origin, source }: MessageEvent) {
    const { targetOrigin, targetWindow } = this.config;
    if (origin !== targetOrigin) return;
    if (source !== targetWindow) return;
    if (typeof message !== 'object' || !message.name) return;
    this.emit('postmessage-received', { message, origin });
    const { name: eventName, data } = message;
    this.emit(eventName, data);
  }

  // Monitor connection to counterpart.
  private heartbeat() {
    setInterval(() => this.send('heartbeat'), 250);
    const panic = () => {
      this.emit('connection-lost');
      this.once('heartbeat', () => this.emit('connection-restored'));
    };
    const checkPulse = () => {
      clearTimeout(this.pulseId);
      this.pulseId = window.setTimeout(panic, 500);
    };
    this.on('heartbeat', checkPulse);
  }

  // When "dialog-closed" event is sent, check for a corresponding stored
  // promise resolver and call it.
  private handleDialogs() {
    this.on('dialog-closed', ({ id, result }: DialogClosedMessage) => {
      if (id && typeof this.dialogs[id] === 'function') {
        this.dialogs[id](result);
        delete this.dialogs[id];
      }
    });
  }

  // Monitor and broadcast window height, if enabled.
  private sendHeight() {
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

  // Monitor counterpart height and adjust element size to match, if enabled.
  private autoResize() {
    const updateHeight = () => {
      if (this.config.resizeElement && this.localHeight !== this.remoteHeight) {
        const previousHeight = this.localHeight;
        this.config.resizeElement.style.height = `${this.remoteHeight}px`;
        this.localHeight = this.remoteHeight;
        this.emit('height-updated', {
          remoteHeight: this.remoteHeight,
          previousHeight,
          currentHeight: this.localHeight
        });
      }
      requestAnimationFrame(updateHeight);
    };
    this.on('resize', ({ height }: ResizeMessage) => {
      this.remoteHeight = height;
    });
    updateHeight();
  }

  // Monitor and broadcast window pathname, if enabled.
  private sendHistory() {
    const { providePath } = this.config;
    const checkPath = () => {
      const { hash, pathname, search } = window.location;
      const localPath = `${pathname}${search}${hash}`;
      if (localPath !== this.localPath) {
        const requestedPath = providePath ? providePath(localPath) : null;
        this.localPath = localPath;
        this.send('navigate', { path: localPath, requestedPath });
      }
      requestAnimationFrame(checkPath);
    };
    checkPath();
  }

  // Monitor counterpart path and replace window path with equivalent, if
  // enabled. A synthetic popstate event is fired to alert any routing library
  // that the path has changed, just like hitting the browser back button.
  private autoNavigate() {
    const { translatePath } = this.config;
    this.on('navigate', ({ path, requestedPath }: NavigateMessage) => {
      this.remotePath = path;
      const { hash, pathname, search } = window.location;
      const localPath = `${pathname}${search}${hash}`;
      const normalizedPath = translatePath
        ? translatePath(path, requestedPath)
        : path;
      if (!normalizedPath || normalizedPath === localPath) return;
      history.replaceState(null, '', normalizedPath);
      let popstateEvent: any;
      if (typeof Event === 'function') {
        popstateEvent = new Event('popstate');
      } else {
        popstateEvent = document.createEvent('Event');
        popstateEvent.initEvent('popstate', true, true);
      }
      popstateEvent.state = null;
      dispatchEvent(popstateEvent);
      this.emit('path-updated', {
        remotePath: path,
        requestedPath: requestedPath,
        previousPath: localPath,
        currentPath: normalizedPath
      });
    });
  }

  // Initialize this PairedFrame controller. Emits the "ready" event and begins
  // monitoring the connection and counterpart per the options.
  private init() {
    this.off('ping', this.init);
    this.off('pong', this.init);
    this.heartbeat();
    this.handleDialogs();
    if (this.config.sendHeight) this.sendHeight();
    if (this.config.sendHistory) this.sendHistory();
    if (this.config.autoResize) this.autoResize();
    if (this.config.autoNavigate) this.autoNavigate();
    this.emit('ready');
  }
}

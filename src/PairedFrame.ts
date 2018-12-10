interface PairedFrameOptions {
  autoNavigate  : boolean,
  autoResize    : boolean,
  debug         : boolean,
  providePath   : Function|null,
  resizeElement : HTMLElement|null,
  sendHeight    : boolean,
  sendHistory   : boolean,
  targetOrigin  : string,
  targetWindow  : Window,
  translatePath : Function|null
}

interface CallbackRegistry {
  [propname:string]:Function[]
}

interface DialogRegistry {
  [propname:string]:(result:any)=>void
}

interface ResizeMessage {
  height:number
}

interface NavigateMessage {
  path:string,
  requestedPath:string|null
}

interface DialogOpenedMessage {
  id:string,
  config?:any
}

interface DialogClosedMessage {
  id:string,
  result?:any
}

export default class PairedFrame {
  private config                 : PairedFrameOptions;
  private registry               : CallbackRegistry
  private callbacks              : WeakMap<Function,Function>
  private dialogs                : DialogRegistry
  private hasPendingHeightUpdate : boolean
  private localPath              : string|null
  private localHeight            : number
  private remotePath             : string|null
  private remoteHeight           : number
  private uniqueId               : number
  private boundReceiver          : EventListener
  private pulseId                : number

  constructor({
    autoNavigate = false,
    autoResize = false,
    debug = false,
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
      debug,
      providePath,
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

  public listeners(eventName: string) {
    return (this.registry[eventName] || []).map(cb => this.callbacks.get(cb));
  }

  public listenerCount(eventName: string) {
    return (this.registry[eventName] || []).length;
  }

  public eventNames() {
    return Object.keys(this.registry);
  }

  public on(eventName: string, cb:(data?: Object) => void) {
    const listeners = this.registry[eventName] || [];
    listeners.push(cb);
    this.registry[eventName] = listeners;
    this.callbacks.set(cb, cb);
    return this;
  }

  public once(eventName: string, cb:(data?: Object) => void) {
    const wrapped = (data?: Object) => {
      this.off(eventName, wrapped);
      cb.call(this, data);
    };
    this.callbacks.set(wrapped, cb);
    return this.on(eventName, wrapped);
  }

  public off(eventName: string, cb:(data?: Object) => void) {
    if (!this.registry[eventName]) return this;
    const idx = this.registry[eventName].findIndex(el => el === cb);
    if (idx === -1) return this;
    this.registry[eventName].splice(idx, 1);
    return this;
  }

  public emit(eventName: string, data?: Object) {
    // Grab count first in case callbacks register more listeners
    const count = this.listenerCount(eventName);
    (this.registry[eventName] || []).forEach(cb => cb.call(this, data));
    return Boolean(count);
  }


  /* ------------------------------------------------------------------------ *
   * PostMessages
   * ------------------------------------------------------------------------ */

  public send(eventName: string, data?: Object) {
    const { targetOrigin, targetWindow } = this.config;
    targetWindow.postMessage({ name: eventName, data }, targetOrigin);
    this.debug('postmessage_sent', eventName, data);
    return true;
  }

  private receive({ data: message, origin, source }: MessageEvent) {
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

  public dialog(config?:any) {
    const id = `${location.hostname}:${++this.uniqueId}`;
    this.send('dialog-opened', { id, config });
    return new Promise(resolve => (this.dialogs[id] = resolve));
  }

  public onDialog(cb:(config:any)=>void) {
    this.on('dialog-opened', ({ id, config }: DialogOpenedMessage) => {
      Promise.resolve(cb(config)).then(result =>
        this.send('dialog-closed', { id, result })
      );
    });
  }

  private resolveDialogs() {
    this.on('dialog-closed', ({ id, result }: DialogClosedMessage) => {
      this.dialogs[id](result);
      delete this.dialogs[id];
    });
  }


  /* ------------------------------------------------------------------------ *
   * Synchronization
   * ------------------------------------------------------------------------ */

  private heartbeat() {
    setInterval(() => this.send('heartbeat'), 1000);
    const panic = () => {
      this.emit('connection-lost');
      this.once('heartbeat', () => this.emit('connection-restored'));
    };
    const checkPulse = () => {
      clearTimeout(this.pulseId);
      this.pulseId = window.setTimeout(panic, 2000);
    };
    this.on('heartbeat', checkPulse);
  }

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

  private autoResize() {
    const updateHeight = () => {
      if (this.config.resizeElement && this.localHeight !== this.remoteHeight) {
        this.config.resizeElement.style.height = `${this.remoteHeight}px`;
        this.localHeight = this.remoteHeight;
      }
      requestAnimationFrame(updateHeight);
    };
    this.on('resize', ({ height }: ResizeMessage) => {
      this.remoteHeight = height;
    });
    updateHeight();
  }

  private sendHistory() {
    const { providePath } = this.config;
    const checkPath = () => {
      const path = location.pathname;
      if (path !== this.localPath) {
        const requestedPath = providePath ? providePath(path) : null;
        this.localPath = path;
        this.send('navigate', { path, requestedPath });
      }
      requestAnimationFrame(checkPath);
    };
    checkPath();
  }

  private autoNavigate() {
    const { translatePath } = this.config;
    this.on('navigate', ({ path, requestedPath }: NavigateMessage) => {
      this.remotePath = path;
      const normalizedPath = translatePath ? translatePath(path, requestedPath)
        : path;
      if (!normalizedPath || normalizedPath === location.pathname) return;
      history.replaceState(null, '', normalizedPath);
      let popstateEvent:any;
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

  private onReady(cb:()=>void) {
    const { targetOrigin, targetWindow } = this.config;
    const localReady = new Promise((resolve) => {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', resolve);
      } else {
        resolve();
      }
    });
    const remoteReady = new Promise((resolve) => {
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
            clearInterval(intervalId)
          }
        }, 100);
      }
    });
    Promise.all([ localReady, remoteReady ]).then(cb);
  }

  public debug(action:string, eventName:string, data?:Object) {
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

  public destroy() {
    removeEventListener('message', this.boundReceiver);
  }


  /* ------------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------------ */

  private init() {
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

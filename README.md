PairedFrame
===========

**A cross-frame communication library**

PairedFrame is a utility for when you have no choice but to embed part of your
site in an iframe. It allows you to:

* Avoid scrollbars, clipping, and loading FOUC
* Synchronize SPA navigation
* Proxy modals and toast messages to the parent window
* Send arbitary messages between frames

Iframes impact both security and performance. PairedFrame does what it can to
provide a seamless integration without making these problems worse.


## Tour

Each PairedFrame instance acts as a stand-in for an iframe or parent frame.

```
const parent = new PairedFrame({
  targetWindow: window.parent,
  targetOrigin: 'https://child.loc:3000',
  ...options
});
```

PairedFrame is a Node-style event emitter.

```
parent.once('ready', () => {
  myIframeElement.style.opacity = 1;
});

parent.on('heartbeat', console.log);

parent.emit('some-event-name', someEventData);
```

You can also send arbitrary messages to the counterpart frame, which will be
emitted as events there.

```
parent.send('some-event-name', someEventData);
```

The class includes some low-level, promise-based methods to proxy interactive
experiences (such as modal windows) from a child frame to a parent frame.

```
const confirmed = await parent.dialog({ type: 'modal', text: 'Are you sure?' });
```


## Options

The PairedFrame constructor accepts a dictionary of options:

### targetOrigin

_Required_

The origin of the frame being targeted, including protocol, hostname, and port
(if different than the default expected for the protocol). Only messages
hailing from a counterpart at this origin will be trusted.

### targetWindow

_Required_

A reference to the counterpart's window. When connecting from a host frame to
an iframe, this is the iframe element's `contentWindow`. When connecting from
an iframe to its host, this is `window.parent`.

### sendHeight

Boolean. If true, the local scrollHeight will be monitored and broadcast to the
counterpart. This should be enabled for the **child** frame to enable automatic
height syncing.

### autoResize

Boolean. If true, the height of `resizeElement` will be automatically updated
to match the scrollHeight of the counterpart frame. This should be enabled for
the **parent** frame to enable automatic height syncing.

### resizeElement

_Required if autoResize is true_

A reference to the element that should be resized to match the counterpart's
scrollHeight. For best performance, this should be a wrapper div around the
iframe with overflow set to "hidden". The iframe itself should have a static
height large enough to accommodate the maximum height of its content.

If your iframe's maximum content height is not predictable (for example, if it
has infinitely scrolling content), you can also pass a reference to the iframe
element itself. This will work, but may degrade performance during animations.

### sendHistory

Boolean. If true, the local pathname will be monitored and broadcast to the
counterpart. This should be enabled for **both** frames to enable automatic
navigation syncing.

### autoNavigate

Boolean. If true, the local pathname will be automatically updated (using
history.replaceState) in response to pathname changes in the counterpart. Then
a synthetic `popstate` event (which typically represents browser navigation) is
fired to trigger any active routing library to examine the new pathname and, if
necessary, render a new state.

### translatePath

`(remotePath, requestedPath) => localPath`

Function. If provided, will be used to convert the counterpart's new pathname
into the equivalent local pathname. This allows the parent and child frames to
have uniquely named routes that can still be mapped to each other.

### providePath

`(localPath) => remotePath`

Function. If provided, will be used to translate new local pathnames into the
`requestedPath` argument that will be fed to the counterpart's translatePath.
The counterpart may optionally defer to `requestedPath` rather than deriving a
path from `remotePath`. This allows one frame to manage route syncing for both
frames.


## Methods

### dialog(config)

Notifies the counterpart to initiate some kind of interactive dialog. Returns a
promise that will be resolved with the result of that dialog.

PairedFrame only manages communication of the dialog state; it is up to the
user to implement the actual modal, toast message, etc. To that end, `config`
can be structured however you like.

### onDialog(callback)

A special handler for accepting and responding to dialog requests. `callback`
will receive the dialog `config` as its first argument and should return a
promise that resolves with the result of the interaction. Returns the
PairedFrame instance for chaining.

### on(eventName, callback)

Registers a callback to fire for the given event. Returns the PairedFrame
instance for chaining.

### once(eventName, callback)

Registers a callback to fire once for the given event, then deregister itself.
Returns the PairedFrame instance for chaining.

### off(eventName, callback)

Deregisters a callback for the given event. Returns the PairedFrame instance
for chaining.

### emit(eventName, data)

Emits an event in the local frame, firing any registered callbacks. Returns the
number of callbacks that were fired in response.

### send(eventName, data)

Emits an event in the counterpart frame, firing any registered callbacks. This
can be used to send arbitrary messages between frames. Returns `true`.

### eventNames()

Returns an array of all event names that currently have registered callbacks.

### listeners(eventName)

Returns an array of callbacks currently registered for the given event.

### listenerCount(eventName)

Returns the number of callbacks currently registered for the given event.

### destroy()

Removes the postMessage listener. Any callbacks attached to the "destroy" event
will be fired, after which no callbacks will be fired or postMessages sent.


## Built-in events

* `load`: Indicates that both frames have loaded, but the connection has not yet been set up.
* `ping`: Indicates that the counterpart wishes to establish a connection.
* `pong`: Indicates that the counterpart has approved the connection.
* `ready`: Indicates that both frames are ready to communicate.
* `postmessage-sent`: Indicates that a postMessage has been sent to the counterpart.
* `postmessage-received`: Indicates that a postMessage has been received from the counterpart.
* `resize`: Indicates that the counterpart's scrollHeight has changed.
* `height-updated`: Indicates that the local frame's height has been auto-updated in response to a `resize` event.
* `navigate`: Indicates that the counterpart's pathname has changed.
* `path-updated`: Indicates that the local frame's path has been auto-updated in response to a `navigate` event.
* `dialog-opened`: Indicates that a dialog has been requested (by either frame).
* `dialog-closed`: Indicates that a dialog has been resolved (by either frame).
* `heartbeat`: Sent every 250ms by each frame to monitor connection.
* `connection-lost`: Indicates that 500ms have passed without a counterpart heartbeat event.
* `connection-restored`: Indicates that a counterpart heartbeat event has been received following a lost connection.
* `destroy`: Fired just before the instance removes its postMessage handler and stops sending or responding to events.
* `*`: All events. Can be used for logging.


## Running the demo

1. Add parent.loc and child.loc to /etc/hosts pointing at 127.0.0.1
1. Run `yarn demo`
1. Navigate to http://parent.loc:3000 in your browser



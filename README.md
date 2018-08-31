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

You can also send arbitrary messages to your counterpart, which will be emitted
as events there.

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

**Required.** The origin of the frame being targeted, including protocol,
hostname, and port (if different than the default expected for the protocol).
Only messages hailing from a counterpart at this origin will be trusted.

### targetWindow

**Required.** A reference to the counterpart's window. When connecting from a
host frame to an iframe, this is the iframe element's `contentWindow`. When
connecting from an iframe to its host, this is `window.parent`.

### sendHeight

Boolean. If true, the local scrollHeight will be monitored and broadcast to the
counterpart. This should be enabled for the **child** frame to enable automatic
height syncing.

### autoResize

Boolean. If true, the height of `resizeElement` will be automatically updated
to match the scrollHeight of the counterpart frame. This should be enabled for
the **parent** frame to enable automatic height syncing.

### resizeElement

**Required if autoResize is true.** A reference to the element that should be
resized to match the counterpart's scrollHeight. For best performance, this
should be a wrapper div around the iframe with overflow set to "hidden". The
iframe itself should have a static height large enough to accommodate the
maximum height of its content.

If your iframe's maximum content height is not predictable (for example, if it
has infinitely scrolling content), you can also pass a reference to the iframe
element itself. This will work, but may degrade performance during animations
as the browser needs to layout the content of the entire iframe whenever its
scrollHeight changes.

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

### mapPath

Function. If provided, will be used to translate the counterpart's new pathname
into the equivalent local pathname. This allows the parent and child frames to
have uniquely named routes that can still be mapped to each other.

### debug

Boolean. If true, logs debug messages to the console whenever a postMessage is
sent or received.


## Methods

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

### dialog(config)

Notifies the counterpart to initiate some kind of interactive dialog. Returns a
promise that will be resolved with the result of that dialog.

PairedFrame only manages communication of the dialog state; it is up to the
user to implement the actual modal, toast message, etc. To that end, `config`
can be structured however you like.

### onDialog(callback)

A special handler for accepting and responding to dialog requests. `callback`
will receive the dialog `config` as its first argument and should return a
promise that resolves with the result of the interaction.


## Built-in events

* **ping:** Used to set up initial connection.
* **ready:** Indicates that the counterpart is ready to communicate.
* **heartbeat:** Sent every second by each frame.
* **resize:** Indicates the counterpart's scrollHeight has changed.
* **navigate:** Indicates the counterpart's pathname has changed.
* **dialog-opened:** Indicates that the counterpart wishes to open a dialog.
* **dialog-closed:** Indicates that the counterpart has resolved a dialog.


## Running the demo

1. Add parent.loc and child.loc to /etc/hosts pointing at 127.0.0.1
1. Run `yarn demo`
1. Navigate to http://parent.loc:3000 in your browser



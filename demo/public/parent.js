(function () {
  'use strict';

  function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
    try {
      var info = gen[key](arg);
      var value = info.value;
    } catch (error) {
      reject(error);
      return;
    }

    if (info.done) {
      resolve(value);
    } else {
      Promise.resolve(value).then(_next, _throw);
    }
  }

  function _asyncToGenerator(fn) {
    return function () {
      var self = this,
          args = arguments;
      return new Promise(function (resolve, reject) {
        var gen = fn.apply(self, args);

        function _next(value) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
        }

        function _throw(err) {
          asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
        }

        _next(undefined);
      });
    };
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  var CurrentUrl = function CurrentUrl() {
    return React.createElement("strong", {
      id: "current-url"
    }, window.location.href);
  };

  var _ReactRouterDOM = ReactRouterDOM,
      BrowserRouter = _ReactRouterDOM.BrowserRouter,
      Link = _ReactRouterDOM.Link,
      Route = _ReactRouterDOM.Route,
      Switch = _ReactRouterDOM.Switch;

  var App =
  /*#__PURE__*/
  function (_React$Component) {
    _inherits(App, _React$Component);

    function App(props) {
      var _this;

      _classCallCheck(this, App);

      _this = _possibleConstructorReturn(this, _getPrototypeOf(App).call(this, props));
      _this.state = {
        borderColor: 'transparent',
        iframeOpacity: 0,
        modalDisplay: 'none',
        modalClass: '',
        modalTitle: 'Default title',
        modalBody: 'Default body',
        modalButtons: [{
          type: 'primary',
          text: 'Primary',
          value: true
        }, {
          type: 'secondary',
          text: 'Secondary',
          value: true
        }, {
          type: 'delete',
          text: 'Delete',
          value: true
        }]
      };
      _this.iframe = React.createRef();
      _this.iframeWrapper = React.createRef();
      _this.resolveCurrentModal = null;
      return _this;
    }

    _createClass(App, [{
      key: "toggleBorder",
      value: function toggleBorder() {
        this.setState(function (prevState) {
          return {
            borderColor: prevState.borderColor === 'blue' ? 'transparent' : 'blue'
          };
        });
      }
    }, {
      key: "showIframe",
      value: function showIframe() {
        this.setState({
          iframeOpacity: 1
        });
      }
    }, {
      key: "openModal",
      value: function openModal(_ref) {
        var _this2 = this;

        var title = _ref.title,
            body = _ref.body,
            buttons = _ref.buttons;
        this.setState({
          modalDisplay: 'block',
          modalTitle: title,
          modalBody: body,
          modalButtons: buttons
        });
        return new Promise(function (resolve) {
          _this2.resolveCurrentModal = resolve;
        });
      }
    }, {
      key: "modalResponse",
      value: function modalResponse(result) {
        this.setState({
          modalDisplay: 'none'
        });
        this.resolveCurrentModal(result);
      }
    }, {
      key: "componentDidMount",
      value: function () {
        var _componentDidMount = _asyncToGenerator(
        /*#__PURE__*/
        regeneratorRuntime.mark(function _callee() {
          var childPath;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  childPath = location.pathname.replace(/parent/g, 'child');
                  this.iframe.current.src = "http://child.loc:3000".concat(childPath);
                  this.childFrame = new PairedFrame({
                    autoNavigate: true,
                    autoResize: true,
                    debug: true,
                    providePath: function providePath(localPath) {
                      return localPath.replace(/parent/g, 'child');
                    },
                    resizeElement: this.iframeWrapper.current,
                    sendHistory: true,
                    targetIframe: this.iframe.current,
                    targetOrigin: 'http://child.loc:3000',
                    targetWindow: this.iframe.current.contentWindow,
                    translatePath: function translatePath(remotePath) {
                      return remotePath.replace(/child/g, 'parent');
                    }
                  });
                  this.childFrame.once('ready', this.showIframe.bind(this));
                  this.childFrame.onDialog(this.openModal.bind(this));

                case 5:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        return function componentDidMount() {
          return _componentDidMount.apply(this, arguments);
        };
      }()
    }, {
      key: "render",
      value: function render() {
        var _this3 = this;

        return React.createElement(BrowserRouter, null, React.createElement("div", null, React.createElement("div", {
          class: "container"
        }, React.createElement("h1", {
          class: "title"
        }, "PairedFrame.js"), React.createElement("div", {
          class: "grid"
        }, React.createElement("div", {
          class: "sidebar"
        }, React.createElement("h2", null, "Parent Frame"), React.createElement("div", {
          class: "route-info"
        }, React.createElement("span", {
          class: "route-label"
        }, "window.location.href:"), React.createElement(CurrentUrl, null), React.createElement("br", null), React.createElement("br", null), React.createElement("span", {
          class: "route-label"
        }, "Route Demo (Switch component):"), React.createElement("div", {
          class: "route-view"
        }, React.createElement(Switch, null, React.createElement(Route, {
          path: "/parent-2/parent-c",
          render: function render() {
            return React.createElement("strong", null, "Parent 2.C");
          }
        }), React.createElement(Route, {
          path: "/parent-2/parent-b",
          render: function render() {
            return React.createElement("strong", null, "Parent 2.B");
          }
        }), React.createElement(Route, {
          path: "/parent-2/parent-a",
          render: function render() {
            return React.createElement("strong", null, "Parent 2.A");
          }
        }), React.createElement(Route, {
          path: "/parent-2",
          render: function render() {
            return React.createElement("strong", null, "Parent 2");
          }
        }), React.createElement(Route, {
          path: "/parent-1",
          render: function render() {
            return React.createElement("strong", null, "Parent 1");
          }
        }), React.createElement(Route, {
          path: "/",
          render: function render() {
            return React.createElement("strong", null, "Parent Home");
          }
        })))), React.createElement("p", null, "Hi. I am the parent frame."), React.createElement("p", null, "I use ", React.createElement("strong", null, "React"), " and ", React.createElement("strong", null, "React Router 4.")), React.createElement("nav", null, React.createElement(Link, {
          to: {
            pathname: '/'
          }
        }, "\uD83C\uDFE0"), "\xA0", React.createElement(Link, {
          to: {
            pathname: '/parent-1'
          }
        }, "1"), "\xA0", React.createElement(Link, {
          to: {
            pathname: '/parent-2'
          }
        }, "2"), "\xA0", React.createElement(Link, {
          to: {
            pathname: '/parent-2/parent-a'
          }
        }, "2.A"), "\xA0", React.createElement(Link, {
          to: {
            pathname: '/parent-2/parent-b'
          }
        }, "2.B"), "\xA0", React.createElement(Link, {
          to: {
            pathname: '/parent-2/parent-c'
          }
        }, "2.C")), React.createElement("p", null, "Parent and child routes are synced, even though each route is expressed with a different path (and rendered using a different library) in each frame. You can also navigate using the browser back and forward buttons."), React.createElement("label", {
          class: "control"
        }, React.createElement("input", {
          type: "checkbox",
          onClick: this.toggleBorder.bind(this)
        }), "Show iframe container")), React.createElement("main", {
          class: "main"
        }, React.createElement("div", {
          class: "iframe-wrapper",
          style: {
            borderColor: this.state.borderColor
          },
          ref: this.iframeWrapper
        }, React.createElement("iframe", {
          class: "iframe",
          style: {
            opacity: this.state.iframeOpacity
          },
          ref: this.iframe
        }))))), React.createElement("div", {
          class: "modal",
          style: {
            display: this.state.modalDisplay
          }
        }, React.createElement("div", {
          class: "modal-overlay"
        }), React.createElement("div", {
          class: "modal-grid"
        }, React.createElement("div", {
          class: "modal-frame"
        }, React.createElement("button", {
          type: "button",
          class: "modal-close",
          onClick: function onClick(e) {
            return _this3.modalResponse(false);
          }
        }, "\u2715"), React.createElement("h3", null, this.state.modalTitle), React.createElement("p", null, this.state.modalBody), React.createElement("div", {
          class: "modal-buttons"
        }, this.state.modalButtons.map(function (_ref2) {
          var type = _ref2.type,
              text = _ref2.text,
              value = _ref2.value;
          return React.createElement("button", {
            type: "button",
            className: "button-".concat(type),
            onClick: function onClick(e) {
              return _this3.modalResponse(value);
            }
          }, text);
        })))))));
      }
    }]);

    return App;
  }(React.Component);

  ReactDOM.render(React.createElement(App, null), document.getElementById('root'));

}());

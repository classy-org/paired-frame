'use strict';

const CurrentUrl = () => (
  <strong id="current-url">{window.location.href}</strong>
);

const { BrowserRouter, Link, Route, Switch } = ReactRouterDOM;

class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
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
    this.iframe = React.createRef();
    this.iframeWrapper = React.createRef();
    this.resolveCurrentModal = null;
  }

  toggleBorder () {
    this.setState((prevState) => ({
      borderColor: prevState.borderColor === 'blue' ? 'transparent' : 'blue'
    }));
  }

  showIframe () {
    this.setState({
      iframeOpacity: 1
    });
  }

  openModal ({ title, body, buttons }) {
    this.setState({
      modalDisplay: 'block',
      modalTitle: title,
      modalBody: body,
      modalButtons: buttons
    });
    return new Promise(resolve => {
      this.resolveCurrentModal = resolve;
    });
  }

  modalResponse (result) {
    this.setState({
      modalDisplay: 'none'
    });
    this.resolveCurrentModal(result);
  }

  async componentDidMount () {
    const childPath = location.pathname.replace(/parent/g, 'child');
    this.iframe.current.src = `http://child.loc:3000${childPath}`;
    this.childFrame = new PairedFrame({
      autoNavigate: true,
      autoResize: true,
      debug: true,
      resizeElement: this.iframeWrapper.current,
      sendHistory: true,
      targetIframe: this.iframe.current,
      targetOrigin: 'http://child.loc:3000',
      targetWindow: this.iframe.current.contentWindow,
      translatePath: p => p.replace(/child/g, 'parent')
    });
    this.childFrame.once('ready', this.showIframe.bind(this));
    this.childFrame.onDialog(this.openModal.bind(this));
  }

  render () {
    return (
      <BrowserRouter>
        <div>
          <div class="container">

            <h1 class="title">PairedFrame.js</h1>

            <div class="grid">

              <div class="sidebar">

                <h2>Parent Frame</h2>

                <div class="route-info">
                  <span class="route-label">window.location.href:</span>
                  <CurrentUrl />
                  <br /><br />
                  <span class="route-label">Route Demo (Switch component):</span>
                  <div class="route-view">
                    <Switch>
                      <Route path='/parent-2/parent-c' render={() => <strong>Parent 2.C</strong>}></Route>
                      <Route path='/parent-2/parent-b' render={() => <strong>Parent 2.B</strong>}></Route>
                      <Route path='/parent-2/parent-a' render={() => <strong>Parent 2.A</strong>}></Route>
                      <Route path='/parent-2' render={() => <strong>Parent 2</strong>}></Route>
                      <Route path='/parent-1' render={() => <strong>Parent 1</strong>}></Route>
                      <Route path='/' render={() => <strong>Parent Home</strong>}></Route>
                    </Switch>
                  </div>
                </div>

                <p>Hi. I am the parent frame.</p>
                <p>I use <strong>React</strong> and <strong>React Router 4.</strong></p>

                <nav>
                  <Link to={{ pathname: '/' }}>🏠</Link>&nbsp;
                  <Link to={{ pathname: '/parent-1' }}>1</Link>&nbsp;
                  <Link to={{ pathname: '/parent-2' }}>2</Link>&nbsp;
                  <Link to={{ pathname: '/parent-2/parent-a' }}>2.A</Link>&nbsp;
                  <Link to={{ pathname: '/parent-2/parent-b' }}>2.B</Link>&nbsp;
                  <Link to={{ pathname: '/parent-2/parent-c' }}>2.C</Link>
                </nav>

                <p>
                  Parent and child routes are synced, even though each route is
                  expressed with a different path (and rendered using a
                  different library) in each frame. You can also navigate using
                  the browser back and forward buttons.
                </p>

                <label class="control">
                  <input type="checkbox" onClick={this.toggleBorder.bind(this)} />
                  Show iframe container
                </label>

              </div>

              <main class="main">
                <div class="iframe-wrapper" style={{ borderColor: this.state.borderColor }} ref={this.iframeWrapper}>
                  <iframe class="iframe" style={{ opacity: this.state.iframeOpacity }} ref={this.iframe}></iframe>
                </div>
              </main>

            </div>
          </div>

          <div class="modal" style={{ display: this.state.modalDisplay }}>
            <div class="modal-overlay"></div>
            <div class="modal-grid">
              <div class="modal-frame">
                <button type="button" class="modal-close" onClick={(e) => this.modalResponse(false)}>✕</button>
                <h3>{this.state.modalTitle}</h3>
                <p>{this.state.modalBody}</p>
                <div class="modal-buttons">
                  {this.state.modalButtons.map(({ type, text, value }) => (
                    <button type="button" className={`button-${type}`} onClick={(e) => this.modalResponse(value)}>{text}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </BrowserRouter>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));


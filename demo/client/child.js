'use strict';

angular

  // Init
  .module('pfp', ['ui.router'])

  // Routes
  .config(function(
    $locationProvider,
    $stateProvider
  ) {

    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });

    $stateProvider
      .state('root', {
        url: '',
        component: 'viewRoot',
        resolve: {
          parentFrame: function ($rootScope) {
            $rootScope.parentFrame = new PairedFrame({
              autoNavigate: true,
              sendHeight: true,
              sendHistory: true,
              targetOrigin: 'http://parent.loc:3000',
              targetWindow: window.parent,
              translatePath: p => p.replace(/parent/g, 'child')
            });
          }
        }
      })
      .state('root.home', {
        url: '/',
        views: {
          'route@root': {
            template: '<strong>Child Home</strong>'
          }
        }
      })
      .state('root.1', {
        url: '/child-1',
        views: {
          'content@root': 'view1',
          'route@root': {
            template: '<strong>Child 1</strong>'
          }
        }
      })
      .state('root.2', {
        url: '/child-2',
        views: {
          'content@root': 'view2',
          'route@root': {
            template: '<strong>Child 2</strong>'
          }
        }
      })
      .state('root.2.a', {
        url: '/child-a',
        views: {
          'content@root.2': 'view2A',
          'route@root': {
            template: '<strong>Child 2.A</strong>'
          }
        }
      })
      .state('root.2.b', {
        url: '/child-b',
        views: {
          'content@root.2': 'view2B',
          'route@root': {
            template: '<strong>Child 2.B</strong>'
          }
        }
      })
      .state('root.2.c', {
        url: '/child-c',
        views: {
          'content@root.2': 'view2C',
          'route@root': {
            template: '<strong>Child 2.C</strong>'
          }
        }
      });
  })

  // Views
  .component('viewRoot', {
    template: `
      <h2>Child Frame</h2>

      <div class="route-info">
        <span class="route-label">window.location.href:</span>
        <strong>{{ $ctrl.currentUrl }}</strong>
        <br /><br />
        <span class="route-label">Route Demo (UI-View):</span>
        <div class="route-view" ui-view="route"></div>
      </div>

      <p>Hi. I am the child frame.</p>
      <p>I use <strong>AngularJS</strong> and <strong>UI Router.</strong></p>

      <nav>
        <a ui-sref="root">🏠</a>
        <a ui-sref="root.1">1</a>
        <a ui-sref="root.2">2</a>
        <a ui-sref="root.2.a">2.A</a>
        <a ui-sref="root.2.b">2.B</a>
        <a ui-sref="root.2.c">2.C</a>
      </nav>

      <div ui-view="content"></div>
    `,
    controller: function ($scope) {
      $scope.$watch(() => location.href.replace(/\?.*$/g, ''), (newVal) => {
        this.currentUrl = newVal;
      });
    }
  })
  .component('view1', {
    template: `
      <h2>View 1</h2>

      <p>Toggle the accordions below to test iframe resizing.</p>

      <accordion></accordion>

      <div class="redbox">
        <p>
          I am a footer at the very bottom of the (static) embedded content. My
          bottom border should be visible at all times (not clipped by the iframe
          boundary).
        </p>
      </div>

      <div class="redbox abs">
        <p>
          I am an absolutely positioned div. Height calculations must reflect my
          position on the page! My bottom border should be visible at all times (not
          clipped by the iframe boundary).
        <p>
      </div>
    `
  })
  .component('view2', {
    template: `
      <h2>View 2</h2>

      <p>Hi. I am the second page of child content.</p>

      <div ui-view="content">
        <h3>Subview default</h3>
        <p>
          Welcome! Credibly innovate granular internal or "organic" sources whereas high
          standards in web-readiness. Energistically scale future-proof core
          competencies vis-a-vis impactful experiences. Dramatically synthesize
          integrated schemas with optimal networks.
        </p>
      </div>
    `
  })
  .component('view2A', {
    template: `
      <h3>Subview A</h3>
      <p>
        Interactively procrastinate high-payoff content without
        backward-compatible data. Quickly cultivate optimal processes and
        tactical architectures. Completely iterate covalent strategic theme
        areas via accurate e-markets.
      </p>
      <button type="button" class="generic-button" ng-click="$ctrl.launchModal('confirmModal')">Launch Confirm Modal</button>
    `,
    controller: function ($scope, modalService) {
      this.launchModal = modalService.launchModal;
    }
  })
  .component('view2B', {
    template: `
      <h3>Subview B</h3>
      <p>
        Globally incubate standards compliant channels before scalable benefits.
        Quickly disseminate superior deliverables whereas web-enabled
        applications. Quickly drive clicks-and-mortar catalysts for change
        before vertical architectures.
      </p>
      <button type="button" class="generic-button" ng-click="$ctrl.launchModal('deleteModal')">Launch Delete Modal</button>
    `,
    controller: function ($scope, modalService) {
      this.launchModal = modalService.launchModal;
    }
  })
  .component('view2C', {
    template: `
      <h3>Subview C</h3>
      <p>
        Reintermediate backend ideas for cross-platform models. Continually
        infer integrated processes through technically sound intellectual
        capital. Holistically foster superior methodologies without
        market-driven best practices.
      </p>
    `
  })

  // Others
  .service('modalService', function ($state, $rootScope) {

    this.modalConfig = {
      confirmModal: {
        title: 'Confirmation needed',
        body: "Do you want to navigate to subview B?",
        buttons: [{
          type: 'secondary',
          text: 'Cancel',
          value: false
        }, {
          type: 'primary',
          text: 'Confirm',
          value: true
        }],
        cb: (result) => {
          if (!result) return;
          $state.go('root.2.b');
        }
      },
      deleteModal: {
        title: 'Confirmation needed',
        body: 'Do you really want to delete the production database?',
        buttons: [{
          type: 'secondary',
          text: 'Er ...',
          value: false
        }, {
          type: 'delete',
          text: 'Let the past die',
          value: true
        }],
        cb: (result) => {
          if (!result) return;
          this.launchModal('infoModal');
        }
      },
      infoModal: {
        title: "I'm sorry, Dave. I'm afraid I can't do that.",
        body: "This mission is too important to allow you to jeopardize it.",
        buttons: [{
          type: 'primary',
          text: 'OK',
          value: true
        }],
        cb: () => {}
      }
    };

    this.launchModal = (which) => {
      const { title, body, buttons, cb } = this.modalConfig[which];
      return $rootScope.parentFrame.dialog({ title, body, buttons }).then(cb);
    };
  })
  .component('accordion', {
    template: `
      <div>

        <div class="accordion-title" ng-click="$ctrl.show1 = !$ctrl.show1">
          ▶ Phosfluorescently engage worldwide methodologies with web-enabled
          technology.
        </div>
        <div class="accordion-body" ng-class="{ collapsed: !$ctrl.show1 }">
          <p>
            Leverage agile frameworks to provide a robust synopsis for high level
            overviews. Iterative approaches to corporate strategy foster collaborative
            thinking to further the overall value proposition. Organically grow the
            holistic world view of disruptive innovation via workplace diversity and
            empowerment.
          </p>
          <p>
            Bring to the table win-win survival strategies to ensure proactive
            domination. At the end of the day, going forward, a new normal that has
            evolved from generation X is on the runway heading towards a streamlined
            cloud solution. User generated content in real-time will have multiple
            touchpoints for offshoring.
          </p>
          <p>
            Capitalize on low hanging fruit to identify a ballpark value added
            activity to beta test. Override the digital divide with additional
            clickthroughs from DevOps. Nanotechnology immersion along the information
            highway will close the loop on focusing solely on the bottom line.
          </p>
        </div>

        <div class="accordion-title" ng-click="$ctrl.show2 = !$ctrl.show2">
          ▶ Interactively coordinate proactive e-commerce via process-centric "outside
          the box" thinking.
        </div>
        <div class="accordion-body" ng-class="{ collapsed: !$ctrl.show2 }">
          <p>
            Podcasting operational change management inside of workflows to establish
            a framework. Taking seamless key performance indicators offline to
            maximise the long tail. Keeping your eye on the ball while performing a
            deep dive on the start-up mentality to derive convergence on
            cross-platform integration.
          </p>
          <p>
            Collaboratively administrate empowered markets via plug-and-play networks.
            Dynamically procrastinate B2C users after installed base benefits.
            Dramatically visualize customer directed convergence without revolutionary
            ROI.
          </p>
          <p>
            Efficiently unleash cross-media information without cross-media value.
            Quickly maximize timely deliverables for real-time schemas. Dramatically
            maintain clicks-and-mortar solutions without functional solutions.
          </p>
        </div>

        <div class="accordion-title" ng-click="$ctrl.show3 = !$ctrl.show3">
          ▶ Completely pursue scalable customer service through sustainable
          potentialities.
        </div>
        <div class="accordion-body" ng-class="{ collapsed: !$ctrl.show3 }">
          <p>
            Completely synergize resource taxing relationships via premier niche
            markets. Professionally cultivate one-to-one customer service with robust
            ideas. Dynamically innovate resource-leveling customer service for state
            of the art customer service.
          </p>
          <p>
            Objectively innovate empowered manufactured products whereas parallel
            platforms. Holisticly predominate extensible testing procedures for
            reliable supply chains. Dramatically engage top-line web services
            vis-a-vis cutting-edge deliverables.
          </p>
          <p>
            Proactively envisioned multimedia based expertise and cross-media growth
            strategies. Seamlessly visualize quality intellectual capital without
            superior collaboration and idea-sharing. Holistically pontificate
            installed base portals after maintainable products.
          </p>
        </div>
      </div>
    `
  });




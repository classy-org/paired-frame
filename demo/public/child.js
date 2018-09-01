(function () {
  'use strict';

  angular // Init
  .module('pfp', ['ui.router']) // Routes
  .config(function ($locationProvider, $stateProvider) {
    $locationProvider.html5Mode({
      enabled: true,
      requireBase: false
    });
    $stateProvider.state('root', {
      url: '',
      component: 'viewRoot',
      resolve: {
        parentFrame: function parentFrame($rootScope) {
          $rootScope.parentFrame = new PairedFrame({
            mapPath: function mapPath(p) {
              return p.replace(/parent/g, 'child');
            },
            sendHistory: true,
            autoNavigate: true,
            sendHeight: true,
            targetWindow: window.parent,
            targetOrigin: 'http://parent.loc:3000'
          });
        }
      }
    }).state('root.home', {
      url: '/',
      views: {
        'route@root': {
          template: '<strong>Child Home</strong>'
        }
      }
    }).state('root.1', {
      url: '/child-1',
      views: {
        'content@root': 'view1',
        'route@root': {
          template: '<strong>Child 1</strong>'
        }
      }
    }).state('root.2', {
      url: '/child-2',
      views: {
        'content@root': 'view2',
        'route@root': {
          template: '<strong>Child 2</strong>'
        }
      }
    }).state('root.2.a', {
      url: '/child-a',
      views: {
        'content@root.2': 'view2A',
        'route@root': {
          template: '<strong>Child 2.A</strong>'
        }
      }
    }).state('root.2.b', {
      url: '/child-b',
      views: {
        'content@root.2': 'view2B',
        'route@root': {
          template: '<strong>Child 2.B</strong>'
        }
      }
    }).state('root.2.c', {
      url: '/child-c',
      views: {
        'content@root.2': 'view2C',
        'route@root': {
          template: '<strong>Child 2.C</strong>'
        }
      }
    });
  }) // Views
  .component('viewRoot', {
    template: "\n      <h2>Child Frame</h2>\n\n      <div class=\"route-info\">\n        <span class=\"route-label\">window.location.href:</span>\n        <strong>{{ $ctrl.currentUrl }}</strong>\n        <br /><br />\n        <span class=\"route-label\">Route Demo (UI-View):</span>\n        <div class=\"route-view\" ui-view=\"route\"></div>\n      </div>\n\n      <p>Hi. I am the child frame.</p>\n      <p>I use <strong>AngularJS</strong> and <strong>UI Router.</strong></p>\n\n      <nav>\n        <a ui-sref=\"root\">\uD83C\uDFE0</a>\n        <a ui-sref=\"root.1\">1</a>\n        <a ui-sref=\"root.2\">2</a>\n        <a ui-sref=\"root.2.a\">2.A</a>\n        <a ui-sref=\"root.2.b\">2.B</a>\n        <a ui-sref=\"root.2.c\">2.C</a>\n      </nav>\n\n      <div ui-view=\"content\"></div>\n    ",
    controller: function controller($scope) {
      var _this = this;

      $scope.$watch(function () {
        return location.href.replace(/\?.*$/g, '');
      }, function (newVal) {
        _this.currentUrl = newVal;
      });
    }
  }).component('view1', {
    template: "\n      <h2>View 1</h2>\n\n      <p>Toggle the accordions below to test iframe resizing.</p>\n\n      <accordion></accordion>\n\n      <div class=\"redbox\">\n        <p>\n          I am a footer at the very bottom of the (static) embedded content. My\n          bottom border should be visible at all times (not clipped by the iframe\n          boundary).\n        </p>\n      </div>\n\n      <div class=\"redbox abs\">\n        <p>\n          I am an absolutely positioned div. Height calculations must reflect my\n          position on the page! My bottom border should be visible at all times (not\n          clipped by the iframe boundary).\n        <p>\n      </div>\n    "
  }).component('view2', {
    template: "\n      <h2>View 2</h2>\n\n      <p>Hi. I am the second page of child content.</p>\n\n      <div ui-view=\"content\">\n        <h3>Subview default</h3>\n        <p>\n          Welcome! Credibly innovate granular internal or \"organic\" sources whereas high\n          standards in web-readiness. Energistically scale future-proof core\n          competencies vis-a-vis impactful experiences. Dramatically synthesize\n          integrated schemas with optimal networks.\n        </p>\n      </div>\n    "
  }).component('view2A', {
    template: "\n      <h3>Subview A</h3>\n      <p>\n        Interactively procrastinate high-payoff content without\n        backward-compatible data. Quickly cultivate optimal processes and\n        tactical architectures. Completely iterate covalent strategic theme\n        areas via accurate e-markets.\n      </p>\n      <button type=\"button\" class=\"generic-button\" ng-click=\"$ctrl.launchModal('confirmModal')\">Launch Confirm Modal</button>\n    ",
    controller: function controller($scope, modalService) {
      this.launchModal = modalService.launchModal;
    }
  }).component('view2B', {
    template: "\n      <h3>Subview B</h3>\n      <p>\n        Globally incubate standards compliant channels before scalable benefits.\n        Quickly disseminate superior deliverables whereas web-enabled\n        applications. Quickly drive clicks-and-mortar catalysts for change\n        before vertical architectures.\n      </p>\n      <button type=\"button\" class=\"generic-button\" ng-click=\"$ctrl.launchModal('deleteModal')\">Launch Delete Modal</button>\n    ",
    controller: function controller($scope, modalService) {
      this.launchModal = modalService.launchModal;
    }
  }).component('view2C', {
    template: "\n      <h3>Subview C</h3>\n      <p>\n        Reintermediate backend ideas for cross-platform models. Continually\n        infer integrated processes through technically sound intellectual\n        capital. Holistically foster superior methodologies without\n        market-driven best practices.\n      </p>\n    "
  }) // Others
  .service('modalService', function ($state, $rootScope) {
    var _this2 = this;

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
        cb: function cb(result) {
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
        cb: function cb(result) {
          if (!result) return;

          _this2.launchModal('infoModal');
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
        cb: function cb() {}
      }
    };

    this.launchModal = function (which) {
      var _this2$modalConfig$wh = _this2.modalConfig[which],
          title = _this2$modalConfig$wh.title,
          body = _this2$modalConfig$wh.body,
          buttons = _this2$modalConfig$wh.buttons,
          cb = _this2$modalConfig$wh.cb;
      return $rootScope.parentFrame.dialog({
        title: title,
        body: body,
        buttons: buttons
      }).then(cb);
    };
  }).component('accordion', {
    template: "\n      <div>\n\n        <div class=\"accordion-title\" ng-click=\"$ctrl.show1 = !$ctrl.show1\">\n          \u25B6 Phosfluorescently engage worldwide methodologies with web-enabled\n          technology.\n        </div>\n        <div class=\"accordion-body\" ng-class=\"{ collapsed: !$ctrl.show1 }\">\n          <p>\n            Leverage agile frameworks to provide a robust synopsis for high level\n            overviews. Iterative approaches to corporate strategy foster collaborative\n            thinking to further the overall value proposition. Organically grow the\n            holistic world view of disruptive innovation via workplace diversity and\n            empowerment.\n          </p>\n          <p>\n            Bring to the table win-win survival strategies to ensure proactive\n            domination. At the end of the day, going forward, a new normal that has\n            evolved from generation X is on the runway heading towards a streamlined\n            cloud solution. User generated content in real-time will have multiple\n            touchpoints for offshoring.\n          </p>\n          <p>\n            Capitalize on low hanging fruit to identify a ballpark value added\n            activity to beta test. Override the digital divide with additional\n            clickthroughs from DevOps. Nanotechnology immersion along the information\n            highway will close the loop on focusing solely on the bottom line.\n          </p>\n        </div>\n\n        <div class=\"accordion-title\" ng-click=\"$ctrl.show2 = !$ctrl.show2\">\n          \u25B6 Interactively coordinate proactive e-commerce via process-centric \"outside\n          the box\" thinking.\n        </div>\n        <div class=\"accordion-body\" ng-class=\"{ collapsed: !$ctrl.show2 }\">\n          <p>\n            Podcasting operational change management inside of workflows to establish\n            a framework. Taking seamless key performance indicators offline to\n            maximise the long tail. Keeping your eye on the ball while performing a\n            deep dive on the start-up mentality to derive convergence on\n            cross-platform integration.\n          </p>\n          <p>\n            Collaboratively administrate empowered markets via plug-and-play networks.\n            Dynamically procrastinate B2C users after installed base benefits.\n            Dramatically visualize customer directed convergence without revolutionary\n            ROI.\n          </p>\n          <p>\n            Efficiently unleash cross-media information without cross-media value.\n            Quickly maximize timely deliverables for real-time schemas. Dramatically\n            maintain clicks-and-mortar solutions without functional solutions.\n          </p>\n        </div>\n\n        <div class=\"accordion-title\" ng-click=\"$ctrl.show3 = !$ctrl.show3\">\n          \u25B6 Completely pursue scalable customer service through sustainable\n          potentialities.\n        </div>\n        <div class=\"accordion-body\" ng-class=\"{ collapsed: !$ctrl.show3 }\">\n          <p>\n            Completely synergize resource taxing relationships via premier niche\n            markets. Professionally cultivate one-to-one customer service with robust\n            ideas. Dynamically innovate resource-leveling customer service for state\n            of the art customer service.\n          </p>\n          <p>\n            Objectively innovate empowered manufactured products whereas parallel\n            platforms. Holisticly predominate extensible testing procedures for\n            reliable supply chains. Dramatically engage top-line web services\n            vis-a-vis cutting-edge deliverables.\n          </p>\n          <p>\n            Proactively envisioned multimedia based expertise and cross-media growth\n            strategies. Seamlessly visualize quality intellectual capital without\n            superior collaboration and idea-sharing. Holistically pontificate\n            installed base portals after maintainable products.\n          </p>\n        </div>\n      </div>\n    "
  });

}());

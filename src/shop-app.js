/*
@license
Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

import Polymer from "../bower_components/polymer/polymer";
import AppHeader from "../bower_components/app-layout/app-header/app-header";
import Waterfall from "../bower_components/app-layout/app-scroll-effects/effects/waterfall";
import AppToolbar from "../bower_components/app-layout/app-toolbar/app-toolbar";
import Helpers from "../bower_components/app-layout/helpers/helpers";
import AppLocation from "../bower_components/app-route/app-location";
import AppRoute from "../bower_components/app-route/app-route";
import IronFlexLayout from "../bower_components/iron-flex-layout/iron-flex-layout";
import IronMediaQuery from "../bower_components/iron-media-query/iron-media-query";
import IronPages from "../bower_components/iron-pages/iron-pages";
import IronSelector from "../bower_components/iron-selector/iron-selector";
import ShopCategoryData from "shop-category-data";
import ShopHome from "shop-home";


// performance logging
window.performance && performance.mark && performance.mark('shop-app - before register');

Polymer({

  is: 'shop-app',

  properties: {

    page: {
      type: String,
      reflectToAttribute: true,
      observer: '_pageChanged'
    },

    numItems: {
      type: Number,
      value: 0
    },

    _shouldShowTabs: {
      computed: '_computeShouldShowTabs(page, smallScreen)'
    },

    _shouldRenderTabs: {
      computed: '_computeShouldRenderTabs(_shouldShowTabs, loadComplete)'
    },

    _shouldRenderDrawer: {
      computed: '_computeShouldRenderDrawer(smallScreen, loadComplete)'
    }
  },

  observers: [
    '_routePageChanged(routeData.page)'
  ],

  listeners: {
    'add-cart-item': '_onAddCartItem',
    'set-cart-item': '_onSetCartItem',
    'clear-cart': '_onClearCart',
    'change-section': '_onChangeSection',
    'announce': '_onAnnounce',
    'dom-change': '_domChange',
    'show-invalid-url-warning': '_onFallbackSelectionTriggered'
  },

  created: function() {
    window.performance && performance.mark && performance.mark('shop-app.created');
    // Custom elements polyfill safe way to indicate an element has been upgraded.
    this.removeAttribute('unresolved');
  },

  ready: function() {
    // listen for online/offline
    Polymer.RenderStatus.afterNextRender(this, function() {
      this.listen(window, 'online', '_notifyNetworkStatus');
      this.listen(window, 'offline', '_notifyNetworkStatus');
    });
  },

  _routePageChanged: function(page) {
    if (this.page === 'list') {
      this._listScrollTop = window.pageYOffset;
    }

    this.page = page || 'home';

    // Close the drawer - in case the *route* change came from a link in the drawer.
    this.drawerOpened = false;
  },

  _pageChanged: function(page, oldPage) {
    if (page != null) {
      // home route is eagerly loaded
      if (page == 'home') {
        this._pageLoaded(Boolean(oldPage));
      // other routes are lazy loaded
      } else {
        // When a load failed, it triggered a 404 which means we need to
        // eagerly load the 404 page definition
        var cb = this._pageLoaded.bind(this, Boolean(oldPage));
        this.importHref(
          this.resolveUrl('shop-' + page + '.html'),
          cb, cb, true);
      }
    }
  },

  _pageLoaded: function(shouldResetLayout) {
    this._ensureLazyLoaded();
    if (shouldResetLayout) {
      // The size of the header depends on the page (e.g. on some pages the tabs
      // do not appear), so reset the header's layout only when switching pages.
      this.async(function() {
        this.$.header.resetLayout();
      }, 1);
    }
  },

  _ensureLazyLoaded: function() {
    // load lazy resources after render and set `loadComplete` when done.
    if (!this.loadComplete) {
      Polymer.RenderStatus.afterNextRender(this, function() {
        this.importHref(this.resolveUrl('lazy-resources.html'), function() {
          // Register service worker if supported.
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js');
          }
          this._notifyNetworkStatus();
          this.loadComplete = true;
        });
      });
    }
  },

  _notifyNetworkStatus: function() {
    var oldOffline = this.offline;
    this.offline =  !navigator.onLine;
    // Show the snackbar if the user is offline when starting a new session
    // or if the network status changed.
    if (this.offline || (!this.offline && oldOffline === true)) {
      if (!this._networkSnackbar) {
        this._networkSnackbar = document.createElement('shop-snackbar');
        Polymer.dom(this.root).appendChild(this._networkSnackbar);
      }
      Polymer.dom(this._networkSnackbar).innerHTML = this.offline ?
          'You are offline' : 'You are online';
      this._networkSnackbar.open();
    }
  },

  _toggleDrawer: function() {
    this.drawerOpened = !this.drawerOpened;
  },

  // Elements in the app can notify section changes.
  // Response by a11y announcing the section and syncronizing the category.
  _onChangeSection: function(event) {
    var detail = event.detail;

    // Scroll to the top of the page when navigating to a non-list page. For list view,
    // scroll to the last saved position only if the category has not changed.
    var scrollTop = 0;
    if (this.page === 'list' && this.categoryName === detail.category) {
      scrollTop = this._listScrollTop;
    }
    // Use `Polymer.AppLayout.scroll` with `behavior: 'silent'` to disable header scroll
    // effects during the scroll.
    Polymer.AppLayout.scroll({ top: scrollTop, behavior: 'silent' });

    this.categoryName = detail.category || '';

    // Announce the page's title
    if (detail.title) {
      document.title = detail.title + ' - SHOP';
      this._announce(detail.title + ', loaded');
    }
  },

  _onAddCartItem: function(event) {
    if (!this._cartModal) {
      this._cartModal = document.createElement('shop-cart-modal');
      Polymer.dom(this.root).appendChild(this._cartModal);
    }
    this.$.cart.addItem(event.detail);
    this._cartModal.open();
    this._announce('Item added to the cart');
  },

  _onSetCartItem: function(event) {
    var detail = event.detail;
    this.$.cart.setItem(detail);
    if (detail.quantity === 0) {
      this._announce('Item deleted');
    } else {
      this._announce('Quantity changed to ' + detail.quantity);
    }
  },

  _onClearCart: function() {
    this.$.cart.clearCart();
    this._announce('Cart cleared');
  },

  // Elements in the app can notify a change to be a11y announced.
  _onAnnounce: function(e) {
    this._announce(e.detail);
  },

  // A11y announce the given message.
  _announce: function(message) {
    this._a11yLabel = '';
    this.debounce('_a11yAnnouncer', function() {
      this._a11yLabel = message;
    }, 100);
  },

  // This is for performance logging only.
  _domChange: function(e) {
    if (window.performance && performance.mark && !this.__loggedDomChange) {
      var target = Polymer.dom(e).rootTarget;
      if (target.domHost.is.match(this.page)) {
        this.__loggedDomChange = true;
        performance.mark(target.domHost.is + '.domChange');
      }
    }
  },

  _onFallbackSelectionTriggered: function() {
    this.page = '404';
  },

  _computeShouldShowTabs: function(page, smallScreen) {
    return (page === 'home' || page === 'list' || page === 'detail') && !smallScreen;
  },

  _computeShouldRenderTabs: function(_shouldShowTabs, loadComplete) {
    return _shouldShowTabs && loadComplete;
  },

  _computeShouldRenderDrawer: function(smallScreen, loadComplete) {
    return smallScreen && loadComplete;
  },

  _computePluralizedQuantity: function(quantity) {
    return quantity + ' ' + (quantity === 1 ? 'item' : 'items');
  }

});
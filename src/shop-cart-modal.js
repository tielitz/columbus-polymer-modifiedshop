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
import IronFlexLayout from "../bower_components/iron-flex-layout/iron-flex-layout";
import PaperIconButton from "../bower_components/paper-icon-button/paper-icon-button";
import IronOverlayBbehavior from "../bower_components/iron-overlay-behavior/iron-overlay-behavior";
import ShopButton from "shop-button";

Polymer({

  is: 'shop-cart-modal',

  behaviors: [
    Polymer.IronOverlayBehaviorImpl
  ],

  properties: {
    withBackdrop: {
      type: Boolean,
      value: true
    }
  },

  hostAttributes: {
    role: 'dialog',
    'aria-modal': 'true'
  },

  listeners: {
    'transitionend' : '_transitionEnd',
    'iron-overlay-canceled': '_onCancel'
  },

  _renderOpened: function() {
    this.restoreFocusOnClose = true;
    this.backdropElement.style.display = 'none';
    this.classList.add('opened');
  },

  _renderClosed: function() {
    this.classList.remove('opened');
  },

  _onCancel: function(e) {
    // Don't restore focus when the overlay is closed after a mouse event
    if (e.detail instanceof MouseEvent) {
      this.restoreFocusOnClose = false;
    }
  },

  _transitionEnd: function(e) {
    if (e.target !== this || e.propertyName !== 'transform') {
      return;
    }
    if (this.opened) {
      this._finishRenderOpened();
      this.fire('announce', 'Item added to the cart');
    } else {
      this._finishRenderClosed();
      this.backdropElement.style.display = '';
    }
  },

  get _focusableNodes() {
    return [this.$.viewCartAnchor, this.$.closeBtn];
  },

  refit: Function(),

  notifyResize: Function()

});
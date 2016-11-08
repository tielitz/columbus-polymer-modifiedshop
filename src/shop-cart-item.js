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
import ShopIcons from "shop-icons";
import ShopImage from "shop-image";
import ShopSelect from "shop-select";


Polymer({

  is: 'shop-cart-item',

  properties: {

    entry: Object

  },

  _quantityChange: function() {
    this._setCartItem(parseInt(this.$.quantitySelect.value, 10));
  },

  _setCartItem: function(quantity) {
    this.fire('set-cart-item', {
      item: this.entry.item,
      quantity: quantity,
      size: this.entry.size
    });
  },

  _formatPrice: function(price) {
    return price ? '$' + price.toFixed(2) : '';
  },

  _removeItem: function() {
    this._setCartItem(0);
  }

});
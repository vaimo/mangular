(function() {
  'use strict';
  angular.module('mangular', [ 'LocalForageModule' ]).run(runBlock);
  function runBlock($log, $localForage, Cart) {
    $localForage.getItem('cartId').then(function(data) {
      if (!data) {
        Cart.createNewCart().then(function(cartId) {
          $localForage.setItem('cartId', cartId);
        });
      }
    });
    $log.debug('mangular runBlock end');
  }
})();

(function() {
  'use strict';
  angular.module('mangular').factory('Cart', Factory);
  Factory.$inject = [ 'Restangular', '$log', '$localForage', '$rootScope' ];
  function Factory(Restangular, $log, $localForage, $rootScope) {
    var service = {
      getCartId: getCartId,
      getTotals: getTotals,
      getItems: getItems,
      addItem: addItem,
      removeItem: removeItem,
      createNewCart: createNewCart
    };
    $localForage.getItem('cartId').then(function(id) {
      service.cartId = id;
    });
    var cart = {};
    $localForage.getItem('cartId').then(function(id) {
      cart.id = id;
      service.cartId = id;
    });
    return service;
    function getCartId() {
      return $localForage.getItem('cartId');
    }
    function getTotals() {
      var getTotals = getCartId().then(function(id) {
        return Restangular.all('guest-carts/' + id + '/totals').customGET();
      });
      return getTotals;
    }
    function getItems() {
      var cartItems = getCartId().then(function(id) {
        return Restangular.withHttpConfig({
          cache: false
        }).all('guest-carts/' + id + '/items').customGET();
      });
      return cartItems;
    }
    function addItem(product, cartId) {
      $localForage.getItem('cartId').then(function(cartId) {
        var data = {
          cartItem: {
            sku: product.sku,
            qty: 1,
            quote_id: cartId
          }
        };
        Restangular.one('guest-carts').one(cartId).one('items').customPOST(data).then(function(response) {
          $log.info('cartUpdated:');
          $rootScope.$broadcast('cartUpdated', response);
        });
      });
    }
    function removeItem(itemId) {
      console.log(itemId);
      var cartItems = getCartId().then(function(cartId) {
        return Restangular.all('guest-carts/' + cartId + '/items/' + itemId).remove().then(function(response) {
          $log.info('cartUpdated:');
          $rootScope.$broadcast('cartUpdated', response);
        });
      });
    }
    function createNewCart() {
      var createNewCart = Restangular.all('guest-carts');
      var cartId = createNewCart.post();
      return cartId;
    }
    $log.info('--- Cart service end ---');
  }
})();

(function() {
  'use strict';
  angular.module('mangular').service('Categories', Service);
  Service.$inject = [ 'Restangular', '$log' ];
  function Service(Restangular, $log) {
    var service = {
      getCategories: getCategories,
      getCategory: getCategory
    };
    return service;
    function getCategories() {
      return Restangular.all('categories').customGET();
    }
    function getCategory(id) {
      return Restangular.one('category/' + id).customGET();
    }
  }
})();

(function() {
  'use strict';
  angular.module('mangular').service('Products', Service);
  Service.$inject = [ 'Restangular', '$stateParams', '$log' ];
  function Service(Restangular, $stateParams, $log) {
    var service = {
      getProducts: getProducts,
      getProduct: getProduct
    };
    return service;
    function getProducts(paramsData) {
      var params = paramsData;
      var query = 'products';
      var category = '';
      var defaultNumberOfProducts = '50';
      var catId = '';
      var noOfProducts = '';
      if (params.category) {
        catId = '&searchCriteria[filter_groups][0][filters][0][field]=' + 'category_id&searchCriteria[filter_groups][0][filters][0][value]=' + params.category;
      }
      if (params.limit) {
        noOfProducts = '[page_size]=' + params.limit;
      } else {
        noOfProducts = '[page_size]=' + defaultNumberOfProducts;
      }
      query += '?searchCriteria' + noOfProducts + catId;
      return Restangular.all(query).customGET();
    }
    function getProduct(sku) {
      return Restangular.one('products/' + sku).customGET();
    }
  }
})();
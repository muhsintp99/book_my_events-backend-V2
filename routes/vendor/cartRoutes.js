const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/vendor/cartController');

// =======================================================
// CART ROUTES
// =======================================================

// Add item to cart
router.post('/add', cartController.addToCart);

// Get user's cart
router.get('/:userId', cartController.getCart);

// Update cart item quantity
router.put('/update/:itemId', cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:itemId', cartController.removeCartItem);

// Clear entire cart
router.delete('/clear/:userId', cartController.clearCart);

module.exports = router;

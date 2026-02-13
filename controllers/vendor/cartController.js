const Cart = require('../../models/vendor/Cart');
const Cake = require('../../models/vendor/cakePackageModel');

// =======================================================
// ADD ITEM TO CART
// =======================================================
exports.addToCart = async (req, res) => {
    try {
        const {
            userId,
            cakeId,
            name,
            image,
            quantity,
            message,
            variations,
            addons,
            itemPrice,
            totalPrice
        } = req.body;

        // Validation
        if (!userId || !cakeId || !name || !quantity || itemPrice === undefined || totalPrice === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: userId, cakeId, name, quantity, itemPrice, totalPrice'
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        // Verify cake exists
        const cake = await Cake.findById(cakeId);
        if (!cake) {
            return res.status(404).json({
                success: false,
                message: 'Cake not found'
            });
        }

        // Find or create cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if item already exists in cart (same cake + variations)
        const existingItemIndex = cart.items.findIndex(item => {
            const sameCake = item.cakeId.toString() === cakeId.toString();
            const sameVariations = JSON.stringify(item.variations) === JSON.stringify(variations || []);
            return sameCake && sameVariations;
        });

        if (existingItemIndex > -1) {
            // Update existing item quantity
            cart.items[existingItemIndex].quantity += quantity;
            cart.items[existingItemIndex].totalPrice =
                cart.items[existingItemIndex].itemPrice * cart.items[existingItemIndex].quantity;
        } else {
            // Add new item
            cart.items.push({
                cakeId,
                name,
                image: image || '',
                quantity,
                message: message || 'N/A',
                variations: variations || [],
                addons: addons || [],
                itemPrice,
                totalPrice
            });
        }

        await cart.save();

        res.json({
            success: true,
            message: 'Item added to cart',
            cart
        });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =======================================================
// GET USER'S CART
// =======================================================
exports.getCart = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        let cart = await Cart.findOne({ userId }).populate('items.cakeId', 'name images');

        if (!cart) {
            // Return empty cart if not found
            cart = {
                userId,
                items: [],
                totalItems: 0,
                subtotal: 0
            };
        }

        res.json({
            success: true,
            cart
        });
    } catch (error) {
        console.error('Get cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =======================================================
// UPDATE CART ITEM QUANTITY
// =======================================================
exports.updateCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId, quantity } = req.body;

        if (!userId || !quantity) {
            return res.status(400).json({
                success: false,
                message: 'userId and quantity are required'
            });
        }

        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be at least 1'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        const item = cart.items.id(itemId);

        if (!item) {
            return res.status(404).json({
                success: false,
                message: 'Item not found in cart'
            });
        }

        // Update quantity and recalculate total
        item.quantity = quantity;
        item.totalPrice = item.itemPrice * quantity;

        await cart.save();

        res.json({
            success: true,
            message: 'Cart updated',
            cart
        });
    } catch (error) {
        console.error('Update cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =======================================================
// REMOVE ITEM FROM CART
// =======================================================
exports.removeCartItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found'
            });
        }

        // Remove item using pull
        cart.items.pull(itemId);

        await cart.save();

        res.json({
            success: true,
            message: 'Item removed from cart',
            cart
        });
    } catch (error) {
        console.error('Remove cart item error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =======================================================
// CLEAR CART
// =======================================================
exports.clearCart = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.json({
                success: true,
                message: 'Cart already empty'
            });
        }

        cart.items = [];
        await cart.save();

        res.json({
            success: true,
            message: 'Cart cleared',
            cart
        });
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

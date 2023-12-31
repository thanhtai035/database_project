const db = require('../connector/mysql');

// Cart entity constructor
class Cart {
    constructor(id, productId, quantity, customerID) {
        this.id = id;
        this.productId = productId;
        this.quantity = quantity;
        this.customerID = customerID;  
    }

    // Call procedure add to cart
    static async addToCart(customerId, productId) {
        try {
          const query = "CALL AddToCart(?, ?)";
          const results = await db.pool.query(query, [customerId, productId]);
          return results[0];
        } catch (err) {
          throw err;
        }
    }

    // Method to clear all items in the cart of the current user
    static async clearCart(customerId) {
        try {
            const query1 = "DELETE FROM CartDetail WHERE cartId = (SELECT cartId FROM Cart WHERE customerID = ?)";
            await db.pool.query(query1, [customerId]);
    
            const query2 = "DELETE FROM Cart WHERE customerID = ?";
            await db.pool.query(query2, [customerId]);
    
            return true;  // Cart and its details cleared successfully
        } catch (err) {
            throw err;
        }
    }
    
    // Method to remvove an item
    static async removeItem(customerId, productId) {
        try {
            const query1 = "DELETE FROM CartDetail WHERE cartId = (SELECT cartId FROM Cart WHERE customerID = ?) AND productId = ?";
            await db.pool.query(query1, [customerId, productId]);
    
            const [rows] = await db.pool.query("SELECT * FROM CartDetail WHERE cartId = (SELECT cartId FROM Cart WHERE customerID = ?)", [customerId]);

            // Check if there are no cart item left
            if (rows.length === 0) {
                const query2 = "DELETE FROM Cart WHERE customerID = ?";
                await db.pool.query(query2, [customerId]);
            }
    
            return true;  // Item removed successfully and cart deleted if no items left
        } catch (err) {
            throw err;
        }
    }

    // Method to reduce the quantity of the item by 1
    static async reduceItemQuantity(customerId, productId) {
        try {
            const query1 = "UPDATE CartDetail SET quantity = quantity - 1 WHERE cartId = (SELECT cartId FROM Cart WHERE customerID = ?) AND productId = ? AND quantity > 0";
            await db.pool.query(query1, [customerId, productId]);
    
            const query2 = "DELETE FROM CartDetail WHERE cartId = (SELECT cartId FROM Cart WHERE customerID = ?) AND productId = ? AND quantity = 0";
            await db.pool.query(query2, [customerId, productId]);
    
            const [rows] = await db.pool.query("SELECT * FROM CartDetail WHERE cartId = (SELECT cartId FROM Cart WHERE customerID = ?)", [customerId]);
    
            if (rows.length === 0) {
                const query3 = "DELETE FROM Cart WHERE customerID = ?";
                await db.pool.query(query3, [customerId]);
            }
    
            return true;  // Quantity reduced successfully and cart deleted if no items left
        } catch (err) {
            throw err;
        }
    }

    // Get all item with meaningful fields from the user
    static async getProductsAndQuantitiesByCustomerId(customerId) {
        try {
            const query = `
            SELECT p.id, p.title, p.img, p.price, cd.quantity
            FROM product p
            JOIN cartdetail cd ON p.id = cd.productId
            JOIN cart c ON cd.cartId = c.cartId
            WHERE c.customerId = ?`;
            
          const results = await db.pool.query(query, [customerId]);
          return results[0];
        } catch (err) {
          throw err;
        }
      }
        
}
module.exports = Cart;
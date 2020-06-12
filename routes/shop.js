const express = require('express'),
    path=require('path')

// const rootDir = require('../util/path')
// const adminData = require('./admin')

// isAuth is used as a handler for all routes
const isAuth = require('../middleware/is-auth')

const shopController = require('../controllers/shop')

const router = express.Router()

router.get('/',shopController.getIndex)

router.get('/products',shopController.getProducts)

router.get('/products/:productId',shopController.getProductDetail)

router.get('/cart',isAuth, shopController.getCart)

router.post('/cart',isAuth, shopController.postCart)

router.post('/cart-delete-product',isAuth, shopController.postCartDeleteProduct)

router.get('/checkout', isAuth, shopController.getCheckout)

router.get('/orders', isAuth, shopController.getOrders)

router.post('/create-order', isAuth, shopController.postOrders)

router.get('/orders/:orderId', isAuth, shopController.getInvoice)


module.exports=router
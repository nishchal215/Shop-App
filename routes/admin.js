const express = require('express'),
    router = express.Router(),
    path = require('path')

// isAuth is used as a handler for all routes
const isAuth = require('../middleware/is-auth')

// const rootDir = require('../util/path')
const adminController = require('../controllers/admin')

const {body} = require('express-validator/check')

// /admin/add-product 
// the request travels from left to right
router.get('/add-product', isAuth, adminController.getAddProduct)

// /admin/add-product 
router.post('/add-product',[
    body('title')
        .isString()
        .isLength({min: 3})
        .withMessage('Minimum length is 3')
        .trim(),
    body('price')
        .isNumeric()
        .withMessage('Price cannot be empty'),
    body('description')
        .isLength({min: 8, max: 400})
        .withMessage('Min length is 8 and max length is 400 for description')
        .trim()
], isAuth, adminController.postAddProduct)

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct)

router.post('/edit-product',[
    body('title')
        .isString()
        .isLength({min: 3})
        .withMessage('Minimum length is 3')
        .trim(),
    body('price')
        .isNumeric()
        .withMessage('Price cannot be empty'),
    body('description')
        .isLength({min: 8, max: 400})
        .withMessage('Min length is 8 and max length is 400 for description')
        .trim()
], isAuth, adminController.postEditProduct)

// router.post('/delete-product', isAuth, adminController.postDeleteProduct)

router.delete('/product/:productId', isAuth, adminController.deleteProduct)

// /admin/products
router.get('/products', isAuth, adminController.getProducts)

module.exports = router
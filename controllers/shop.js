const fs = require('fs')
const path = require('path')
const PDFDocument = require('pdfkit')

const Product = require('../models/product')
const Order = require('../models/order')

const ITEMS_PER_PAGE = 2

// function to give proper error messages
const returnError = () => {
    console.log(err)
    const error = new Error(err)
    error.httpStatusCode = 500  // we can pass extra information with this error to be used in middleware

    // when we pass a next with an error as argument then express knows it and will skip all middlewares and directly 
    // go to a error handling middleware
    return next(error)  // this will trigger the error handling middleware
}

exports.getProducts = (req, res, next) => {
    // in mongoose .find() returns complete array to get use .find().cursor().next()
    
    // or is used if the req.query.page is undefined because of no page at index page
    const page = +req.query.page || 1   // + is used to typecast it to integer
    let totalItems

    Product.find()
        // .select('title price -_id')  retrieves only the fields you pass and excludes the field you exclude using (-) sign
        // .populate('userId')  populates the given path with the id mentioned and the reference attached
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/product-list',
                {
                    prods: products,
                    pageTitle: 'Products',
                    path: '/products',
                    currentPage: page,
                    totalProducts: totalItems,
                    hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                    hasPreviousPage: page > 1,
                    nextPage: page + 1,
                    previousPage: page - 1,
                    lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
                })
        })
        .catch(err => {
            returnError()
        })

    /*    // using then and catch because promise is used in pool
        Product.fetchAll()
        // destructuring the result array into rows and fieldData to pull out the values
        // rows contains the data which we require
            .then(([rows, fieldData]) =>{   // we can ignore fieldData at it will just be fine
                // console.log(rows)
                res.render('shop/product-list', 
                {
                    prods: rows, 
                    pageTitle:'All Products', 
                    path:'/products'
                })
            })
            .catch(err =>{
                console.log(err)
            })*/
}

exports.getProductDetail = (req, res, next) => {
    const prodId = req.params.productId
    Product.findById(prodId)
        .then(product => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products'    // path is set to products to highlight the Products tab in nav bar,
            })
        })
        .catch(err => returnError())
}

exports.getIndex = (req, res, next) => {
    // or is used if the req.query.page is undefined because of no page at index page
    const page = +req.query.page || 1   // + is used to typecast it to integer
    let totalItems

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts
            return Product.find()
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('shop/index',
                {
                    prods: products,
                    pageTitle: 'Shop',
                    path: '/',
                    currentPage: page,
                    totalProducts: totalItems,
                    hasNextPage: ITEMS_PER_PAGE * page < totalItems,
                    hasPreviousPage: page > 1,
                    nextPage: page + 1,
                    previousPage: page - 1,
                    lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)
                })
        })
        .catch(err => {
            returnError()
        })
    /*    Product.fetchAll()
            .then(([rows]) =>{
                res.render('shop/index', 
                {
                    prods: rows, 
                    pageTitle:'Shop', 
                    path:'/'
                })
            })
            .catch(err =>{
                console.log(err)
            })*/
}

exports.getCart = (req, res, next) => {
    /* req.session.user is not used because req.session.user is received from mongodb which is not a mongoose object
    bcoz mongoDBStore does not know about mongoose so we use a middleware to store user from mongodb using mongoose
    and pass it to req.user */

    req.user
        // .populate does not return a promise by default so we need to use .execPopulate so that it returns a promise
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            // console.log(user.cart.items)
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: user.cart.items
            })
        })
        .catch(err => returnError())
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId
    Product.findById(prodId)
        .then((product) => {
            // console.log(product , 'controllers/shop')
            return req.user.addToCart(product)
        })
        .then(result => {
            console.log('Added to cart')
            console.log(result)
            res.redirect('/cart')
        })
        .catch(err => {
            returnError()
        })
}

exports.postCartDeleteProduct = (req, res, next) => {
    const prodId = req.body.productId
    // req.session.user
    req.user
        .deleteItemFromCart(prodId)
        .then(result => {
            res.redirect('/cart')
        })
        .catch(err => console.log(err))
}

exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout'
    })
}

exports.getOrders = (req, res, next) => {
    Order.find({ 'user.userId': req.session.user._id })
        .then(orders => {
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Orders',
                orders: orders
            })
        })
        .catch(err => returnError())
}

exports.postOrders = (req, res, next) => {
    // req.session.user
    req.user
        // .populate does not return a promise by default so we need to use .execPopulate so that it returns a promise
        .populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items.map(item => {
                // console.log(item.productId)
                return {
                    quantity: item.quantity,
                    // ._doc gives all the necessary data and not the metadata which is stored in item.productId
                    // and then using spread operator we store all of it in a new object
                    // just using item.productId saves only the id and not the complete object
                    product: { ...item.productId._doc }
                }
            })
            const order = new Order({
                user: {
                    email: req.user.email,
                    userId: req.user        //mongoose converts it into objectID type automatically
                },
                products: products
            })
            console.log(order.products)
            return order.save()
        })
        .then((result) => {
            return req.user.clearCart()
        })
        .then(() => {
            res.redirect('/orders')
        })
        .catch(err => returnError())
}

exports.getInvoice = (req, res, next) => {
    const orderId = req.params.orderId
    Order.findById(orderId)
        .then(order => {
            if (!order) {
                return next(new Error('Order not found'))
            }
            if (order.user.userId.toString() !== req.user._id.toString()) {
                return next(new Error('Unauthorized'))
            }
            const invoiceName = 'invoice-' + orderId + '.pdf'
            const invoicePath = path.join('data', 'invoices', invoiceName)

            // creating pdfs on server
            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf')    //opens the pdf in inline
            res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')

            // pdfDoc is a readStream so writing it to writeableStream
            pdfDoc.pipe(fs.createWriteStream(invoicePath))  // to save to server
            pdfDoc.pipe(res)    // to render to the user

            // entering data in PDF
            pdfDoc.fontSize(26).text('Invoice', {
                underline: true
            })
            pdfDoc.text('-----------------------')

            let totalPrice = 0
            order.products.forEach(prod => {
                totalPrice += prod.quantity * prod.product.price
                pdfDoc.fontSize(16).text(
                    prod.product.title +
                    ' - ' +
                    prod.quantity +
                    ' * Rs ' +
                    prod.product.price
                )
            })
            pdfDoc.text('------------------------')

            pdfDoc.fontSize(20).text('Total Price: Rs' + totalPrice)

            pdfDoc.end()    // ends creation of pdf

            /*fs.readFile(invoicePath, (err, data) => { 
                if (err) {
                    return next(err)
                }
                res.setHeader('Content-Type', 'application/pdf')    //opens the pdf in inline
                res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')
                // res.setHeader('Content-Disposition', 'attachment')   directly downloads the file
                res.send(data); // to send invoice file
            })*/


            // streaming files instead of loading them to memory to prevent from memory overflow

            // creating a readStream from the file path
            // const file = fs.createReadStream(invoicePath)
            // res.setHeader('Content-Type', 'application/pdf')    //opens the pdf in inline
            // res.setHeader('Content-Disposition', 'inline; filename="' + invoiceName + '"')
            // res.setHeader('Content-Disposition', 'attachment')   directly downloads the file

            // res is the writeableStream     , readStream is piped to writeableStream
            // file.pipe(res)
        })
        .catch(err => {
            return next(err)
        })
}
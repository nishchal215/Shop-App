const Product = require('../models/product')
const { validationResult } = require('express-validator/check')

const fileHelper = require('../util/file')

const ITEMS_PER_PAGE = 2

// function to give proper error messages
const returnError = (err, next) => {
    console.log(err)
    const error = new Error(err)
    error.httpStatusCode = 500  // we can pass extra information with this error to be used in middleware

    // when we pass a next with an error as argument then express knows it and will skip all middlewares and directly 
    // go to a error handling middleware
    return next(error)  // this will trigger the error handling middleware
}

exports.getAddProduct = (req, res, next) => {
    console.log('Here getAddProduct')
    console.log(req.session.isLoggedIn)
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
        hasError: false,
        validationErrors: [],
        errorMessage: null
    })
    // res.sendFile(path.join(rootDir, 'views', 'add-product.html'))
}

exports.postAddProduct = (req, res, next) => {
    console.log('Here postAddProduct')
    console.log(req.session.isLoggedIn)
    const title = req.body.title
    const image = req.file
    const description = req.body.description
    const price = req.body.price
    console.log(image)
    if(!image){
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                price: price,
                description: description
            },
            validationErrors: [],
            errorMessage: 'Attached file is not an image'
        })
    }
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
			hasError: true,
			product: {
                title: title,
                price: price,
                description: description
            },
            validationErrors: errors.array(),
            errorMessage: errors.array()[0].msg
        })
    }

	const imageUrl = image.path
    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageUrl,
        userId: req.user._id    // or req.user will also do fine becuase mongoose will automatically take the id of passed object
    })

    // createProduct method is created because a product belongs to a user and a user hasMany Prouducts
    product
        // .save from product model returns result of a promise
        .save()
        .then(result => {
            console.log('Product added')
            res.redirect('/admin/products')
        }).catch(err => {
            console.log('Error Found')
            // return res.status(500).render('admin/edit-product',{
            //     pageTitle: 'Add Product', 
            //     path: '/admin/add-product',
            //     editing: false,
            //     hasError: true,
            //     product: product,
            //     validationErrors: [],
            //     errorMessage: 'Database operation failed, please try again'
            // })

            // res.redirect('/500')
            returnError(err, next)


            // console.log(err)
            // const error = new Error(err)
            // error.httpStatusCode = 500  // we can pass extra information with this error to be used in middleware

            // // when we pass a next with an error as argument then express knows it and will skip all middlewares and directly 
            // // go to a error handling middleware
            // return next(error)  // this will trigger the error handling middleware  
        })
}

/*exports.postDeleteProduct = (req, res, next) => {
    // console.log('Here postDeleteProduct')
    const prodId = req.body.productId
    Product.findById(prodId)
        .then(product =>{
            if(!product){
                return next(new Error('Product not found'))
            }
            fileHelper.deleteFile(product.imageUrl)
            return Product.deleteOne({ _id: prodId, userId: req.user._id })
        })
        .then(() => {
            console.log('Product deleted')
            res.redirect('/admin/products')
        })
        .catch(err => returnError())
    // Product.deleteById(prodId)
}*/

// deleting product by calling deleteProduct function from client side and removing the deleted product using DOM
exports.deleteProduct = (req, res, next) => {
    // console.log('Here postDeleteProduct')
    const prodId = req.params.productId
    Product.findById(prodId)
        .then(product =>{
            if(!product){
                return next(new Error('Product not found'))
            }
            fileHelper.deleteFile(product.imageUrl)
            return Product.deleteOne({ _id: prodId, userId: req.user._id })
        })
        .then(() => {
            console.log('Product deleted')
            // instead of redirecting we will send some json data
            res.status(200).json({message: 'Success'})  // setting statusCode manually
        })
        .catch(err => {
            res.status(500).json({message: 'Deleting Failed'})
        })
    // Product.deleteById(prodId)
}

exports.getEditProduct = (req, res, next) => {
    // console.log('Here getEditProduct')
    const editMode = req.query.edit     // query parameters are inserted at end of url after ? sign
    // editMode is "true" and not true
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId
    Product.findById(prodId)
        .then(product => {
            // throw new Error('Dummy')
            if (!product) return res.redirect('/')
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: true,
                hasError: false,
                product: product,
                validationErrors: [],
                errorMessage: null
            })
        })
        .catch(err => {
            returnError()
        })

    // res.send("Edit Product")
}

exports.postEditProduct = (req, res, next) => {
    // console.log('Here postEditProduct')
    const prodId = req.body.productId
    const updatedTitle = req.body.title
    const updatedPrice = req.body.price
    const updatedDescription = req.body.description
    const updatedImage = req.file
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId
            },
            validationErrors: errors.array(),
            errorMessage: errors.array()[0].msg
        })
    }

    Product.findById(prodId)
        .then(product => {
            // route protection
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/')
            }
            // product returned is a monoose object thanks to mongoose
            product.title = updatedTitle
			product.price = updatedPrice
			product.description = updatedDescription
			if(updatedImage){
                fileHelper.deleteFile(product.imageUrl)
				product.imageUrl = updatedImage.path
			}
            // if we call save on an existing object then it will automatically be updated
            return product.save()
                .then(result => {
                    console.log('Product Updated')
                    res.redirect('/admin/products')
                })
        })
        .catch(err => returnError())
}

exports.getProducts = (req, res, next) => {
    console.log('Here getProducts')
    // or is used if the req.query.page is undefined because of no page at index page
    const page = +req.query.page || 1   // + is used to typecast it to integer
    let totalItems

    Product.find()
        .countDocuments()
        .then(numProducts => {
            totalItems = numProducts
            return Product.find({userId: req.user._id})
                .skip((page - 1) * ITEMS_PER_PAGE)
                .limit(ITEMS_PER_PAGE)
        })
        .then(products => {
            res.render('admin/products' ,
                {
                    prods: products,
                    pageTitle: 'Admin Products',
                    path: '/admin/products',
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
    /*    Product.fetchAll((products)=>{
            res.render('admin/products', 
            {
                prods: products, 
                pageTitle:'Admin Products', 
                path:'/admin/products'
            })  // Since we have declared that all views are inside views folder we don't need to set a path)
        })*/
}
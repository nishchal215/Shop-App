const mongoose = require('mongoose')
const Product = require('../models/product')

const Schema = mongoose.Schema

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    resetToken: String,
    resetTokenExpiration: Date,
    cart: {
        items: [{
            productId: {type: Schema.Types.ObjectId, ref:'Product', required: true},
            quantity: {type: Number, required: true}
        }]
    }
})

// it is necessary to define function the traditional way to ensure that 'this' points to the object
userSchema.methods.addToCart = function(product){
    const updatedProductIndex = this.cart.items.findIndex(cp => {
        console.log(cp.productId, product._id)
        // cp.productId and product._id both are different types using '==' will also not work
        return cp.productId.toString() === product._id.toString()
    })

    let newQuantity = 1
    const updatedCartItems = [...this.cart.items]

    if (updatedProductIndex >= 0) {
        newQuantity = this.cart.items[updatedProductIndex].quantity + 1
        updatedCartItems[updatedProductIndex].quantity = newQuantity
    } else {
        updatedCartItems.push({
            productId: product._id,     // mongoose will convert product._id to ObjectID type on it's own
            quantity: 1
        })
    }

    const updatedCart = { items: updatedCartItems }
    this.cart = updatedCart
    return  this.save() // predefined mongoose functions to save to database
}

userSchema.methods.deleteItemFromCart = function(productId){
    const updatedCart = this.cart.items.filter(item => {
        return item.productId.toString() !== productId.toString()
    })
    this.cart.items = updatedCart;
    return this.save()
}

userSchema.methods.clearCart = function(){
    this.cart = {items: []}
    return this.save()
}

module.exports = mongoose.model('User', userSchema)

// const mongodb = require('mongodb')
// const getDb = require('../util/database').getDb

// class User {
//     constructor(username, email, cart, id) {
//         this.name = username,
//             this.email = email,
//             this.cart = cart,
//             this._id = id
//     }

//     save() {
//         const db = getDb()
//         return db.collection('users').insertOne(this)
//             .then(result => {
//                 console.log(result)
//             })
//             .catch(err => {
//                 console.log(err)
//             })
//     }

//     addToCart(product) {
//         console.log(product, 'models/user')
//         const db = getDb()
//         const updatedProductIndex = this.cart.items.findIndex(cp => {
//             console.log(cp.productId, product._id)
//             // cp.productId and product._id both are different types using '==' will also not work
//             return cp.productId.toString() === product._id.toString()
//         })

//         // console.log(updatedProductIndex)

//         let newQuantity = 1
//         const updatedCartItems = [...this.cart.items]

//         if (updatedProductIndex >= 0) {
//             newQuantity = this.cart.items[updatedProductIndex].quantity + 1
//             updatedCartItems[updatedProductIndex].quantity = newQuantity
//         } else {
//             updatedCartItems.push({
//                 productId: mongodb.ObjectID(product._id),
//                 quantity: 1
//             })
//         }

//         const updatedCart = { items: updatedCartItems }
//         return db.collection('users').updateOne(
//             { _id: this._id },
//             { $set: { cart: updatedCart } }
//         )
//             .then(result => {
//                 console.log(result)
//                 return result
//             })
//             .catch(err => {
//                 console.log(err)
//             })
//     }

//     static findById(userId) {
//         const db = getDb()
//         return db.collection('users').findOne({ _id: mongodb.ObjectID(userId) })
//             .then(user => {
//                 // console.log(user)
//                 return user
//             })
//             .catch(err => {
//                 console.log(err)
//             })
//     }

//     getCart() {
//         const db = getDb()
//         const productIds = this.cart.items.map(item => {
//             return item.productId
//         })
//         // console.log(cartProducts)
//         return db.collection('products').find({ _id: { $in: productIds } }).toArray()
//             .then(products => {
//                 return products.map(product => {
//                     console.log(product)
//                     return {
//                         ...product,
//                         quantity: this.cart.items.find(item => {
//                             return item.productId.toString() === product._id.toString()
//                         }
//                         ).quantity
//                     }
//                 })
//             })
//             .catch(err => console.log(err))
//     }

//     deleteItemFromCart(productId) {
//         const updatedCart = this.cart.items.filter(item => {
//             return item.productId.toString() !== productId.toString()
//         })
//         const db = getDb();
//         return db.collection('users').updateOne(
//             { _id: this._id },
//             { $set: { cart: { items: updatedCart } } }
//         )
//     }

//     addOrder() {
//         let order;
//         const db = getDb();
//         return this.getCart()
//             .then(products =>{
//                 order = {
//                     items: products,
//                     user: {
//                         _id: mongodb.ObjectID(this._id),
//                         name: this.name     
//                     }
//                 }
//                 return db.collection('orders').insertOne(order)
//             })
//             .then(order => {
//                 this.cart = { items: [] }
//                 return db.collection('users').updateOne(
//                     { _id: this._id },
//                     { $set: { cart: { items: [] } } }
//                 )
//             })
//     }

//     getOrders(){
//         const db = getDb()
//         // to use comparisons with nested address use it inside '' eg: 'user._id'
//         return db.collection('orders').find({'user._id': this._id}).toArray()
//             .then(orders =>{
//                 return orders
//             })
//             .catch(err =>   console.log(err))
//     }

// }

// module.exports = User
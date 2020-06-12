const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        // ref is used to set the relation and value stored in ref is the name of the model you are connecting
        ref: 'User',
        required: true
    }
})

module.exports = mongoose.model('Product', productSchema)



// const mongodb = require('mongodb')
// const getDb = require('../util/database').getDb
// // getDb will give access to the database

// class Product {
//     constructor(title, price, description, imageUrl, id, userId){
//         this.title = title
//         this.price = price
//         this.description = description
//         this.imageUrl = imageUrl,
//         this._id = id,
//         this.userId = userId 
//     }

//     save(){
//         const db = getDb()
//         let dbOp;
//         if(this._id){
//             dbOp = db.collection('products')
//                         .replaceOne({_id: this._id}, this)
//         }else{
//             dbOp = db.collection('products').insertOne(this)
//         }
//         // we return the value because it will allow all of this to be treated as a promise
//         return dbOp
//             .then(result =>{
//                 console.log(result)
//             })
//             .catch(err =>   console.log(err))
//     }

//     static fetchAll(){
//         const db = getDb();
//         // .find() returns a cursor(object provided by MongoDB) which allows to go through our elements step by step
//         return db.collection('products').find().toArray()
//             .then(products =>{
//                 // console.log(products)
//                 return products
//             })
//             .catch(err =>{
//                 console.log(err)
//             })
//     }

//     static findById(prodId){
//         const db = getDb();
//         // to change prodId into ObjectID by mongo using mongo.ObjectID
//         // prodId is of type string and _id is of type ObjectID
//         return db.collection('products').find({ _id: mongodb.ObjectID(prodId) })
//             .next()
//             .then(product =>{
//                 console.log(product)
//                 return product
//             })
//             .catch(err =>{
//                 console.log(err)
//             })
//     }

//     static deleteById(prodId){
//         const db = getDb()
//         return db.collection('products').deleteOne({ _id: mongodb.ObjectID(prodId) })
//             .then(result =>{
//                 console.log('Product deleted')
//             })
//             .catch(err =>{
//                 console.log(err)
//             })
//     }
// }

// module.exports = Product
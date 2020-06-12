const express = require('express'),
    bodyParser = require('body-parser'),
    path = require('path'),
    mongoose = require('mongoose'),
    session = require('express-session'),
    mongoDBStore = require('connect-mongodb-session')(session),
    csrf = require('csurf'),
    flash = require('connect-flash'),
    multer = require('multer')

require('dotenv').config()

// console.log(process.env)

const MONGODB_URI = 'mongodb+srv://'+process.env.MONGODB_USERNAME+':'+process.env.MONGODB_PASSWORD+'@cluster0-bfq6v.mongodb.net/shop?retryWrites=true&w=majority'

const app = express()
const store = new mongoDBStore({
    uri: MONGODB_URI,
    collection: 'sessions'
})

const csrfProtection = csrf()

const User = require('./models/user')

app.set('view engine', 'ejs')
app.set('views', 'views')

const adminRoutes = require('./routes/admin')
shopRoutes = require('./routes/shop'),
    authRoutes = require('./routes/auth')

const errorController = require('./controllers/error')

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpeg' ||
        file.mimetype === 'image/jpg'
    ) {
        cb(null, true)
    } else {
        cb(null, false)
    }
}

// setting middlewares
app.use(bodyParser.urlencoded({ extended: true }))
app.use(multer({ storage: fileStorage, fileFilter: fileFilter }).single('image'))
app.use(express.static(path.join(__dirname, 'public')))

// Mounts the specified middleware function or functions at the specified path: the middleware function is executed 
// when the base of the requested path matches '/images'.
/* For example: app.use('/apple', ...) will match “/apple”, “/apple/images”, “/apple/images/news”, and so on. */ 
app.use('/images',express.static(path.join(__dirname, 'images')))
app.use(
    session({
        secret: 'Long Secret Key',
        resave: false,
        saveUninitialized: false,
        store: store
    })
)

app.use(csrfProtection)
app.use(flash())

// middleware to add isAuthenticated and csrfToken to all the rendering views
app.use((req, res, next) => {
    // res.locals is used by ejs to render it to all the views which are rendered by its own

    /* res.locals An object that contains response local variables scoped to the request, and therefore available 
    only to the view(s) rendered during that request / response cycle (if any). */
    res.locals.isAuthenticated = req.session.isLoggedIn
    res.locals.csrfToken = req.csrfToken()
    next()
})

// csrfToken is used before

app.use((req, res, next) => {
    // here throw new Error() works because it is inside a synchronous code
    // throw new Error('Sync Dummy')
    if (!req.session.user) {
        return next()
    }
    User.findById(req.session.user._id)
        .then(user => {
            // throw new Error('Dummy')
            if (!user) {
                return next()
            }
            req.user = user;
            next()
        })
        .catch(err => {
            // throw new Error(err)

            // inside a asynchronus block if a error is encountered then pass it through next and not throw it
            next(new Error(err))
        })
})

app.use('/admin', adminRoutes)
app.use(shopRoutes)
app.use(authRoutes)

app.get('/500', errorController.get500)

app.use(errorController.get404)

// all error handler middlewares are placed at last of all middlewares
// error handler middleware (has 4 parameters)
app.use((error, req, res, next) => {
    console.log(error, 'Error Middleware')

    // res.status(error.httpStatusCode).render(...)

    // res.redirect('/500')

    // rendering the page here beacuse redirecting it in case of an error in one of the above middleware will cause it
    // to go into an infinite loop
    res.status(500).render('500', {
        pageTitle: 'Error!',
        path: '/500'
    })
})

mongoose.connect(
    MONGODB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true }
)
    .then(result => {
        app.listen(process.env.PORT, () => {
            console.log('Server started')
        })
        // return User.findOne()
    })
    /*.then(user => {
        // console.log(user)
        if (!user) {
            const user = new User({
                name: 'Nishchal',
                email: 'nishchal@prakash.com',
                cart: {
                    items: []
                }
            })
            user.save()
        }
    })*/
    .catch(err => console.log(err))


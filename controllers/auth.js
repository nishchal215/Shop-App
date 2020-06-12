const crypto = require('crypto')

const bcrypt = require('bcryptjs'),
    nodemailer = require('nodemailer'),
    sendgridTransport = require('nodemailer-sendgrid-transport')

const { validationResult } = require('express-validator/check')

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: process.env.SENDGRID_API
    }
}))

// function to give proper error messages
const returnError = () =>{
    console.log(err)
    const error = new Error(err)
    error.httpStatusCode = 500  // we can pass extra information with this error to be used in middleware

// when we pass a next with an error as argument then express knows it and will skip all middlewares and directly 
// go to a error handling middleware
    return next(error)  // this will trigger the error handling middleware
}

exports.getLogin = (req, res, next) => {
    // req.get() is used to get value of headers
    // const isLoggedIn = (req.get('Cookie').split(';')[2].trim().split('=')[1])

    let message = req.flash('error')
    // console.log(message)
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    })
}

exports.getSignUp = (req, res, next) => {
    let message = req.flash('error')
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render('auth/signup', {
        path: '/signup',
        pageTitle: 'Signup',
        errorMessage: message,
        oldInput: {
            email: "",
            password: "",
            confirmPassword: ""
        },
        validationErrors: []
    })
}

exports.postLogin = (req, res, next) => {
    // req.isLoggedIn = true does not work because the request is discarded after we send the response

    // disabling cookies
    /*const isLoggedIn = (req.get('Cookie').split(';')[2].trim().split('=')[1])
    res.setHeader('Set-Cookie', 'loggedIn=true')    // Set-Cookie is default for setting cookies*/

    const email = req.body.email
    const password = req.body.password

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('auth/login', {
            path: '/login',
            pageTitle: 'Login',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        })
    }
    User.findOne({ email: email })
        .then(user => {
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isLoggedIn = true
                        req.session.user = user     // stores the found user
                        // .save() function saves the file and returns a call back
                        // .save() function is used to ensure that after saving the session only we redirect the page
                        return req.session.save((err) => {
                            console.log(err)
                            res.redirect('/')
                        })
                    }
                    return res.status(422).render('auth/login', {
                        path: '/login',
                        pageTitle: 'Login',
                        errorMessage: 'Wrong password',
                        oldInput: {
                            email: email,
                            password: password
                        },
                        validationErrors: [{ param: password }]
                    })
                })
                .catch(err => returnError())
        })
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    const confirmPassword = req.body.confirmPassword
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        console.log(errors.array())
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword
            },
            validationErrors: errors.array()
        })
    }
    // checking of already registered email is done in routes section
    bcrypt
        .hash(password, 12)
        .then(hashedPassword => {
            const user = new User({
                email: email,
                password: hashedPassword,
                cart: { items: [] }
            })
            return user.save()
        })
        .then(result => {
            console.log('Signed up successfully')
            res.redirect('/login')
            return transporter.sendMail({
                to: email,
                from: 'nispra39@gmail.com',
                subject: 'Signup Succeeded',
                html: '<h1>You successfully signed up</h1>'
            })
        })
        .catch(err => returnError())
}

exports.postLogout = (req, res, next) => {
    // destroy is method provied by session package
    req.session.destroy((err) => {
        console.log(err)
        res.redirect('/')
    })
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error')
    if (message.length > 0) {
        message = message[0]
    } else {
        message = null
    }
    res.render('auth/reset', {
        path: '/reset',
        pageTitle: 'Reset Password',
        errorMessage: message
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer) => {
        if (err) {
            console.log(err);
            return res.redirect('/reset');
        }
        // console.log(buffer);
        const token = buffer.toString('hex');
        User.findOne({ email: req.body.email })
            .then(user => {
                if (!user) {
                    req.flash('error', 'No user found with this email.')
                    return res.redirect('/reset');
                }
                user.resetToken = token,
                    user.resetTokenExpiration = Date.now() + 60 * 60 * 1000;    // 60 minutes
                return user.save();
            })
            .then(result => {
                // console.log(result)
                res.redirect('/')
                // console.log(token)
                return transporter.sendMail({
                    to: req.body.email,
                    from: 'nispra39@gmail.com',
                    subject: 'Reset Password',
                    html: `
                        <p>You requested a password</p>
                        <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
                    `
                })
            })
            .catch(err => returnError())
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token
    // console.log(token)
    User.findOne({
        resetToken: token,
        resetTokenExpiration: { $gt: Date.now() }
    })
        .then(user => {
            let message = req.flash('error')
            if (message.length > 0) {
                message = message[0]
            } else {
                message = null
            }
            res.render('auth/new-password', {
                path: '/new-password',
                pageTitle: 'Reset Password',
                errorMessage: message,
                resetToken: token,
                userId: user._id.toString()
            })
        })
        .catch(err => console.log(err))
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password
    const passwordToken = req.body.resetToken
    const userId = req.body.userId
    let resetUser;
    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
        .then(user => {
            resetUser = user
            return bcrypt.hash(newPassword, 12)
        })
        .then(hashedPassword => {
            resetUser.password = hashedPassword
            resetUser.resetToken = undefined
            resetUser.resetTokenExpiration = undefined
            return resetUser.save()
        })
        .then(result => {
            res.redirect('/login')
        })
        .catch(err => returnError());
}
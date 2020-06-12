const express = require('express'),
    router = express.Router()

const { check, body } = require('express-validator/check')

const User = require('../models/user')

const authController = require('../controllers/auth')

router.get('/login', authController.getLogin)

router.get('/signup', authController.getSignUp)

router.post(
    '/login',
    [
        check('email')
            .isEmail()
            .withMessage('Please enter a valid email.')
            .custom((value, {req}) =>{
                return User.findOne({ email: value })
                .then(user => {
                    if (!user) {
                        return Promise.reject('Invalid email.')
                    }
                })
            })
            .normalizeEmail()
    ], 
    authController.postLogin)

router.post(
    '/signup',
    [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email.')
        .custom((value, {req}) =>{
            // if(value === 'test@test.com'){
            //     throw new Error('This email is forbidden.')
            // }
            // return true
            return User.findOne({ email: value })
            .then(user => {
                if (user) {
                    return Promise.reject('E-mail already registered, please pick a different one')
                }
            })
        })
        .normalizeEmail(),
        body('password',
            'Please enter a password with only numbers and text and at least 5 characters.' // using this sets this as the withMessage for all validators
        )
            .isLength({ min: 5 })
            .isAlphanumeric(),
        body('confirmPassword').custom((value, {req}) =>{
            if(value !== req.body.password){
                throw new Error('Passwords have to match')
            }
            return true
        })
    ],
    authController.postSignup)

router.post('/logout', authController.postLogout)

router.get('/reset', authController.getReset)

router.post('/reset', authController.postReset)

router.get('/reset/:token', authController.getNewPassword)

router.post('/new-password', authController.postNewPassword)

module.exports = router
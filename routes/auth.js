const express  = require('express');
const router = express.Router();
const { body } = require('express-validator/check');
const authController = require('../controllers/auth');
const User = require('../models/user');

router.get('/login', authController.getLogin);

router.post('/login', authController.postLogin);

router.post('/logout',authController.postLogout);

router.get('/signup', authController.getSignup);

router.post('/signup',
    [
        body('email')
            .isEmail()
            .withMessage('Enter a valid email')
            .custom((value, {req}) => {
                return User.findOne({email : value})
                        .then(userDoc => {
                            if(userDoc)
                                return Promise.reject('Email already exists');
                        });
            })
            .normalizeEmail(),
        
        body('password')
            .trim()
            .isLength({min: 5})
            .withMessage('Min 5 characters required in password'),
        
        body('confirmPassword')
            .custom((value, {req})=> {
                if(value !== req.body.password)
                    throw new Error('Passwords should match');
                return true;
            }),
    ],
    authController.postSignup);

router.get('/reset', authController.getReset);    

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', 
    body('password').trim().isLength({min: 5}),
    authController.postNewPassword
);


module.exports = router;
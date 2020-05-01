const User = require('../models/user');
const bcryptjs = require('bcryptjs');
const {validationResult} = require('express-validator/check');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');

const transporter = nodemailer.createTransport(sendgridTransport({
    auth:{
        api_key: process.env.STRIPE_KEY
    }
}));

exports.getLogin = (req,res,next) => {
    let message = req.flash('error');
    if(message.length > 0)
        message = message[0];
    else    
        message = null;
    res.render('auth/login', {
        pageTitle : 'Login',
        path: '/login',
        errorMessage : message,
        oldInput : {email: '', password: ''}
    });
};

exports.postLogin = (req,res,next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        return res.status(422).render('auth/login', {
            pageTitle : 'Login',
            path: '/login',
            errorMessage : 'Invalid email or password',
            oldInput: { email: email, password: password}
        });
    }

    User.findOne({email:email})
    .then(user => {
        if(!user){
            return res.status(422).render('auth/login', {
                pageTitle : 'Login',
                path: '/login',
                errorMessage : 'Invalid email or password',
                oldInput: { email: email, password: password}
            });
        }
        bcryptjs.compare(password, user.password)
        .then(doMatch => {
            if(!doMatch){
                return res.status(422).render('auth/login', {
                    pageTitle : 'Login',
                    path: '/login',
                    errorMessage : 'Invalid email or password',
                    oldInput: { email: email, password: password}
                });
            } 
            req.session.isLoggedIn = true;
            req.session.user = user;
            // req.session.isAdmin = req.body.isAdmin;
            // console.log(req.session.isAdmin);
            // console.log("USER IS");
            // console.log(user);
            return req.session.save(err => {
                // console.log(err);
                res.redirect('/');
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
          });      
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};

exports.postLogout = (req,res,next)=>{
    req.session.destroy( (err)=> {
        res.redirect('/');
    });
};


exports.getSignup = (req, res, next) => {
    let message =  req.flash('error');
    if(message.length > 0)
        message = message[0];
    else    
        message = null;  
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        errorMessage: message,
        oldInput : {email: '', password: '', confirmPassword: '', isAdmin:false},
        validationErrors: []
    });
};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const isAdmin = req.body.isAdmin;
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        return res.status(422).render('auth/signup', {
            pageTitle: 'Signup',
            path: '/signup',
            errorMessage: errors.array()[0].msg,
            oldInput : {email: email, password: password, confirmPassword: confirmPassword, isAdmin:isAdmin},
            validationErrors : errors.array()
        });
    }
    
    bcryptjs.hash(password, 12)
    .then(hashedPassword => {
        const user = new User({
            email : email,
            password : hashedPassword,
            isAdmin : isAdmin,
            wishlist: {container : []},
            record: {container: []}
        });
        return user.save();
    })
    .then(result => {
        // console.log("redirecting");
        res.redirect('/login');
        // console.log("about to send mail");
        return transporter.sendMail({
           to: email,
           from: 'ankita_11812038@nitkkr.ac.in',
           subject: 'Sign up succeeded',
           html: '<h1> You signed up successfully ! </h1>' 
        });
       
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};


exports.getReset = (req,res,next) => {
    let message =  req.flash('error');
    if(message.length > 0)
        message = message[0];
    else    
        message = null;  
    res.render('auth/reset', {
        pageTitle: 'reset',
        path: '/reset',
        errorMessage: message,
        oldInput : {email: ''}

    });
};

exports.postReset = (req,res,next) => {
    crypto.randomBytes(32, (err, buffer)=> {
        if(err)
        {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
        const token = buffer.toString('hex');
        User.findOne({email: req.body.email})
        .then(user => {
            if(!user)
            {
                return res.render('auth/reset', {
                    pageTitle: 'reset',
                    path: '/reset',
                    errorMessage: 'No account found with this email',
                    oldInput : {email: req.body.email}
                });
            }
            user.resetToken = token;
            user.resetTokenExpiration = Date.now() + 3600000;
            return user.save();
        })
        .then(result => {
            res.redirect('/');
            return transporter.sendMail({
                to: req.body.email,
                from: 'ankita_11812038@nitkkr.ac.in',
                subject: 'Password reset',
                html: `<p> You requested a password reset </p>
                <p> Click this <a href="http://localhost:2000/reset/${token}"> link </a> to reset the password </p>
                <p> The link is valid for one hour only </p>`
             });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        });
    });
};

exports.getNewPassword = (req,res,next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
        if (!user)
        {
            alert("Invalid request");
            return;
        }
        res.render('auth/new-password', {
            pageTitle: 'Password Reset',
            path: '/new-password',
            errorMessage: null,
            userId: user._id,
            token: token
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

    
};

exports.postNewPassword = (req,res,next) => {
    const userId = req.body.userId;
    const newPassword = req.body.password;
    const token = req.body.token;
    const errors = validationResult(req);
    if (!errors.isEmpty())
    {
        return res.render('auth/new-password', {
            pageTitle: 'Password Reset',
            path: '/new-password',
            errorMessage: "Min 5 characters required in password",
            userId: userId,
            token: token
        });
    }

    let resetUser;
    User.findById(userId)
    .then(user => {
        if(!user)
        {
            const error = new Error(err);
            error.httpStatusCode = 500;
            return next(error);
        }
        resetUser = user;
        return bcryptjs.hash(newPassword, 12)
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenExpiration = undefined;
        resetUser.save();
    })
    .then(result => {
        res.redirect('/login');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

};

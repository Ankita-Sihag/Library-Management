const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const rootDir = require('./util/path');
const errorController = require('./controllers/error');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/library');
const authRoutes = require('./routes/auth');
const mongoose = require('mongoose');
const User = require('./models/user');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
// const csurf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const helmet = require('helmet');
const compression = require('compression');

const MONGOURL = process.env.MYMONGOURL;
const store = new MongoDBStore({
    uri : MONGOURL ,
    collection : 'sessions'
});
// const csurfProtection = csurf();

const fileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'images')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg')
        cb(null, true);
    else
        cb(null, false);
};

const app = express();

app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.static(path.join(rootDir, 'public',)));
app.use(bodyParser.urlencoded({extended:false}));
app.use(session({secret:'my secret', resave: false, saveUninitialized: false, store:store}));
// app.use(csurfProtection);
app.use(flash());
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));
app.use('/images', express.static(path.join(rootDir, 'images')));
app.use(helmet());
app.use(compression());

// var myCsrf;
app.use((req,res,next)=>{
    res.locals.isAuthenticated = req.session.isLoggedIn;
    // myCsrf = req.csrfToken();
    res.locals.csrfToken = 0;
    next();
});

app.use((req,res,next)=>{
    if(!req.session.user)
        return next();
    User.findById(req.session.user._id)
    .then(user => {
        req.user = user;
        next();
    })
    .catch(err => {
        next(new Error(err));
      });
}); 

app.use((req,res,next)=>{
    if(req.user)
        res.locals.isAdmin = req.user.isAdmin;
    else    
        res.locals.isAdmin = false;
    next();
});

app.use('/admin',adminRoutes );
app.use(userRoutes);
app.use(authRoutes);
app.use('/', errorController.get404);

app.use((error, req, res, next) => {
    console.log("About to render 500");
    console.log(error);
    res.status(500).render('500', {
      pageTitle: 'Error!',
      path: 'Error',
      isAuthenticated: req.session.isLoggedIn,
      isAdmin: req.user.isAdmin || false,
      csrfToken: 0
    });
  });

mongoose.connect(MONGOURL)
.then(result => {
    app.listen(process.env.PORT || 3000);
})
.catch(err => {console.log(err);});
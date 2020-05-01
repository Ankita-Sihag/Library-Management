const express = require('express');
const adminController = require('../controllers/admin');
const isAuth = require('../middleware/isAuth');
const { body } = require('express-validator/check');
const isAdmin = require('../middleware/isAdmin');

const router = express.Router();


router.get('/add-book', isAuth, isAdmin, adminController.getAddBook);

router.post('/add-book', isAuth, isAdmin,
    [
        body('title', 'Enter atleast 3 characters')
            .trim()
            .isLength({min: 3}),
        body('author', 'Enter atleast 3 characters')
            .trim()
            .isLength({min: 3}),
        body('refNo', 'Enter only numbers and letters')
            .trim()
            .isLength({min: 1}),
        body('noOfBooks', 'Enter the no of books')
            .isNumeric(),
        body('description', 'Enter atleast 3 characters')
            .trim()
            .isLength({min: 3})
            
    ],
    adminController.postAddBook);

router.get('/books/:bookId' , isAuth, isAdmin, adminController.getEditBook);

router.get('/books', isAuth, isAdmin, adminController.getBooks);

router.post('/edit-book', isAuth,isAdmin,
    [
        body('title', 'Enter atleast 3 characters')
            .trim()
            .isLength({min: 3}),
        body('author', 'Enter atleast 3 characters')
            .trim()
            .isLength({min: 3}),
        body('refNo', 'Enter the ref No')
            .trim()
            .isLength({min: 1}),
        body('noOfBooks', 'Enter the no of books')
            .isNumeric(),
        body('description', 'Enter atleast 3 characters')
            .trim()
            .isLength({min: 3})
    ],
    adminController.postEditBook);

router.delete('/book/:bookId', isAuth, isAdmin, adminController.deleteBook);

router.get('/counter', isAuth, isAdmin,  adminController.getCounter);

router.post('/issue-book', isAuth, isAdmin, adminController.postIssueBook);

router.get('/issue-book', isAuth,isAdmin, adminController.getIssuedBooks);

router.post('/return-book', isAuth, isAdmin,adminController.postReturnBook);

router.post('/search', isAuth, isAdmin, adminController.getSearchBooks);

module.exports = router;
const express = require('express');
const libraryController = require('../controllers/library');
const isAuth = require('../middleware/isAuth');
const router = express.Router();

router.get('/', libraryController.getHome );

router.get('/books', libraryController.getBooks);

router.post('/books', libraryController.BookDetail);

router.get('/wishlist', isAuth, libraryController.getWishlist);

router.post('/add-to-wishlist', isAuth, libraryController.addToWishlist);

router.post('/wishlist-delete-book', isAuth, libraryController.deleteFromWishlist);

router.post('/move-to-counter', isAuth, libraryController.moveToCounter);

router.get('/user-record', isAuth, libraryController.getUserRecord);

router.post('/search', libraryController.getSearchBooks);

module.exports = router;
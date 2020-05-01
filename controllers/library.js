const Book = require('../models/book');
const CounterBook = require('../models/counterBook');
const User = require('../models/user');
const ITEMS_PER_PAGE = 6;


exports.getHome = (req,res,next)=>{
    res.render('home', {
        pageTitle: 'Home',
        path: '/'
    })
};

exports.getBooks = (req,res,next)=>{
    const page = +req.query.page || 1;
    let totalBooks;
    Book.find()
    .countDocuments()
    .then(numBooks => {
        totalBooks = numBooks;
        return Book.find()
        .skip((page-1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then( books =>{
        res.render('library/books', {
            pageTitle: 'Books',
            path: '/books',
            books: books,
            search: null,
            currentPage: page,
            hasNext: ITEMS_PER_PAGE*page < totalBooks,
            hasPrev: page>1,
            nextPage: page+1,
            prevPage: page-1,
            lastPage: Math.ceil(totalBooks/ITEMS_PER_PAGE)
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
    
};

exports.BookDetail = (req,res,next)=>{
    
    const bookId = req.body.bookId;
    Book.findById(bookId)
    .then(book => {
        res.render('library/book-detail', {
            pageTitle: 'Book Details',
            path: '/book-detail',
            book: book
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};

exports.getWishlist = (req,res,next)=>{
    req.user
    .populate('wishlist.container')
    .execPopulate()
    .then(user => {
        res.render('library/wishlist', {
            pageTitle: 'Wishlist',
            path: '/wishlist',
            books: user.wishlist.container
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};

exports.addToWishlist = (req,res,next)=>{
    const bookId = req.body.bookId;
    const user = req.user;
    user.addToWishlist(bookId)
    .then(result => {
        res.redirect('/wishlist');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};

exports.deleteFromWishlist = (req,res,next)=>{
    const bookId = req.body.bookId;
    req.user
    .removeFromWishlist(bookId)
    .then(result => {
        res.redirect('/wishlist');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};


exports.moveToCounter = (req,res,next) => {
    const bookId = req.body.bookId;
    const userId = req.user._id;
    req.user.removeFromWishlist(bookId)
    .then(result => {
        const counterBook = new CounterBook({
            bookId: bookId,
            userId: userId
        });
        counterBook.save();
        res.redirect('/wishlist');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};

exports.getUserRecord = (req,res,next)=>{
    const container = req.user.record.container;
    container.reverse();
    res.render('library/user-record', {
        pageTitle: 'User Record',
        path: '/user-record',
        books: container
    });
};

exports.getSearchBooks = (req,res,next)=>{
    const search = req.body.search;
    words = search.split(" ");
    ans = [];
    let booksToBeReturned;
    const page = +req.query.page || 1;
    
    
    Book.find()
    .then(books => {
        
        for(book of books)
        {
            flag = false;
            for(word of words)
            {
                word = word.toLowerCase();

                if(book.title.toLowerCase().includes(word))
                {
                    flag = true;
                    break;
                }
            }
            if(flag)
                ans.push(book);
        }
    })
    .then(result => {
        booksToBeReturned = ans.slice(ITEMS_PER_PAGE*(page-1), ITEMS_PER_PAGE*page);
    })
    .then( result =>{
        let l = ans.length;
        return res.render('library/books', {
            pageTitle: 'Books',
            path: '/books',
            search: search,
            books: booksToBeReturned,
            currentPage: page,
            hasNext: ITEMS_PER_PAGE*page < l,
            hasPrev: page>1,
            nextPage: page+1,
            prevPage: page-1,
            lastPage: Math.ceil(l/ITEMS_PER_PAGE)
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
    
};

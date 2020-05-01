const Book = require('../models/book');
const IssuedBook = require('../models/issuedBook');
const CounterBook = require('../models/counterBook');
const User = require('../models/user');
const mongoose = require('mongoose');
// const async = require('async');
const {validationResult} = require('express-validator/check');
const fileHelper = require('../util/file');
const ITEMS_PER_PAGE = 6;


exports.getAddBook = (req,res,next)=>{
    // console.log(isAdmin);
    res.render('admin/edit-book', {
        pageTitle: 'Add Book',
        path: '/admin/add-book',
        editing: false,
        hasError: false,
        book: {title: '', author:'', refNo:'', imageUrl:'', noOfBooks: '', description:''},
        errorMessage:null,
        validationErrors: []
    });
};

exports.postAddBook = (req, res,next)=>{
    const refNo = req.body.refNo;
    const title = req.body.title;
    const image = req.file;
    const author = req.body.author;
    const description = req.body.description;
    const noOfBooks = req.body.noOfBooks;
    const errors = validationResult(req);

    if(!image)
    {
        return res.status(422).render('admin/edit-book', {
            pageTitle: 'Add Book',
            path: '/admin/add-book',
            editing: false,
            hasError: true,
            book : {
                title:title,
                author: author,
                refNo: refNo,
                noOfBooks: noOfBooks,
                description : description
            },
            errorMessage : 'Attatched file is not an image',
            validationErrors : errors.array()
        });
    }

    if(!errors.isEmpty())
    {
        // console.log("ERROR");
        // console.log(errors.array());
        return res.status(422).render('admin/edit-book', {
            pageTitle: 'Add Book',
            path: '/admin/add-book',
            editing: false,
            hasError: true,
            book : {
                title:title,
                author: author,
                refNo: refNo,
                noOfBooks: noOfBooks,
                description : description
            },
            errorMessage : errors.array()[0].msg,
            validationErrors : errors.array()
        });
    }

    const imageUrl = image.path;

    const book = new Book({
        title: title,
        author: author,
        refNo: refNo,
        noOfBooks: noOfBooks,
        available: noOfBooks,
        imageUrl: imageUrl,
        description: description
    });
    book.save()
    .then(result => {
        res.redirect('/admin/books');
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
    
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
        res.render('admin/books', {
            pageTitle: 'Books',
            path: '/admin/books',
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

exports.getEditBook = (req,res,next)=>{
    const bookId = req.params.bookId;
    const editMode = req.query.edit;
    if (!editMode)
        return res.redirect('/');
    Book.findById(bookId)
    .then(book=>{
        if (!book)
            return res.redirect('/404');
        res.render('admin/edit-book', {
            pageTitle: 'Edit book',
            path: '/admin/edit-book',
            book : book,
            editing: editMode,
            hasError: false,
            errorMessage: null,
            validationErrors: []
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};

exports.postEditBook = (req,res,next)=>{
    const bookId = req.body.bookId;
    const refNo = req.body.refNo;
    const title = req.body.title;
    const image = req.file;
    const author = req.body.author;
    const description = req.body.description;
    const noOfBooks = req.body.noOfBooks;
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        
        return res.status(422).render('admin/edit-book', {
            pageTitle: 'Edit book',
            path: '/admin/edit-book',
            book : {refNo: refNo, _id: bookId, title: title, author: author, description: description, noOfBooks: noOfBooks},
            editing: true,
            hasError: true,
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array(),
            _id : bookId
        });
    }
    

    

    Book.findById(bookId)
    .then(book => {
        
        if(book.available + (noOfBooks-book.noOfBooks) < 0)
        {
            return res.status(422).render('admin/edit-book', {
                pageTitle: 'Edit book',
                path: '/admin/edit-book',
                book : {refNo: refNo, _id: bookId, author: author, title: title, description: description, noOfBooks: noOfBooks},
                editing: true,
                hasError: true,
                errorMessage: `No of books must not be less than ${book.available} (already issued) `,
                validationErrors: [{param: 'noOfBooks'}],
                _id : bookId
            });
        }
        book.refNo = refNo;
        book.title = title;
        book.author = author;
        book.description = description;
        book.available = book.available + (noOfBooks - book.noOfBooks);
        book.noOfBooks = noOfBooks;
        if(image)
        {
            fileHelper.deleteFile(book.imageUrl);
            book.imageUrl = image.path;
        }
        return book.save();
    })
    .then(result => {
        if(!res.headersSent)
            res.redirect('/admin/books');
    })
    .catch(err => {
        // const error = new Error(err);
        // error.httpStatusCode = 500;
        // return next(error);
        console.log("Error in post edit controller");
        console.log(err);
    });
};

exports.deleteBook = (req,res,next)=>{
    const bookId = req.params.bookId;
    Book.findById(bookId)
    .then( book =>{
        if(!book)
          return next(new Error('Book not found'));
        fileHelper.deleteFile(book.imageUrl);
        return Book.deleteOne({_id: bookId});
    })
    .then(result => {
        CounterBook.find({bookId: bookId})
        .then(books => {
            for(book of books)
            {
                CounterBook.findByIdAndDelete(book._id);
            }
            return;
        });
    })
    .then(result => {
        IssuedBook.find({bookId: bookId})
        .then(issues => {
            for(issue of issues)
            {
                User.findById(issue.userId)
                .then(user => {
                    user.updateBookStatus(issueId);
                });
            }
            return;
        });
    })
    .then(result => {
        res.status(200).json({message: 'Success'});
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};


exports.getCounter = (req,res,next) =>{

    CounterBook.find()
     .populate('bookId')
     .populate('userId')
     .exec(function(err, book ){
        if(err){
            console.log("ERROR IN GET COUNTER");
            console.log(err);
        }
        else
        {
            // console.log(book);
            return res.render('admin/counter', {
                pageTitle: 'Counter',
                books : book,
                path: '/admin/counter'
            });
        }
     });
     
};

exports.postIssueBook = (req,res,next) => {
    let book;
    CounterBook.findByIdAndDelete(req.body.counterId)
    .then(result => {
        const b = new IssuedBook({
            userId : req.body.userId,
            bookId : req.body.bookId
        });
        return b.save();
    })
    .then(result => {
        const issueId = result._id;
        User.findById(req.body.userId)
        .then(user => {
            const o = {bookId: req.body.bookId, issueId: issueId};
            user.addToRecord(o)
            .then(result => {
                Book.findById(req.body.bookId)
                .then(book => {
                    book.available -= 1;
                    return book.save();
                })
                return;
            })
            .then(result => {
                res.redirect('/admin/counter');
            });
        });
    });
            
    

    // .catch(err => {
    //     const error = new Error(err);
    //     error.httpStatusCode = 500;
    //     return next(error);
    //   });
};

exports.getIssuedBooks = (req,res,next) => {
    IssuedBook.find()
    .populate('userId')
    .exec()
    .then(books => {

        res.render('admin/issuedBooks.ejs', {
            pageTitle: 'Issued Books',
            path: '/admin/issue-book',
            books : books
        });
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
};

exports.postReturnBook = (req,res,next)=>{
    IssuedBook.findByIdAndRemove(req.body.issueId)
    .then(result => {
        userId = req.body.userId;
        issueId = req.body.issueId;
        User.findById(userId)
        .then(user => {
            // console.log("calling update");
            user.updateBookStatus(issueId)
            .then(result => {
                Book.findById(req.body.bookId)
                .then(book => {
                    book.available += 1;
                    return book.save();
                })
                return;
            })
            .then(result => {
                // console.log("About to redirect");
                res.redirect('/admin/issue-book');
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

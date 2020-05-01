const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookSchema = new Schema({
    title : {
        type: String,
        required: true
    },
    author : {
        type: String,
        required: true
    },
    refNo: {
        type: String,
        required: true
    },
    noOfBooks: {
        type: Number,
        required: true
    },
    available: {
        type: Number,
        required: true
    },
    imageUrl: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    }
}); 


module.exports = mongoose.model('books', bookSchema);

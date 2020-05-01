const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const counterSchema = new Schema({
    bookId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'books'
    },
    userId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'users'
    }

});

module.exports = mongoose.model('counterBooks', counterSchema);
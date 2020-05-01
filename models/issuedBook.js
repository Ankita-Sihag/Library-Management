const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const issuedBookSchema = new Schema({
    
    userId : {type:Schema.Types.ObjectId, ref:'users', required:true},
    bookId : {type: Schema.Types.ObjectId, ref: 'books', required: true},
    dateIssue : {type: Date,  default: Date.now},
    dateReturn : {type: Date,  default: () => Date.now() + 15*24*60*60*1000},
    fine : {type: Number, default:0}
                
});


module.exports = mongoose.model('issuedBooks', issuedBookSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin : {
        type: Boolean,
        required: true
    },
    wishlist:{
        container:[{type: Schema.Types.ObjectId, ref: 'books', required: true}]
    },
    record:{
        container:[{
                    issueId : {type: Schema.Types.ObjectId, ref: 'issuedBooks', required: true},
                    bookId : {type: Schema.Types.ObjectId, ref: 'books', required: true},
                    dateIssue : {type: Date,  default: Date.now()},
                    dateReturn : {type: Date,  default: () => Date.now() + 15*24*60*60*1000},
                    status : {type: String, default: "Pending"},
                    fine : {type: Number, default:0}
                }]
    },
    resetToken: String,
    resetTokenExpiration: Date
});

userSchema.methods.addToWishlist = function(bookId){
    const container = [...this.wishlist.container];
    isIncluded = false;
    for(x of container)
    {
        if ((x.toString())=== bookId)
        {
            isIncluded = true;
            break;
        }
    }
    
    if (!isIncluded)
        container.push(bookId);
    this.wishlist.container = container;
    return this.save();
}

userSchema.methods.removeFromWishlist = function(bookId){
    const container = this.wishlist.container.filter(i => {
        return i.toString()!== bookId.toString();
    });
    this.wishlist.container = container;
    return this.save();
}

userSchema.methods.addToRecord = function(o){
    const container=[...this.record.container];
    container.push(o);
    this.record.container = container;
    return this.save();
}

userSchema.methods.updateBookStatus = function(issueId){
    for( i of this.record.container){
        if (i.issueId.toString() === issueId.toString()){
            i.status="Returned";
            // console.log("changed");
            break;
        }
    }
    // console.log("Returning");
    return this.save();
}

module.exports = mongoose.model('users', userSchema);
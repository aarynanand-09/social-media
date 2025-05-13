const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    content: {
        type: String,
        required: true,
        maxlength: 500
    },
    commentIDs: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    commentedBy: {
        type: String,
        required: true
    },
    commentedDate: {
        type: Date,
        default: Date.now
    },
    postID: {
        type: Schema.Types.ObjectId,
        ref: 'Post'
    },
    parentID: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    votes: {
        type: Number,
        default: 0
    },
    upvotedBy: [{
        type: String
    }],
    downvotedBy: [{
        type: String
    }]
});

commentSchema.virtual('url').get(function() {
    return 'comments/' + this._id;
});

module.exports = mongoose.model('Comment', commentSchema);
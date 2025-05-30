const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const post = new Schema({
    title: {
        type: String,
        required: true,
        maxlength: 100
    },
    content: {
        type: String,
        required: true
    },
    linkFlairID: {
        type: Schema.Types.ObjectId,
        ref: 'LinkFlair'
    },
    postedBy: {
        type: String,
        required: true
    },
    postedDate: {
        type: Date,
        default: Date.now
    },
    commentIDs: [{
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    views: {
        type: Number,
        default: 0
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

post.virtual('url').get(function() {
    return 'posts/' + this._id;
});

module.exports = mongoose.model('Post', post);
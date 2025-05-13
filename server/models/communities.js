const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const community = new Schema({
    name: {
        type: String,
        required: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    postIDs: [{
        type: Schema.Types.ObjectId,
        ref: 'Post'
    }],
    startDate: {
        type: Date,
        default: Date.now
    },
    members: [{
        type: String
    }]
});

community.virtual('memberCount').get(function() {
    return this.members.length;
});

community.virtual('url').get(function() {
    return 'communities/' + this._id;
});

module.exports = mongoose.model('Community', community);
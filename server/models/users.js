const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    displayName: {
        type: String,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    reputation: {
        type: Number,
        default: 100
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    joinedCommunities: [{
        type: Schema.Types.ObjectId,
        ref: 'Community'
    }],
    createdDate: {
        type: Date,
        default: Date.now
    }
});

userSchema.virtual('url').get(function() {
    return 'users/' + this._id;
});

module.exports = mongoose.model('User', userSchema);
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const linkFlair = new Schema({
    content: {
        type: String,
        required: true,
        maxlength: 30
    }
});

linkFlair.virtual('url').get(function() {
    return 'linkFlairs/' + this._id;
});

module.exports = mongoose.model('LinkFlair', linkFlair);
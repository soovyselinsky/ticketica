const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        unique: true
    },
    country: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    zipCode: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    emailVerified: {
        type: Boolean,
        default: true
    }
},
{ timestamps: true });

const usersDB = mongoose.model('users', userSchema);

module.exports = { usersDB };
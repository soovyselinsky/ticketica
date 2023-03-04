const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ticketUsersSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    // ticketId: {
    //     type: tickets
    // }
},
{ timestamps: true });

const ticketUsersDB = mongoose.model('ticketUsers', ticketUsersSchema);

module.exports = { ticketUsersDB };
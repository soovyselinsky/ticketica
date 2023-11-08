const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const ticketsSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    ticketName: {
        type: String,
        required: true
    },
    ticketDescription: {
        type: String,
        required: true
    },
    flyer: {
        type: String,
        required: true
    },
    numberOfTickets: {
        type: Array,
        default: []
    },
    expiryDate: {
        type: Date,
        required: true
    },
    eventTimeAndDate: {
        type: Date,
        required: true
    },
    viewed: {
        type: Boolean,
        default: false
    },
    eventLocation: {
        type: String,
        required: true
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    confirmDigits: {
        type: Number,
        default: 0
    }
},
{ timestamps: true });

const ticketsDB = mongoose.model('tickets', ticketsSchema);

module.exports = { ticketsDB };

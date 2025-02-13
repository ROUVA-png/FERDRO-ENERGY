const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    name: String,
    service: String,
    amount: Number,
    reference: String,
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', PaymentSchema);

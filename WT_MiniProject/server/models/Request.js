const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    senderName: {
        type: String,
        required: true
    },
    senderEmail: {
        type: String,
        required: true
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    targetRole: {
        type: String,
        required: true
    },
    service: {
        type: String,
        required: true
    },
    budget: String,
    data_size: String,
    message: String,
    status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

if (mongoose.models.Request) {
    module.exports = mongoose.model('Request');
} else {
    module.exports = mongoose.model('Request', requestSchema);
}
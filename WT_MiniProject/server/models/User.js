const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // --- Common Fields ---
    contact: String,
    about: String,
    legal: String,

    // --- Analyst Specific Fields ---
    specialization: String,
    service: String,
    pricing: String,
    website: String,
    credibility: String,

    // Sub-Role Specific
    years: Number,           // Agency
    team: Number,            // Startup
    portfolio: String,       // Expert (used instead of website)
    timing: String,          // Expert

    // --- Enterprise Specific Fields ---
    industry: String,
    budget: Number,
    data_size: String,

    // --- New Rating Fields ---
    rating: {
        type: Number,
        default: 0
    },
    ratingCount: {
        type: Number,
        default: 0
    }
});

if (mongoose.models.User) {
    module.exports = mongoose.model('User');
} else {
    module.exports = mongoose.model('User', userSchema);
}
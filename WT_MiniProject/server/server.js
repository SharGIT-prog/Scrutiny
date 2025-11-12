//Version 9 - Final Search and Filter Logic
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// === Load Models Safely ===
require(path.join(__dirname, 'models', 'User'));
require(path.join(__dirname, 'models', 'Request'));

const User = mongoose.model('User');
const Request = mongoose.model('Request');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.jsx')) {
            res.setHeader('Content-Type', 'text/babel');
        }
    }
}));

// === MongoDB Connection ===
mongoose
    .connect('mongodb://127.0.0.1:27017/scrutinyDB')
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

// === SIGNUP ROUTE (Unchanged) ===
app.post('/api/signup', async (req, res) => {
    try {
        const userData = req.body;
        const { email, password, role } = userData;

        if (!email || !password || !role)
            return res.status(400).json({ success: false, message: 'Missing required fields.' });

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ success: false, message: 'User already exists!' });
        }

        const newUser = new User(userData);
        await newUser.save();

        res.json({ success: true, message: 'Registration successful!' });
    } catch (err) {
        console.error('Signup error:', err);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation failed: ' + err.message });
        }
        res.status(500).json({ success: false, message: 'Server error while saving user.' });
    }
});

// === LOGIN ROUTE (Unchanged) ===
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ success: false, message: 'Email and password required.' });

        const user = await User.findOne({ email, password }).select('role name email _id');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        res.json({ success: true, message: 'Login successful!', name: user.name, role: user.role, id: user._id });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ success: false, message: 'Server error during login.' });
    }
});

// === REQUEST SUBMISSION ROUTE (Unchanged) ===
app.post('/api/requests', async (req, res) => {
    const { senderId, targetId, service, message, budget, data_size, senderName, senderEmail, targetRole } = req.body;

    if (!senderId || !targetId || !service || !senderName || !senderEmail || !targetRole) {
        return res.status(400).json({ success: false, message: 'Missing required request details.' });
    }

    try {
        const newRequest = new Request({
            senderId,
            senderName,
            senderEmail,
            targetId,
            targetRole,
            service,
            message,
            budget,
            data_size,
            status: 'Pending'
        });

        await newRequest.save();
        res.status(201).json({ success: true, message: 'Project request sent successfully!' });
    } catch (error) {
        console.error('CRITICAL DATABASE ERROR:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation failed: ' + error.message });
        }
        res.status(500).json({ success: false, message: 'Server error while saving request. Check console for details.' });
    }
});

// =================================
// 1. GET /api/users/:targetRole (List Opposite Users with Dynamic Filtering & Sorting)
// =================================
app.get('/api/users/:targetRole', async (req, res) => {
    const baseTargetRole = req.params.targetRole;
    const queryParams = req.query;

    try {
        let filter = {};
        let sort = { createdAt: -1 };

        // CRITICAL FIX: Base role filter based on query (which holds the specific sub-role)
        if (queryParams.role) {
            // Filter by the specific sub-role chosen in the dropdown (e.g., 'Analyst - Agency')
            filter.role = queryParams.role;
            delete queryParams.role; // Remove from generic processing
        } else {
            // If no specific sub-role chosen, filter by the base role type (e.g., all 'Analyst' roles)
            filter.role = { $regex: new RegExp(`^${baseTargetRole}`, 'i') };
        }

        // Process dynamic filters (e.g., industry, legal, budget_min, team_min)
        for (const key in queryParams) {
            const value = queryParams[key];
            if (!value) continue;

            if (key === 'sort_by_rating' && value === 'desc') {
                sort = { rating: -1, ratingCount: -1 }; // Sort by rating descending, then by count
                continue; // Do not add to filter object
            }

            if (key.endsWith('_min')) {
                const numberValue = parseFloat(value);
                if (isNaN(numberValue)) continue;

                // Mongoose schema key (e.g., 'budget', 'years', 'team')
                const mongoKey = key.replace('_min', '');

                if (!filter[mongoKey]) filter[mongoKey] = {};
                filter[mongoKey].$gte = numberValue;

            } else {
                // Simple case-insensitive text search for strings (industry, legal, pricing, etc.)
                filter[key] = { $regex: new RegExp(value, 'i') };
            }
        }

        const users = await User.find(filter).select('-password -createdAt -__v').sort(sort);

        res.json({ success: true, users: users });
    } catch (error) {
        console.error('Error fetching opposite users with filters:', error);
        res.status(500).json({ success: false, message: 'Server error fetching user list with filters.' });
    }
});

// =================================
// 2. GET /api/user/:id (Unchanged)
// =================================
app.get('/api/user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId).select('-password -__v');
        

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        res.json({ success: true, user });
    } catch (error) {
        console.error('Error fetching single user profile:', error);
        res.status(500).json({ success: false, message: 'Server failed to retrieve profile.' });
    }
});

// =================================
// 3. PUT /api/user/:id (Unchanged)
// =================================
app.put('/api/user/:id', async (req, res) => {
    const userId = req.params.id;
    const updateData = { ...req.body };

    try {
        if (updateData.password === '') {
            delete updateData.password;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password -__v');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User not found for update.' });
        }

        res.json({ success: true, message: 'Profile updated successfully!', user: updatedUser });
    } catch (error) {
        console.error('Error updating user profile:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation failed: ' + error.message });
        }
        res.status(500).json({ success: false, message: 'Server error during profile update.' });
    }
});

// =================================
// 4. DELETE /api/user/:id (Unchanged)
// =================================
app.delete('/api/user/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await User.findByIdAndDelete(userId);

        if (!result) {
            return res.status(404).json({ success: false, message: 'User not found for deletion.' });
        }

        await Request.deleteMany({ $or: [{ senderId: userId }, { targetId: userId }] });

        res.json({ success: true, message: 'Profile and associated data deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user profile:', error);
        res.status(500).json({ success: false, message: 'Server error during profile deletion.' });
    }
});

// =================================
// 5. GET /api/requests/:userId (New: Get all requests for a user - Sent or Received)
// =================================
app.get('/api/requests/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        // Fetch all requests where the user is the sender
        const sentRequests = await Request.find({ senderId: userId }).sort({ timestamp: -1 });
        // Fetch all requests where the user is the target
        const receivedRequests = await Request.find({ targetId: userId }).sort({ timestamp: -1 });

        const pendingSent = sentRequests.filter(req => req.status === 'Pending' || req.status === 'Rejected');
        const confirmedAndCompletedSent = sentRequests.filter(req => req.status === 'Accepted' || req.status === 'Completed');

        const pendingReceived = receivedRequests.filter(req => req.status === 'Pending');
        const confirmedAndCompletedReceived = receivedRequests.filter(req => req.status === 'Accepted' || req.status === 'Completed');

        // Combine lists for frontend convenience
        const confirmed = [
            ...confirmedAndCompletedSent.filter(req => req.status === 'Accepted'),
            ...confirmedAndCompletedReceived.filter(req => req.status === 'Accepted')
        ].sort((a, b) => b.timestamp - a.timestamp); // Sort combined list

        const finished = [
            ...confirmedAndCompletedSent.filter(req => req.status === 'Completed'),
            ...confirmedAndCompletedReceived.filter(req => req.status === 'Completed')
        ].sort((a, b) => b.timestamp - a.timestamp); // Sort combined list

        res.json({ 
            success: true, 
            pendingSent: pendingSent, 
            pendingReceived: pendingReceived,
            confirmed: confirmed,
            finished: finished
        });

    } catch (error) {
        console.error('Error fetching requests:', error);
        res.status(500).json({ success: false, message: 'Server error fetching requests.' });
    }
});

// =================================
// 6. POST /api/requests/action/:requestId (Unchanged - Logic handles rating and status update)
// =================================
app.post('/api/requests/action/:requestId', async (req, res) => {
    const { requestId } = req.params;
    const { action, rating } = req.body; // action: 'Accept', 'Reject', 'Complete'

    try {
        const request = await Request.findById(requestId);

        if (!request) {
            return res.status(404).json({ success: false, message: 'Request not found.' });
        }

        if (action === 'Accept') {
            await Request.findByIdAndUpdate(requestId, { status: 'Accepted' });
            return res.json({ success: true, message: 'Request accepted.' });
        } else if (action === 'Reject') {
            await Request.findByIdAndUpdate(requestId, { status: 'Rejected' });
            return res.json({ success: true, message: 'Request rejected.' });
        } else if (action === 'Complete') {
            if (request.status !== 'Accepted') {
                return res.status(400).json({ success: false, message: 'Only accepted requests can be marked as complete.' });
            }
            if (rating === undefined || rating < 0 || rating > 10) {
                return res.status(400).json({ success: false, message: 'Rating must be a number between 0 and 10.' });
            }

            // 1. Update Request status
            await Request.findByIdAndUpdate(requestId, { status: 'Completed', rating: rating }); // Store rating on the request object

            // 2. Update Sender's rating (The person who INITIALLY SENT the request is being rated for their project)
            const senderId = request.senderId;
            const senderUser = await User.findById(senderId);

            if (senderUser) {
                const currentRating = senderUser.rating || 0;
                const currentCount = senderUser.ratingCount || 0;

                const newRatingCount = currentCount + 1;
                // Calculate new average rating
                const newTotalRating = (currentRating * currentCount) + rating;
                const newAvgRating = newTotalRating / newRatingCount;

                await User.findByIdAndUpdate(senderId, {
                    rating: newAvgRating,
                    ratingCount: newRatingCount
                });
            }

            return res.json({ success: true, message: `Request marked as completed. Rating (${rating}/10) applied to sender.` });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action.' });
        }

    } catch (error) {
        console.error(`Error performing action ${action} on request:`, error);
        res.status(500).json({ success: false, message: `Server error during request ${action}.` });
    }
});




// === Other Routes (Legacy - Will be removed as part of the React rewrite, but kept for now) ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});



// ==============================================
// === CSV ANALYSIS HANDLERS (KEPT UNCHANGED) ===
// ==============================================
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const math = require('mathjs');
const upload = multer({ storage: multer.memoryStorage() });

const calculateMode = (values) => {
    const frequency = {};
    let maxFreq = 0;
    let modes = [];

    for (const val of values) {
        frequency[val] = (frequency[val] || 0) + 1;
        if (frequency[val] > maxFreq) {
            maxFreq = frequency[val];
        }
    }

    if (maxFreq <= 1) return 'N/A (No Repeats)';

    for (const key in frequency) {
        if (frequency[key] === maxFreq) {
            modes.push(parseFloat(key));
        }
    }
    
    return modes.length === 1 ? modes[0] : 'Multi-modal'; 
};

const calculateDistribution = (data, column) => {
    const counts = data.reduce((acc, row) => {
        const value = row[column] ? String(row[column]).trim() : '(Missing)';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
    }, {});
    
    return Object.keys(counts).map(key => ({ 
        category: key, 
        count: counts[key] 
    }));
};

/**
 * Utility to clean a string value by removing currency/separators.
 */
const cleanAndParse = (value) => {
    if (value === undefined || value === null) return NaN;
    // 1. Convert to string, trim whitespace
    let strValue = String(value).trim();
    
    // 2. Remove common non-numeric characters: $, €, %, and commas (thousands separators)
    strValue = strValue.replace(/[$,€%]/g, '').replace(/,/g, '');
    
    // 3. Attempt to parse as a float
    const parsed = parseFloat(strValue);
    
    // 4. Return the parsed value, checking if it's a finite number
    return isFinite(parsed) && strValue.length > 0 ? parsed : NaN;
};

/**
 * Main function to analyze CSV records.
 */
const analyzeRecords = (data) => {
    if (data.length === 0) return { error: 'No records found in CSV.' };
    
    const columns = Object.keys(data[0]);
    const analysisResults = {
        columns: columns,
        stats: {},
        plotData: {},
        recordCount: data.length
    };

    columns.forEach(col => {
        const totalRecords = data.length;
        let numericalCount = 0;
        let nonNumericalCount = 0;

        const sampleSize = Math.min(totalRecords, 50);

        for (let i = 0; i < sampleSize; i++) {
            const rawValue = data[i][col];
            
            if (rawValue && String(rawValue).trim() !== '') {
                const cleaned = cleanAndParse(rawValue);
                if (!isNaN(cleaned)) {
                    numericalCount++;
                } else {
                    nonNumericalCount++;
                }
            }
        }

        const totalSampledNonEmpty = numericalCount + nonNumericalCount;
        const isNumerical = totalSampledNonEmpty > 0 && (numericalCount / totalSampledNonEmpty >= 0.8);
        
        if (isNumerical) {
            // --- Numerical Analysis ---
            const numericalValues = data
                .map(row => cleanAndParse(row[col])) 
                .filter(val => !isNaN(val))
                .sort((a, b) => a - b);

            if (numericalValues.length > 0) {
                const mean = math.mean(numericalValues);
                const median = math.median(numericalValues);
                const mode = calculateMode(numericalValues);
                
                const trend = numericalValues.length > 1 && numericalValues[numericalValues.length - 1] > numericalValues[0] ? 'Increasing' : 'Flat/Decreasing';

                analysisResults.stats[col] = {
                    mean: mean,
                    median: median,
                    mode: mode,
                    trend: trend,
                    profit_status: col.toLowerCase().includes('revenue') || col.toLowerCase().includes('profit') ? 
                        (mean > 0 ? 'Positive' : 'Negative/Breakeven') : 'N/A'
                };
            }
        } else {
            // --- Categorical Analysis / Plotting Data ---
            analysisResults.plotData[col] = calculateDistribution(data, col);
        }
    });

    return analysisResults;
};

// =================================
// POST /api/analyze (CSV Analysis Endpoint)
// =================================
app.post('/api/analyze', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No CSV file uploaded.' });
    }

    const fileBuffer = req.file.buffer;
    const records = [];

    // Convert Buffer to a Readable stream for csv-parser
    const bufferStream = new Readable();
    bufferStream.push(fileBuffer);
    bufferStream.push(null);
    
    // CRITICAL: Set the parser options to trim headers and handle common encoding issues
    const csvParserOptions = {
        mapHeaders: ({ header }) => header.trim(), // Crucial: Trim whitespace from headers
        headers: undefined, // Let csv-parser auto-detect headers
    };

    bufferStream
        .pipe(csv(csvParserOptions))
        .on('data', (data) => records.push(data))
        .on('end', () => {
            if (records.length === 0) {
                return res.status(422).json({ error: 'CSV file is empty or improperly formatted.' });
            }
            
            console.log("--- CSV PARSER DIAGNOSTICS ---");
            console.log("Detected Column Headers:", Object.keys(records[0]));
            console.log("First Data Row:", records[0]);
            console.log("Total Records Parsed:", records.length);
            console.log("------------------------------");

            try {
                const results = analyzeRecords(records);
                res.json(results);
            } catch (e) {
                console.error("Analysis Processing Error:", e);
                res.status(500).json({ error: 'Error processing data. Check CSV format.' });
            }
        })
        .on('error', (error) => {
            console.error("CSV Parsing Error:", error);
            res.status(500).json({ error: 'Failed to parse CSV stream.' });
        });
});




// === Start Server ===
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));   
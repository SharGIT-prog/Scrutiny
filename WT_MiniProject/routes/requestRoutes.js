const express = require('express');
const router = express.Router();
// Import the Request model
const Request = require('../models/Request'); 
// Import the User model (needed for population reference)
const User = require('../models/User'); 
// 💡 NEW PATH: Import the controller from the root directory
const { updateUserConnections } = require('../userController'); 

// --- Helper function for fetching requests (handles population) ---
const fetchRequests = async (query) => {
    return await Request.find(query)
        // Populate the senderId field and select only the 'name' property
        .populate('senderId', 'name')
        // Populate the targetId field (This represents the receiver user)
        .populate('targetId', 'role') 
        .exec();
};

// ======================================================
// 1. GET /api/requests/sent/:userId
// Fetch all requests sent by the user 
// ======================================================
router.get('/sent/:userId', async (req, res) => {
    try {
        const sentRequests = await fetchRequests({ senderId: req.params.userId });
        
        const formattedRequests = sentRequests.map(req => ({
            _id: req._id,
            service: req.service || 'Service N/A',
            message: req.message || 'No description.',
            senderName: req.senderName || (req.senderId ? req.senderId.name : 'Unknown Sender'), 
            targetRole: req.targetRole || (req.targetId ? req.targetId.role : 'Unknown Role'), 
            status: req.status
        }));
        
        res.json(formattedRequests); 
    } catch (err) {
        console.error("Error fetching sent requests:", err);
        res.status(500).json({ message: 'Failed to fetch sent requests.' });
    }
});

// ======================================================
// 2. GET /api/requests/received/:userId
// Fetch pending requests received by the user
// ======================================================
router.get('/received/:userId', async (req, res) => {
    try {
        const receivedRequests = await fetchRequests({ targetId: req.params.userId, status: 'Pending' });

        const formattedRequests = receivedRequests.map(req => ({
            _id: req._id,
            service: req.service || 'Service N/A',
            message: req.message || 'No description.',
            senderName: req.senderName || (req.senderId ? req.senderId.name : 'Unknown Sender'), 
            targetRole: req.targetRole || (req.targetId ? req.targetId.role : 'Unknown Role'),
            status: req.status
        }));
        
        res.json(formattedRequests); 
    } catch (err) {
        console.error("Error fetching received requests:", err);
        res.status(500).json({ message: 'Failed to fetch received requests.' });
    }
});

// ======================================================
// 3. PUT /api/requests/:id/accept 
// ======================================================
router.put('/:id/accept', async (req, res) => {
    try {
        const requestId = req.params.id;
        
        const request = await Request.findByIdAndUpdate(
            requestId, 
            { status: 'Accepted' }, 
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        // INTEGRATION: Call the new controller function to update connections
        await updateUserConnections(
            request.senderId, 
            request.targetId, 
            request.service
        );

        res.json({ success: true, message: 'Request accepted and connection established.' });
    } catch (err) {
        console.error("Error accepting request:", err);
        res.status(500).json({ message: 'Failed to accept request.' });
    }
});

// ======================================================
// 4. DELETE /api/requests/:id (For rejection)
// ======================================================
router.delete('/:id', async (req, res) => {
    try {
        const request = await Request.findByIdAndDelete(req.params.id);
        
        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }
        
        res.json({ success: true, message: 'Request rejected/deleted successfully.' });
    } catch (err) {
        console.error("Error rejecting request:", err);
        res.status(500).json({ message: 'Failed to reject request.' });
    }
});


module.exports = router;
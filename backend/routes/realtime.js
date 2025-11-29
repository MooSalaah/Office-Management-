const express = require('express');
const router = express.Router();
const logger = require('../logger');

// Store connected clients for broadcasting
const clients = new Set();
const recentUpdates = [];
const MAX_UPDATES = 100;

// Helper to set CORS headers dynamically
const setCorsHeaders = (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Headers', 'Cache-Control, Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
};

// SSE endpoint for real-time updates
router.get('/', (req, res) => {
  // Set headers for SSE with proper CORS
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Headers': 'Cache-Control, Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    message: 'Connected to realtime updates',
    timestamp: Date.now()
  })}\n\n`);

  // Add client to the set
  clients.add(res);

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(res);
    logger.info(`Client disconnected. Total clients: ${clients.size}`, { clientsCount: clients.size }, 'REALTIME');
  });

  logger.info(`Client connected. Total clients: ${clients.size}`, { clientsCount: clients.size }, 'REALTIME');
});

// Polling endpoint for updates since a specific timestamp
router.get('/poll', (req, res) => {
  setCorsHeaders(req, res);

  const since = parseInt(req.query.since) || 0;

  // Filter updates since the given timestamp
  const updates = recentUpdates.filter(update => update.timestamp > since);

  res.json({
    success: true,
    updates: updates,
    clientsCount: clients.size
  });
});

// Broadcast endpoint for sending updates
router.post('/broadcast', (req, res) => {
  setCorsHeaders(req, res);

  try {
    const update = req.body;

    // Validate update structure
    if (!update.type || !update.action || !update.data) {
      return res.status(400).json({ error: 'Invalid update structure' });
    }

    // Add timestamp if not present
    if (!update.timestamp) {
      update.timestamp = Date.now();
    }

    // Store update in recent updates
    recentUpdates.push(update);

    // Keep only recent updates
    if (recentUpdates.length > MAX_UPDATES) {
      recentUpdates.shift();
    }

    // Broadcast to all connected clients
    const message = `data: ${JSON.stringify(update)}\n\n`;
    let broadcastCount = 0;

    clients.forEach((client) => {
      try {
        client.write(message);
        broadcastCount++;
      } catch (error) {
        // Remove disconnected client
        clients.delete(client);
      }
    });

    // Log broadcast for debugging
    logger.info(`📡 Broadcasted ${update.type} ${update.action} to ${broadcastCount} clients`, {
      type: update.type,
      action: update.action,
      broadcastCount,
      clientsCount: clients.size
    }, 'REALTIME');

    res.json({
      success: true,
      clientsCount: clients.size,
      broadcastCount,
      update: {
        type: update.type,
        action: update.action,
        timestamp: update.timestamp
      }
    });
  } catch (error) {
    console.error('Error broadcasting update:', error);
    res.status(500).json({ error: 'Failed to broadcast update' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  setCorsHeaders(req, res);

  res.json({
    success: true,
    clientsCount: clients.size,
    recentUpdatesCount: recentUpdates.length,
    message: 'Realtime service is active'
  });
});

module.exports = router;
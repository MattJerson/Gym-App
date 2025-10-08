// Simple Express endpoint to serve admin-only weekly leaderboard
// Usage: set ADMIN_SECRET environment variable to a strong shared secret
// Start with: node backend/admin-weekly-leaderboard.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const GamificationDataService = require('../services/GamificationDataService').default || require('../services/GamificationDataService');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const ADMIN_SECRET = process.env.ADMIN_SECRET || process.env.VITE_ADMIN_SECRET;
if (!ADMIN_SECRET) {
  console.warn('ADMIN_SECRET is not set. This endpoint will reject requests without the correct secret.');
}

// Middleware to check admin header
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-secret'] || req.query.admin_secret;
  if (!token || token !== ADMIN_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

app.get('/api/admin/weekly-leaderboard', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(1000, Number(req.query.limit) || 100);
    // Call server-side admin method that returns full leaderboard including user info
    const leaderboard = await GamificationDataService.getAdminWeeklyLeaderboard(limit);
    return res.json({ success: true, data: leaderboard });
  } catch (err) {
    console.error('Admin leaderboard error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Admin leaderboard endpoint listening on port ${PORT}`);
});

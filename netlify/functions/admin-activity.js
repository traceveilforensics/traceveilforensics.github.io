const localDB = require('./local-db');
const { requireAdmin } = require('./utils/auth');
const fs = require('fs');
const path = require('path');

const ACTIVITY_LOG_FILE = path.join(__dirname, '..', 'data', 'activity-log.json');

localDB.initDB();

function readActivityLog() {
  try {
    if (fs.existsSync(ACTIVITY_LOG_FILE)) {
      return JSON.parse(fs.readFileSync(ACTIVITY_LOG_FILE, 'utf8'));
    }
    return [];
  } catch (e) {
    return [];
  }
}

function writeActivityLog(logs) {
  fs.writeFileSync(ACTIVITY_LOG_FILE, JSON.stringify(logs, null, 2));
}

function logActivity(adminId, adminEmail, action, details, ipAddress = 'unknown') {
  const logs = readActivityLog();
  const newLog = {
    id: localDB.generateId(),
    adminId,
    adminEmail,
    action,
    details,
    ipAddress,
    timestamp: new Date().toISOString()
  };
  logs.unshift(newLog);
  if (logs.length > 1000) logs.pop();
  writeActivityLog(logs);
  return newLog;
}

exports.handler = requireAdmin(async (event) => {
  const httpMethod = event.httpMethod;

  if (httpMethod === 'GET') {
    try {
      const { limit = 50, offset = 0, action, startDate, endDate } = event.queryStringParameters || {};
      
      let logs = readActivityLog();
      
      if (action) {
        logs = logs.filter(l => l.action.includes(action));
      }
      
      if (startDate) {
        logs = logs.filter(l => new Date(l.timestamp) >= new Date(startDate));
      }
      
      if (endDate) {
        logs = logs.filter(l => new Date(l.timestamp) <= new Date(endDate));
      }
      
      const total = logs.length;
      logs = logs.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
      
      logActivity(
        event.user.userId,
        'admin',
        'view_activity_log',
        `Viewed activity log with ${logs.length} entries`,
        event.headers['x-forwarded-for'] || 'unknown'
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs, total })
      };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }

  if (httpMethod === 'POST') {
    try {
      const { action, details } = JSON.parse(event.body);
      
      const log = logActivity(
        event.user.userId,
        'admin',
        action,
        details,
        event.headers['x-forwarded-for'] || 'unknown'
      );

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, log })
      };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
});

exports.logActivity = logActivity;

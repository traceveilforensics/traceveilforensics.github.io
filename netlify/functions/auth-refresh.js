const localDB = require('./local-db');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('./utils/auth');

localDB.initDB();

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { refreshToken } = JSON.parse(event.body);

    if (!refreshToken) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Refresh token required' }) };
    }

    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid or expired refresh token' }) };
    }

    const users = localDB.readJSON(localDB.USERS_FILE);
    const user = users.find(u => u.id === decoded.userId);

    if (!user || !user.is_active) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'User not found or disabled' }) };
    }

    const accessToken = generateToken(user.id, user.role);
    const newRefreshToken = generateRefreshToken(user.id);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: accessToken,
        refreshToken: newRefreshToken
      })
    };
  } catch (error) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Token refresh failed' }) };
  }
};

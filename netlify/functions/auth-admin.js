/**
 * Auth Admin Function
 * Handles admin-only auth operations (uses service role key)
 */

const SB_URL = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const SB_SVC = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (!SB_SVC) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Service key not configured' })
        };
    }

    try {
        const { action, email, password, userId } = JSON.parse(event.body || '{}');

        let response;

        switch (action) {
            case 'get-users':
                // Get all users
                response = await fetch(`${SB_URL}/auth/v1/admin/users`, {
                    method: 'GET',
                    headers: {
                        'apikey': SB_SVC,
                        'Authorization': `Bearer ${SB_SVC}`
                    }
                });
                break;

            case 'set-password':
                // Set user password
                // First find user by email
                const usersResponse = await fetch(`${SB_URL}/auth/v1/admin/users`, {
                    method: 'GET',
                    headers: {
                        'apikey': SB_SVC,
                        'Authorization': `Bearer ${SB_SVC}`
                    }
                });
                const users = await usersResponse.json();
                const user = users.users?.find(u => u.email === email);
                
                if (!user) {
                    return {
                        statusCode: 404,
                        headers,
                        body: JSON.stringify({ error: 'User not found' })
                    };
                }

                response = await fetch(`${SB_URL}/auth/v1/admin/users/${user.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SB_SVC,
                        'Authorization': `Bearer ${SB_SVC}`
                    },
                    body: JSON.stringify({ password })
                });
                break;

            case 'delete-user':
                // Delete user
                response = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': SB_SVC,
                        'Authorization': `Bearer ${SB_SVC}`
                    }
                });
                break;

            default:
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ error: 'Invalid action' })
                };
        }

        const responseText = await response.text();
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch {
            responseData = responseText;
        }

        return {
            statusCode: response.status,
            headers: {
                ...headers,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(responseData)
        };

    } catch (error) {
        console.error('Auth admin error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

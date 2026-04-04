const SB_URL = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const SB_SVC = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (req.method === 'OPTIONS') {
        return res.status(200).set(headers).send('');
    }

    if (!SB_SVC) {
        return res.status(500).set(headers).json({ error: 'Service key not configured' });
    }

    try {
        const { action, email, password, userId } = req.body || {};
        let response;

        switch (action) {
            case 'get-users':
                response = await fetch(`${SB_URL}/auth/v1/admin/users`, {
                    method: 'GET',
                    headers: {
                        'apikey': SB_SVC,
                        'Authorization': `Bearer ${SB_SVC}`
                    }
                });
                break;

            case 'set-password':
                const usersResponse = await fetch(`${SB_URL}/auth/v1/admin/users`, {
                    method: 'GET',
                    headers: {
                        'apikey': SB_SVC,
                        'Authorization': `Bearer ${SB_SVC}`
                    }
                });
                const usersData = await usersResponse.json();
                const user = usersData.users?.find(u => u.email === email);
                
                if (!user) {
                    return res.status(404).set(headers).json({ error: 'User not found' });
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
                response = await fetch(`${SB_URL}/auth/v1/admin/users/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'apikey': SB_SVC,
                        'Authorization': `Bearer ${SB_SVC}`
                    }
                });
                break;

            default:
                return res.status(400).set(headers).json({ error: 'Invalid action' });
        }

        const responseData = await response.json();
        return res.status(response.status).set(headers).json(responseData);

    } catch (error) {
        console.error('Auth admin error:', error);
        return res.status(500).set(headers).json({ error: error.message });
    }
}

const SB_URL = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const SB_SVC = process.env.SUPABASE_SERVICE_KEY;

export default async function handler(req, res) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    };

    if (req.method === 'OPTIONS') {
        return res.status(200).set(headers).send('');
    }

    if (!SB_SVC) {
        return res.status(500).set(headers).json({ error: 'Service key not configured' });
    }

    try {
        const { table, action, id, data, params } = req.body || {};
        
        let url = `${SB_URL}/rest/v1/${table}`;
        
        if (params) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams.toString()}`;
        }
        
        if (id && (action === 'get' || action === 'update' || action === 'delete')) {
            url += (url.includes('?') ? '&' : '?') + `id=eq.${id}`;
        }

        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': `Bearer ${SB_SVC}`,
                'Prefer': 'return=representation'
            }
        };

        if (data && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        const responseData = await response.json();
        
        return res.status(response.status).set(headers).json(responseData);

    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).set(headers).json({ error: error.message });
    }
}

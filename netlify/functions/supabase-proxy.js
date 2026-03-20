/**
 * Supabase Proxy Function
 * Handles all Supabase API requests with the service role key (kept secret on server)
 */

const SB_URL = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const SB_SVC = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    // Check for service key
    if (!SB_SVC) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Service key not configured' })
        };
    }

    try {
        const { table, action, id, data, params } = JSON.parse(event.body || '{}');
        
        // Build Supabase URL
        let url = `${SB_URL}/rest/v1/${table}`;
        
        // Add query params if any
        if (params) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams.toString()}`;
        }
        
        // Add id filter for single record operations
        if (id && (action === 'get' || action === 'update' || action === 'delete')) {
            url += (url.includes('?') ? '&' : '?') + `id=eq.${id}`;
        }

        // Build request options
        const options = {
            method: event.httpMethod === 'POST' ? 'POST' : 
                    event.httpMethod === 'PUT' ? 'PUT' :
                    event.httpMethod === 'PATCH' ? 'PATCH' :
                    event.httpMethod === 'DELETE' ? 'DELETE' : 'GET',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': `Bearer ${SB_SVC}`,
                'Prefer': 'return=representation'
            }
        };

        // Add body for POST/PUT/PATCH
        if (data && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
            options.body = JSON.stringify(data);
        }

        // Make request to Supabase
        const response = await fetch(url, options);
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
        console.error('Proxy error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

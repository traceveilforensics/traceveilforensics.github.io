export default async function handler(req, res) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    if (req.method === 'OPTIONS') {
        return res.status(200).set(headers).send('');
    }

    try {
        const SB_URL = 'https://eapkpppftrxrwtwjbcen.supabase.co';
        const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTg3NDgsImV4cCI6MjA4NTc3NDc0OH0.5sYSUDqWAp2iId_LMGAZp0Pap-ZChispV8KedbVSBEY';

        const { refresh_token } = req.body;

        if (!refresh_token) {
            return res.status(400).set(headers).json({ error: 'No refresh token provided' });
        }

        const response = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_ANON,
                'Authorization': `Bearer ${SB_ANON}`
            },
            body: JSON.stringify({ refresh_token })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).set(headers).json(data);
        }

        return res.status(200).set(headers).json(data);

    } catch (error) {
        console.error('Auth refresh error:', error);
        return res.status(500).set(headers).json({ error: error.message });
    }
}

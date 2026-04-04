export default async function handler(req, res) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
    };

    if (req.method === 'OPTIONS') {
        return res.status(200).set(headers).send('');
    }

    try {
        const SB_URL = 'https://eapkpppftrxrwtwjbcen.supabase.co';
        const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTg3NDgsImV4cCI6MjA4NTc3NDc0OH0.5sYSUDqWAp2iId_LMGAZp0Pap-ZChispV8KedbVSBEY';

        const type = req.query.type || 'services';
        let data = [];

        if (type === 'services') {
            const response = await fetch(`${SB_URL}/rest/v1/services?select=*&is_active=eq.true`, {
                headers: { 'apikey': SB_ANON, 'Authorization': `Bearer ${SB_ANON}` }
            });
            data = await response.json();
        } else if (type === 'pricing') {
            const response = await fetch(`${SB_URL}/rest/v1/pricing_plans?select=*&is_active=eq.true`, {
                headers: { 'apikey': SB_ANON, 'Authorization': `Bearer ${SB_ANON}` }
            });
            data = await response.json();
        }

        return res.status(200).set(headers).json(data);

    } catch (error) {
        console.error('Public services error:', error);
        return res.status(500).set(headers).json({ error: error.message });
    }
}

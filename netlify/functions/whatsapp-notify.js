// Netlify Function: Send WhatsApp Notification
// Deploy to: netlify/functions/whatsapp-notify.js

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const WHATSAPP_NUMBER = process.env.WHATSAPP_NUMBER || "254731570131";
    const CALLMEBOT_API_KEY = process.env.CALLMEBOT_API_KEY;

    try {
        const formData = JSON.parse(event.body);
        
        const serviceNames = {
            'security-assessment': 'Security Assessment',
            'vulnerability-scanning': 'Vulnerability Scanning',
            'incident-response': 'Incident Response',
            'digital-forensics': 'Digital Forensics',
            'it-solutions': 'IT Solutions',
            'training-awareness': 'Training & Awareness'
        };
        
        const serviceDisplay = serviceNames[formData.service] || formData.service || 'General Inquiry';
        
        const message = `*NEW INQUIRY*%0A%0A` +
            `Name: ${formData.name}%0A` +
            `Email: ${formData.email}%0A` +
            (formData.phone ? `Phone: ${formData.phone}%0A` : '') +
            (formData.company ? `Company: ${formData.company}%0A` : '') +
            `Service: ${serviceDisplay}%0A%0A` +
            `Message:%0A${formData.message}`;

        // Send WhatsApp via CallMeBot
        const url = `https://api.callmebot.com/whatsapp.php?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}&apikey=${CALLMEBOT_API_KEY}`;
        
        await fetch(url);

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to send notification' })
        };
    }
};

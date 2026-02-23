const localDB = require('./local-db');
const { requireAdmin } = require('./utils/auth');
const path = require('path');

localDB.initDB();

const SETTINGS_FILE = path.join(__dirname, '..', 'data', 'settings.json');

exports.handler = requireAdmin(async (event) => {
  const httpMethod = event.httpMethod;

  if (httpMethod === 'GET') {
    try {
      const defaultSettings = {
        siteName: 'Trace Veil Forensics',
        siteUrl: 'https://traceveilforensics.netlify.app',
        supportEmail: 'traceveilforensics@gmail.com',
        adminEmail: 'admin@traceveilforensics.com',
        phone: '+254 731 570 131',
        address: 'Kenya, East Africa',
        
        invoicePrefix: 'TVF-',
        invoiceDueDays: 30,
        taxRate: 0,
        currency: 'KES',
        
        emailNotifications: true,
        invoiceReminders: true,
        reminderDaysBefore: 7,
        
        darkModeDefault: false,
        maintenanceMode: false,
        registrationEnabled: true,
        
        social: {
          facebook: 'https://www.facebook.com/profiles/61586541184898',
          twitter: 'https://x.com/trace_veil98613',
          instagram: 'https://www.instagram.com/traceveilforensics',
          linkedin: 'https://www.linkedin.com/in/traceveilforensics'
        }
      };

      let settings = defaultSettings;
      
      try {
        const fs = require('fs');
        if (fs.existsSync(SETTINGS_FILE)) {
          const saved = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf8'));
          settings = { ...defaultSettings, ...saved };
        }
      } catch (e) {}

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }

  if (httpMethod === 'POST') {
    try {
      const newSettings = JSON.parse(event.body);
      const fs = require('fs');
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, message: 'Settings updated successfully' })
      };
    } catch (error) {
      return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
  }

  return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
});

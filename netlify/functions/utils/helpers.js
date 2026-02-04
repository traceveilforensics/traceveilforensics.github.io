const { supabase } = require('./database');

const logActivity = async (userId, action, entityType = null, entityId = null, details = {}, ipAddress = null, userAgent = null) => {
  try {
    await supabase.from('activity_log').insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress,
      user_agent: userAgent
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();
  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `INV-${year}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return `INV-${year}-0001`;
  }

  const lastNumber = parseInt(data[0].invoice_number.split('-').pop());
  const nextNumber = String(lastNumber + 1).padStart(4, '0');
  return `INV-${year}-${nextNumber}`;
};

const formatCurrency = (amount, currency = 'KES') => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const calculateInvoiceTotals = (items, taxRate = 16, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const taxAmount = (subtotal - discount) * (taxRate / 100);
  const total = subtotal - discount + taxAmount;

  return {
    subtotal,
    tax_amount: taxAmount,
    total
  };
};

const sendEmail = async (to, subject, htmlContent) => {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html: htmlContent
    });
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const generateInvoiceEmail = (invoice, customer, items) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #0A1628; color: #FFD700; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .invoice-details { margin: 20px 0; }
        .total { font-size: 18px; font-weight: bold; color: #0A1628; }
        .button { display: inline-block; padding: 12px 24px; background: #0A1628; color: #FFD700; text-decoration: none; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Trace Veil Forensics</h1>
        </div>
        <div class="content">
          <h2>Invoice ${invoice.invoice_number}</h2>
          <p>Dear ${customer.first_name || 'Valued Customer'},</p>
          <p>Please find your invoice details below:</p>
          <div class="invoice-details">
            <p><strong>Invoice Date:</strong> ${formatDate(invoice.issue_date)}</p>
            <p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>
            <p><strong>Amount Due:</strong> <span class="total">${formatCurrency(invoice.total)}</span></p>
          </div>
          <p>To view your full invoice and make payment, please click the button below:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${process.env.SITE_URL}/customer-dashboard" class="button">View Invoice</a>
          </p>
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = {
  logActivity,
  generateInvoiceNumber,
  formatCurrency,
  formatDate,
  calculateInvoiceTotals,
  sendEmail,
  generateInvoiceEmail
};

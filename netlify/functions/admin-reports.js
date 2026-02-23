const localDB = require('./local-db');
const { requireAdmin } = require('./utils/auth');

localDB.initDB();

exports.handler = requireAdmin(async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  try {
    const invoices = localDB.readJSON(localDB.INVOICES_FILE);

    const totalRevenue = invoices.reduce((sum, inv) => inv.status === 'paid' ? sum + parseFloat(inv.total || 0) : sum, 0);
    const pendingAmount = invoices.reduce((sum, inv) => inv.status === 'sent' || inv.status === 'overdue' ? sum + parseFloat(inv.total || 0) : sum, 0);

    const invoiceStats = {
      total: invoices.length,
      draft: invoices.filter(i => i.status === 'draft').length,
      sent: invoices.filter(i => i.status === 'sent').length,
      paid: invoices.filter(i => i.status === 'paid').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      cancelled: invoices.filter(i => i.status === 'cancelled').length
    };

    const monthlyRevenue = {};
    invoices.forEach(inv => {
      if (inv.status === 'paid' && inv.created_at) {
        const month = inv.created_at.substring(0, 7);
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(inv.total || 0);
      }
    });

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        totalRevenue,
        pendingAmount,
        invoiceStats,
        monthlyRevenue,
        invoices
      })
    };

  } catch (error) {
    console.error('Reports error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});

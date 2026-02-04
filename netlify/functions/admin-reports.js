const { supabase } = require('../utils/database');
const { requireAdmin } = require('../utils/auth');

exports.handler = requireAdmin(async (event) => {
  try {
    const { start_date, end_date } = event.queryStringParameters || {};

    let invoicesQuery = supabase
      .from('invoices')
      .select('created_at, total, status, currency')
      .order('created_at', { ascending: true });

    if (start_date) {
      invoicesQuery = invoicesQuery.gte('created_at', start_date);
    }

    if (end_date) {
      invoicesQuery = invoicesQuery.lte('created_at', end_date);
    }

    const { data: invoices, error: invoicesError } = await invoicesQuery;

    if (invoicesError) throw invoicesError;

    const totalRevenue = invoices.reduce((sum, inv) => inv.status === 'paid' ? sum + parseFloat(inv.total) : sum, 0);
    const pendingAmount = invoices.reduce((sum, inv) => inv.status === 'sent' || inv.status === 'overdue' ? sum + parseFloat(inv.total) : sum, 0);

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
      if (inv.status === 'paid') {
        const month = inv.created_at.substring(0, 7);
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(inv.total);
      }
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});

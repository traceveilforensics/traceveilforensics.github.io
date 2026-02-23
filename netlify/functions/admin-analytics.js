const localDB = require('./local-db');
const { requireAdmin } = require('./utils/auth');

localDB.initDB();

exports.handler = requireAdmin(async (event) => {
  try {
    const users = localDB.readJSON(localDB.USERS_FILE);
    const customers = localDB.readJSON(localDB.CUSTOMERS_FILE);
    const invoices = localDB.readJSON(localDB.INVOICES_FILE);
    const requests = localDB.readJSON(localDB.REQUESTS_FILE);
    const services = localDB.readJSON(localDB.SERVICES_FILE);

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const newUsers = users.filter(u => new Date(u.created_at) > thirtyDaysAgo).length;
    const newRequests = requests.filter(r => new Date(r.created_at) > thirtyDaysAgo).length;

    const paidInvoices = invoices.filter(i => i.status === 'paid');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + parseFloat(i.total || 0), 0);
    const pendingInvoices = invoices.filter(i => i.status === 'sent');

    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthRevenue = invoices
        .filter(inv => {
          const date = new Date(inv.created_at);
          return inv.status === 'paid' && date >= monthStart && date <= monthEnd;
        })
        .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
      monthlyRevenue.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue
      });
    }

    const requestsByStatus = {
      pending: requests.filter(r => r.status === 'pending').length,
      in_progress: requests.filter(r => r.status === 'in_progress').length,
      completed: requests.filter(r => r.status === 'completed').length,
      cancelled: requests.filter(r => r.status === 'cancelled').length
    };

    const requestsByPriority = {
      urgent: requests.filter(r => r.priority === 'urgent').length,
      high: requests.filter(r => r.priority === 'high').length,
      normal: requests.filter(r => r.priority === 'normal').length,
      low: requests.filter(r => r.priority === 'low' || !r.priority).length
    };

    const topServices = services.map(service => {
      const serviceRequests = requests.filter(r => r.service_plan_id === service.id || r.service_plans?.service_id === service.id);
      return {
        name: service.name,
        count: serviceRequests.length
      };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    const recentActivity = [
      ...invoices.slice(-10).map(i => ({ type: 'invoice', action: 'created', item: i.invoice_number, date: i.created_at })),
      ...requests.slice(-10).map(r => ({ type: 'request', action: 'submitted', item: r.title, date: r.created_at })),
      ...users.slice(-10).map(u => ({ type: 'user', action: 'registered', item: u.email, date: u.created_at }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    const customerGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const count = users.filter(u => {
        const date = new Date(u.created_at);
        return date >= monthStart && date <= monthEnd;
      }).length;
      customerGrowth.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        count
      });
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: {
          totalUsers: users.filter(u => u.role === 'customer').length,
          totalCustomers: customers.length,
          totalInvoices: invoices.length,
          totalRequests: requests.length,
          totalServices: services.length,
          newUsersLast30Days: newUsers,
          newRequestsLast30Days: newRequests,
          paidInvoicesCount: paidInvoices.length,
          pendingInvoicesCount: pendingInvoices.length,
          totalRevenue,
          averageInvoiceValue: paidInvoices.length > 0 ? totalRevenue / paidInvoices.length : 0
        },
        charts: {
          monthlyRevenue,
          customerGrowth,
          requestsByStatus,
          requestsByPriority,
          topServices
        },
        recentActivity
      })
    };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
});

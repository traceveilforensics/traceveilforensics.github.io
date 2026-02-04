const { supabase } = require('../utils/database');
const { requireAdmin } = require('../utils/auth');
const { logActivity, sendEmail, generateInvoiceEmail, formatDate } = require('../utils/helpers');

exports.handler = requireAdmin(async (event) => {
  try {
    const invoiceId = event.path.split('/').pop();

    if (event.httpMethod === 'GET') {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (company_name, billing_address, billing_city, billing_state, billing_postal_code, billing_country, users(email, first_name, last_name)),
          invoice_items (*, services(name), service_plans(name)),
          payment_transactions (*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error || !invoice) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invoice not found' })
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice })
      };
    }

    if (event.httpMethod === 'PUT') {
      const { status, issue_date, due_date, notes } = JSON.parse(event.body);

      const { data: invoice, error: updateError } = await supabase
        .from('invoices')
        .update({ status, issue_date, due_date, notes })
        .eq('id', invoiceId)
        .select(`
          *,
          customers (company_name, users(email, first_name, last_name))
        `)
        .single();

      if (updateError || !invoice) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invoice not found' })
        };
      }

      await logActivity(event.user.userId, 'update_invoice', 'invoice', invoiceId, { status });

      if (status === 'sent') {
        const { data: fullInvoice } = await supabase
          .from('invoices')
          .select(`
            *,
            customers (company_name, users(email, first_name, last_name)),
            invoice_items (*)
          `)
          .eq('id', invoiceId)
          .single();

        const html = generateInvoiceEmail(fullInvoice, fullInvoice.customers, fullInvoice.invoice_items);
        await sendEmail(
          fullInvoice.customers.users.email,
          `Invoice ${fullInvoice.invoice_number} from Trace Veil Forensics`,
          html
        );
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (error) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Invoice not found' })
        };
      }

      await logActivity(event.user.userId, 'delete_invoice', 'invoice', invoiceId);

      return {
        statusCode: 204,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Invoice detail error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});

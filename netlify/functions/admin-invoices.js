const { supabase } = require('../utils/database');
const { requireAdmin } = require('../utils/auth');
const { generateInvoiceNumber, calculateInvoiceTotals, logActivity, sendEmail, generateInvoiceEmail } = require('../utils/helpers');

exports.handler = requireAdmin(async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const { status, customer_id, limit = 50, offset = 0 } = event.queryStringParameters || {};

      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers (company_name, users(email, first_name, last_name)),
          invoice_items (*)
        `)
        .order('issue_date', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (customer_id) {
        query = query.eq('customer_id', customer_id);
      }

      const { data: invoices, error } = await query.range(offset, offset + parseInt(limit) - 1);

      if (error) throw error;

      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices, total: count })
      };
    }

    if (event.httpMethod === 'POST') {
      const { customer_id, items, issue_date, due_date, notes, discount_amount = 0, tax_rate = 16 } = JSON.parse(event.body);

      if (!customer_id || !items || items.length === 0) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Customer and at least one item are required' })
        };
      }

      const invoice_number = await generateInvoiceNumber();

      const { subtotal, tax_amount, total } = calculateInvoiceTotals(items, tax_rate, discount_amount);

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          invoice_number,
          customer_id,
          issue_date,
          due_date,
          subtotal,
          tax_rate,
          discount_amount,
          tax_amount,
          total,
          notes,
          status: 'draft'
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const invoiceItems = items.map(item => ({
        invoice_id: invoice.id,
        service_plan_id: item.service_plan_id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.quantity * item.unit_price
      }));

      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      await logActivity(event.user.userId, 'create_invoice', 'invoice', invoice.id, { invoice_number });

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice })
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Invoices error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
});

const { supabase, adminQuery } = require('./utils/supabase-admin');
const { verifyToken, rateLimit } = require('./utils/auth');

const ALLOWED_TABLES = ['services', 'pricing_plans', 'customers', 'invoices', 'invoice_items', 'service_requests', 'reviews', 'newsletter_subscribers'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const authHeader = event.headers.authorization || event.headers.Authorization;
  const user = authHeader ? verifyToken(authHeader.split(' ')[1]) : null;

  const { table, action, id, ...params } = JSON.parse(event.body || '{}');

  if (!ALLOWED_TABLES.includes(table)) {
    return {
      statusCode: 400,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid table' })
    };
  }

  try {
    switch (action) {
      case 'list':
        const { data: listData, error: listError } = await supabase.from(table).select('*');
        if (listError) throw listError;
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(listData) };

      case 'get':
        if (!id) throw new Error('ID required');
        const { data: getData, error: getError } = await supabase.from(table).select('*').eq('id', id).single();
        if (getError) throw getError;
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(getData) };

      case 'create':
        if (!user) return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
        const { data: createData, error: createError } = await supabase.from(table).insert(params.data).select().single();
        if (createError) throw createError;
        return { statusCode: 201, headers: CORS_HEADERS, body: JSON.stringify(createData) };

      case 'update':
        if (!user) return { statusCode: 401, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Unauthorized' }) };
        if (!id) throw new Error('ID required');
        const { data: updateData, error: updateError } = await supabase.from(table).update(params.data).eq('id', id).select().single();
        if (updateError) throw updateError;
        return { statusCode: 200, headers: CORS_HEADERS, body: JSON.stringify(updateData) };

      case 'delete':
        if (!user || user.role !== 'admin') return { statusCode: 403, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Forbidden' }) };
        if (!id) throw new Error('ID required');
        const { error: deleteError } = await supabase.from(table).delete().eq('id', id);
        if (deleteError) throw deleteError;
        return { statusCode: 204, headers: CORS_HEADERS, body: '' };

      default:
        return { statusCode: 400, headers: CORS_HEADERS, body: JSON.stringify({ error: 'Invalid action' }) };
    }
  } catch (error) {
    return { statusCode: 500, headers: CORS_HEADERS, body: JSON.stringify({ error: error.message }) };
  }
};

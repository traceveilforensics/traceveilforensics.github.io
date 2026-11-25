const SB_URL = 'https://ehseucihglidozvlgdpt.supabase.co';
const SB_ANON = 'sb_publishable_H0wD1bZnkb4Of9L3DB400w_cOFd-gPb';

const API_BASE = '/api';

const VALID_REDIRECT_URLS = [
    'https://traceveilforensics.netlify.app',
    'https://traceveilforensics.pages.dev'
];

const MAKE_WEBHOOKS = {
    new_customer: '',
    new_request: '',
    new_review: ''
};

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_BASE}/${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(getStoredToken() ? { 'Authorization': `Bearer ${getStoredToken()}` } : {}),
            ...options.headers
        }
    });
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || 'Request failed');
    }
    
    if (response.status === 204) return null;
    return response.json();
}

async function fetchSecure(table, action, data = null, id = null) {
    return apiRequest('secure-api', {
        method: 'POST',
        body: JSON.stringify({ table, action, id, data })
    });
}

async function sendWebhook(eventType, webhookData) {
    const webhookUrl = MAKE_WEBHOOKS[eventType];
    if (!webhookUrl) return;
    
    try {
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event: eventType,
                timestamp: new Date().toISOString(),
                data: webhookData
            })
        });
    } catch (e) {
        console.error('Webhook error:', e);
    }
}

function getRedirectUrl(path = '/reset-password.html') {
    const currentOrigin = window.location.origin;
    if (VALID_REDIRECT_URLS.includes(currentOrigin) || currentOrigin.endsWith('.vercel.app')) {
        return currentOrigin + path;
    }
    return VALID_REDIRECT_URLS[0] + path;
}

let _sb = null;
let _cache = { services: [], pricing: [], customers: [], invoices: [], requests: [], reviews: [] };
let _ready = false;
let _loadingPromise = null;

async function ensureFreshToken() {
    if (!_sb) return;
    const token = localStorage.getItem('token');
    if (token && token !== 'supabase-session') return;
    try {
        const { data } = await _sb.auth.getSession();
        if (data?.session?.access_token) {
            localStorage.setItem('token', data.session.access_token);
            return;
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    } catch (e) {}
}

function init() {
    if (_sb) return;
    
    if (typeof window.supabase !== 'undefined') {
        try {
        _sb = window.supabase.createClient(SB_URL, SB_ANON);
        _loadingPromise = (async () => {
            await ensureFreshToken();
            await loadAllData();
        })();
        } catch (e) {
            console.error('Failed to initialize Supabase client:', e);
        }
    }
}

async function loadAllData() {
    try {
        const [s, p, c, i, r, rv, ii] = await Promise.all([
            fetchSecure('services', 'list'),
            fetchSecure('pricing_plans', 'list'),
            fetchSecure('customers', 'list'),
            fetchSecure('invoices', 'list'),
            fetchSecure('service_requests', 'list'),
            fetchSecure('reviews', 'list'),
            fetchSecure('invoice_items', 'list').catch(() => [])
        ]);
        
        const invoiceItems = ii || [];
        const invoices = (i || []).map(inv => ({
            ...inv,
            items: invoiceItems.filter(item => item.invoice_id === inv.id)
        }));
        
        _cache = {
            services: s || [],
            pricing: (p || []).filter(x => x.is_active),
            customers: c || [],
            invoices: invoices,
            invoice_items: invoiceItems,
            requests: r || [],
            reviews: rv || []
        };
        
        _ready = true;
        window.dispatchEvent(new CustomEvent('authSystemReady'));
    } catch (e) { 
        console.error('Load error:', e); 
    }
}

function isReady() { return _ready; }

async function waitForReady() {
    await ensureFreshToken();
    if (_ready) return;
    if (_loadingPromise) await _loadingPromise;
}

function getServices() { return _cache.services; }
function getPricing() { return _cache.pricing; }
function getCustomers() { return _cache.customers; }
function getInvoices() { return _cache.invoices; }
function getInvoiceItems() { return _cache.invoice_items; }
function getServiceRequests() { return _cache.requests; }
function getReviews() { return _cache.reviews; }

function getRegisteredUsers() { return _cache.customers; }

function getCustomerById(id) {
    return _cache.customers.find(c => c.id === id || c.id == id);
}

function getCustomerByEmail(email) {
    return _cache.customers.find(c => c.email?.toLowerCase() === email?.toLowerCase());
}

async function getCustomerIdForUser(email, authUserId) {
    let customer = getCustomerByEmail(email);
    if (customer) return customer.id;
    
    customer = _cache.customers.find(c => c.user_id === authUserId);
    if (customer) return customer.id;
    
    try {
        const data = await fetchSecure('customers', 'create', {
            email: email,
            user_id: authUserId
        });
        await loadAllData();
        return data?.id;
    } catch (e) {
        console.error('Error creating customer:', e);
        return null;
    }
}

function saveReviews(reviews) { _cache.reviews = reviews; }

async function addCustomer(data) {
    try {
        await fetchSecure('customers', 'create', {
            company_name: data.company_name || data.first_name + ' ' + data.last_name,
            email: data.email,
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            phone: data.phone || '',
            billing_address: data.address || '',
            billing_city: data.city || '',
            billing_country: data.country || 'Kenya'
        });
        await loadAllData();
        sendWebhook('new_customer', { email: data.email, name: data.first_name + ' ' + data.last_name });
        return { success: true };
    } catch (e) {
        console.error('Error adding customer:', e);
        return { success: false, error: e.message };
    }
}

async function updateCustomer(id, data) {
    try {
        await fetchSecure('customers', 'update', data, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating customer:', e);
        return { success: false, error: e.message };
    }
}

async function deleteCustomer(id) {
    try {
        await fetchSecure('customers', 'delete', null, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting customer:', e);
        return { success: false, error: e.message };
    }
}

async function addService(data) {
    try {
        await fetchSecure('services', 'create', {
            name: data.name,
            slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            icon: data.icon || 'fa-shield-alt',
            description: data.description || '',
            is_active: data.active !== false
        });
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error adding service:', e);
        return { success: false, error: e.message };
    }
}

async function updateService(id, data) {
    try {
        await fetchSecure('services', 'update', data, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating service:', e);
        return { success: false, error: e.message };
    }
}

async function deleteService(id) {
    try {
        await fetchSecure('services', 'delete', null, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting service:', e);
        return { success: false, error: e.message };
    }
}

async function addPricingPlan(data) {
    try {
        await fetchSecure('pricing_plans', 'create', {
            service_id: data.service_id,
            name: data.name,
            price: data.price,
            billing_cycle: data.billing_cycle || 'one_time',
            description: data.description || '',
            features: data.features || [],
            is_active: data.active !== false
        });
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error adding pricing plan:', e);
        return { success: false, error: e.message };
    }
}

async function updatePricingPlan(id, data) {
    try {
        await fetchSecure('pricing_plans', 'update', data, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating pricing plan:', e);
        return { success: false, error: e.message };
    }
}

async function deletePricingPlan(id) {
    try {
        await fetchSecure('pricing_plans', 'delete', null, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting pricing plan:', e);
        return { success: false, error: e.message };
    }
}

async function addInvoice(data) {
    try {
        const invoiceNumber = generateInvoiceNumber();
        const today = new Date().toISOString().split('T')[0];
        
        const invoice = await fetchSecure('invoices', 'create', {
            invoice_number: invoiceNumber,
            customer_id: data.customer_id || null,
            customer_email: data.customer_email || '',
            customer_name: data.customer_name || '',
            status: 'sent',
            issue_date: today,
            due_date: data.due_date || today,
            subtotal: data.subtotal || 0,
            tax_amount: data.tax_amount || 0,
            tax_rate: data.tax_rate || 0,
            discount_amount: data.discount_amount || 0,
            total: data.total || 0,
            currency: 'KES',
            notes: data.notes || ''
        });
        
        if (data.items && data.items.length > 0 && invoice?.id) {
            await fetchSecure('invoice_items', 'create', 
                data.items.map(item => ({
                    invoice_id: invoice.id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: item.total
                }))
            );
        }
        
        await loadAllData();
        return { success: true, invoice_number: invoiceNumber, invoice };
    } catch (e) {
        console.error('Error adding invoice:', e);
        return { success: false, error: e.message };
    }
}

async function updateInvoice(id, data) {
    try {
        await fetchSecure('invoices', 'update', data, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating invoice:', e);
        return { success: false, error: e.message };
    }
}

async function deleteInvoice(id) {
    try {
        await fetchSecure('invoices', 'delete', null, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting invoice:', e);
        return { success: false, error: e.message };
    }
}

async function updateServiceRequest(id, data) {
    try {
        const updateData = { ...data };
        if (data.status === 'completed' && !data.completed_date) {
            updateData.completed_date = new Date().toISOString().split('T')[0];
        }
        await fetchSecure('service_requests', 'update', updateData, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating service request:', e);
        return { success: false, error: e.message };
    }
}

async function deleteServiceRequest(id) {
    try {
        await fetchSecure('service_requests', 'delete', null, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting service request:', e);
        return { success: false, error: e.message };
    }
}

async function updateReview(id, data) {
    try {
        const updateData = { ...data };
        if ('flagged' in updateData) {
            updateData.is_approved = !updateData.flagged;
            delete updateData.flagged;
        }
        await fetchSecure('reviews', 'update', updateData, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating review:', e);
        return { success: false, error: e.message };
    }
}

async function addReview(data) {
    try {
        await fetchSecure('reviews', 'create', {
            customer_name: data.customer_name || 'Anonymous',
            customer_email: data.customer_email || '',
            rating: data.rating || 5,
            comment: data.comment || '',
            is_approved: data.is_approved !== undefined ? data.is_approved : false
        });
        await loadAllData();
        sendWebhook('new_review', { rating: data.rating, comment: data.comment });
        return { success: true };
    } catch (e) {
        console.error('Error adding review:', e);
        return { success: false, error: e.message };
    }
}

async function deleteReview(id) {
    try {
        await fetchSecure('reviews', 'delete', null, id);
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting review:', e);
        return { success: false, error: e.message };
    }
}

function saveServices(services) { _cache.services = services; }
function savePricing(pricing) { _cache.pricing = pricing; }
function saveInvoices(invoices) { _cache.invoices = invoices; }
function saveServiceRequests(requests) { _cache.requests = requests; }
function saveCustomers(customers) { _cache.customers = customers; }

function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const count = _cache.invoices.length + 1;
    return `INV-${year}-${String(count).padStart(4, '0')}`;
}

async function addServiceRequest(data) {
    try {
        await fetchSecure('service_requests', 'create', {
            customer_id: data.customer_id || null,
            customer_email: data.customer_email || '',
            customer_name: data.customer_name || '',
            service_plan_id: data.service_plan_id || null,
            service_name: data.service_name || null,
            plan_name: data.plan_name || null,
            title: data.title,
            description: data.description,
            status: 'pending',
            priority: data.priority || 'medium',
            requested_date: new Date().toISOString()
        });
        await loadAllData();
        sendWebhook('new_request', { service: data.service_name, customer: data.customer_email });
        return { success: true };
    } catch (e) {
        console.error('Error adding service request:', e);
        return { success: false, error: e.message };
    }
}

function getNotifications() { return []; }
function markNotificationRead() {}
function clearNotifications() {}

function exportAllData() {
    return {
        services: _cache.services,
        pricing: _cache.pricing,
        customers: _cache.customers,
        invoices: _cache.invoices,
        requests: _cache.requests,
        reviews: _cache.reviews
    };
}

async function getServicesAsync() { await waitForReady(); return _cache.services; }
async function getPricingAsync() { await waitForReady(); return _cache.pricing; }
async function getCustomersAsync() { await waitForReady(); return _cache.customers; }
async function getInvoicesAsync() { await waitForReady(); return _cache.invoices; }
async function getServiceRequestsAsync() { await waitForReady(); return _cache.requests; }
async function getReviewsAsync() { await waitForReady(); return _cache.reviews; }

function onReady(callback) {
    if (_ready) callback();
    else window.addEventListener('authSystemReady', callback, { once: true });
}

function getDashboardStats() {
    const i = _cache.invoices, r = _cache.requests, c = _cache.customers;
    const paid = i.filter(x => x.status === 'paid').reduce((s, x) => s + parseFloat(x.total || 0), 0);
    const pend = i.filter(x => x.status === 'pending' || x.status === 'sent').reduce((s, x) => s + parseFloat(x.total || 0), 0);
    const over = i.filter(x => x.status === 'overdue').reduce((s, x) => s + parseFloat(x.total || 0), 0);
    return {
        totalCustomers: c.length, totalRevenue: paid, pendingAmount: pend, overdueAmount: over,
        paidInvoices: i.filter(x => x.status === 'paid').length,
        pendingInvoices: i.filter(x => x.status === 'pending' || x.status === 'sent').length,
        overdueInvoices: i.filter(x => x.status === 'overdue').length,
        totalInvoices: i.length, totalRequests: r.length,
        pendingRequests: r.filter(x => x.status === 'pending').length,
        completedRequests: r.filter(x => x.status === 'completed').length
    };
}

function getAdminNotifications() {
    const notifications = [];
    const requests = _cache.requests.filter(x => x.status === 'pending');
    const overdueInvoices = _cache.invoices.filter(x => x.status === 'overdue');
    
    if (requests.length > 0) notifications.push({ type: 'warning', message: requests.length + ' pending service request(s)' });
    if (overdueInvoices.length > 0) notifications.push({ type: 'danger', message: overdueInvoices.length + ' overdue invoice(s)' });
    return notifications;
}

async function login(email, password) {
    init();
    
    if (!_sb) return { success: false, error: 'Authentication system not ready' };
    
    try {
        const { data, error } = await _sb.auth.signInWithPassword({ email, password });
        
        if (error) return { success: false, error: error.message };
        
        const role = data.user.user_metadata?.role || 'customer';
        const customerId = await getCustomerIdForUser(email, data.user.id);
        
        const user = {
            id: data.user.id,
            customer_id: customerId,
            email: data.user.email,
            role: role,
            first_name: data.user.user_metadata?.first_name || '',
            last_name: data.user.user_metadata?.last_name || ''
        };
        
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', data.session.access_token);
        return { success: true, user, session: data.session };
    } catch (err) {
        console.error('Login exception:', err);
        return { success: false, error: err.message };
    }
}

async function logout() {
    if (_sb) await _sb.auth.signOut();
    localStorage.removeItem('user');
    localStorage.removeItem('token');
}

function clearAuth() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('loginTime');
}

function getStoredUser() { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; }
function getStoredToken() { return localStorage.getItem('token'); }
function isAuthenticated() { return !!localStorage.getItem('user'); }

async function getCurrentUser() { return getStoredUser(); }

async function register(email, password, metadata = {}) {
    init();
    
    if (!_sb) return { success: false, error: 'Authentication system not ready' };
    
    try {
        const { data, error } = await _sb.auth.signUp({ 
            email, 
            password,
            options: {
                data: {
                    first_name: metadata.first_name || '',
                    last_name: metadata.last_name || '',
                    role: 'customer',
                    ...metadata
                }
            }
        });
        
        if (error) return { success: false, error: error.message };
        
        const customerId = await getCustomerIdForUser(email, data.user?.id);
        
        const user = {
            id: data.user.id,
            customer_id: customerId,
            email: data.user.email,
            role: 'customer',
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || ''
        };
        
        return { success: true, user, session: data.session };
    } catch (err) {
        console.error('Register exception:', err);
        return { success: false, error: err.message };
    }
}

async function requestPasswordReset(email) {
    init();
    
    if (!_sb) return { success: false, error: 'Authentication system not ready' };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { success: false, error: 'Please enter a valid email address' };
    }
    
    try {
        await _sb.auth.resetPasswordForEmail(email, {
            redirectTo: getRedirectUrl('/reset-password.html')
        });
        return { success: true, message: 'If an account exists, you will receive a reset link.' };
    } catch (err) {
        return { success: true, message: 'If an account exists, you will receive a reset link.' };
    }
}

async function updatePassword(newPassword) {
    init();
    
    if (!_sb) return { success: false, error: 'Authentication system not ready' };
    
    try {
        const { data, error } = await _sb.auth.updateUser({ password: newPassword });
        if (error) return { success: false, error: error.message };
        return { success: true, data };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

async function resetCustomerPassword(email) {
    init();
    if (!_sb) return { success: false, error: 'System not ready' };
    
    try {
        await _sb.auth.resetPasswordForEmail(email, {
            redirectTo: getRedirectUrl('/reset-password.html')
        });
        return { success: true, message: 'Password reset email sent' };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

function generateTempPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

window._sb = null;
function getSupabaseClient() {
    if (!_sb) init();
    return _sb;
}

init();

window.authSystem = {
    login, register, logout, clearAuth, getCurrentUser, getStoredUser, isAuthenticated,
    requestPasswordReset, updatePassword, resetCustomerPassword, generateTempPassword,
    getServices, getPricing, getCustomers, getInvoices, getInvoiceItems, getServiceRequests, getReviews,
    getCustomerById, getCustomerByEmail, getCustomerIdForUser, getRegisteredUsers,
    addCustomer, updateCustomer, deleteCustomer,
    addService, updateService, deleteService,
    addPricingPlan, updatePricingPlan, deletePricingPlan,
    generateInvoiceNumber, addInvoice, updateInvoice, deleteInvoice,
    updateServiceRequest, deleteServiceRequest,
    updateReview, deleteReview, addReview,
    saveServices, savePricing, saveInvoices, saveServiceRequests, saveReviews, saveCustomers,
    addServiceRequest,
    getNotifications, markNotificationRead, clearNotifications,
    exportAllData,
    getServicesAsync, getPricingAsync, getCustomersAsync, getInvoicesAsync, getServiceRequestsAsync, getReviewsAsync,
    getDashboardStats, getAdminNotifications,
    isReady, waitForReady, onReady,
    init, getSupabaseClient
};

const EMAILJS_CONFIG = {
    serviceId: 'service_06a051h',
    publicKey: '4iUdRTWOtX5Ix-OPK',
    templates: {
        passwordReset: 'template_2u01c15',
        serviceRequest: 'template_service_request',
        invoiceSent: 'template_invoice_sent',
        serviceComplete: 'template_service_complete',
        welcome: 'template_welcome'
    }
};

async function sendNotification(type, data) {
    if (typeof emailjs === 'undefined') return { success: false, error: 'EmailJS not loaded' };
    
    const templateId = EMAILJS_CONFIG.templates[type];
    if (!templateId || templateId.startsWith('template_')) {
        return { success: false, error: 'Template not configured' };
    }
    
    try {
        const response = await emailjs.send(EMAILJS_CONFIG.serviceId, templateId, data, EMAILJS_CONFIG.publicKey);
        return { success: true, response };
    } catch (error) {
        return { success: false, error: error.text || error.message };
    }
}

async function sendServiceRequestNotification(request) {
    return sendNotification('serviceRequest', {
        to_email: request.customer_email,
        name: request.customer_name,
        request_title: request.title,
        request_id: request.id,
        company_name: 'Trace Veil Forensics'
    });
}

async function sendInvoiceNotification(invoice) {
    return sendNotification('invoiceSent', {
        to_email: invoice.customer_email,
        name: invoice.customer_name,
        invoice_number: invoice.invoice_number,
        total: invoice.total,
        due_date: invoice.due_date,
        company_name: 'Trace Veil Forensics'
    });
}

async function sendServiceCompleteNotification(request) {
    return sendNotification('serviceComplete', {
        to_email: request.customer_email,
        name: request.customer_name,
        request_title: request.title,
        company_name: 'Trace Veil Forensics'
    });
}

async function subscribeNewsletter(email) {
    try {
        await fetchSecure('newsletter_subscribers', 'create', { email, is_active: true });
        return { success: true, message: 'Successfully subscribed!' };
    } catch (e) {
        if (e.message.includes('duplicate')) return { success: true, message: 'Already subscribed!' };
        return { success: false, error: e.message };
    }
}

async function unsubscribeNewsletter(email) {
    try {
        const subscribers = _cache.customers || [];
        const sub = subscribers.find(s => s.email === email);
        if (sub) {
            await fetchSecure('newsletter_subscribers', 'update', { is_active: false, unsubscribed_at: new Date().toISOString() }, sub.id);
        }
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

window.authSystem.sendNotification = sendNotification;
window.authSystem.sendServiceRequestNotification = sendServiceRequestNotification;
window.authSystem.sendInvoiceNotification = sendInvoiceNotification;
window.authSystem.sendServiceCompleteNotification = sendServiceCompleteNotification;
window.authSystem.subscribeNewsletter = subscribeNewsletter;
window.authSystem.unsubscribeNewsletter = unsubscribeNewsletter;

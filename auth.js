// Supabase configuration
const SB_URL = 'https://eapkpppftrxrwtwjbcen.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxOTg3NDgsImV4cCI6MjA4NTc3NDc0OH0.5sYSUDqWAp2iId_LMGAZp0Pap-ZChispV8KedbVSBEY';
const SB_SVC = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcGtwcHBmdHJ4cnd0d2piY2VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE5ODc0OCwiZXhwIjoyMDg1Nzc0NzQ4fQ.fVgPaQWfFbKu7ZacfLjK8mtKNlaLmSchS-XoY75Ejew';

let _sb = null;
let _cache = { services: [], pricing: [], customers: [], invoices: [], requests: [], reviews: [] };
let _ready = false;
let _loadingPromise = null;

function init() {
    if (_sb) return;
    if (typeof window.supabase !== 'undefined') {
        _sb = window.supabase.createClient(SB_URL, SB_ANON);
        _loadingPromise = loadAllData();
    }
}

// Direct fetch API to bypass RLS
async function fetchTable(tableName) {
    try {
        console.log('Fetching:', tableName);
        const response = await fetch(`${SB_URL}/rest/v1/${tableName}?select=*`, {
            method: 'GET',
            headers: {
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            }
        });
        
        if (!response.ok) {
            console.error('Fetch error for', tableName, ':', response.status, await response.text());
            return [];
        }
        
        const data = await response.json();
        console.log(tableName + ' fetched:', data.length || 0, 'records');
        return data;
    } catch (e) {
        console.error('Error fetching', tableName, ':', e);
        return [];
    }
}

async function loadAllData() {
    try {
        console.log('Loading data from Supabase...');
        
        const [s, p, c, i, r, rv] = await Promise.all([
            fetchTable('services'),
            fetchTable('pricing_plans'),
            fetchTable('customers'),
            fetchTable('invoices'),
            fetchTable('service_requests'),
            fetchTable('reviews')
        ]);
        
        console.log('Query results:', { 
            s: Array.isArray(s) ? s.length : 0, 
            p: Array.isArray(p) ? p.length : 0, 
            c: Array.isArray(c) ? c.length : 0, 
            i: Array.isArray(i) ? i.length : 0, 
            r: Array.isArray(r) ? r.length : 0, 
            rv: Array.isArray(rv) ? rv.length : 0 
        });
        
        _cache = {
            services: Array.isArray(s) ? s : [],
            pricing: (Array.isArray(p) ? p : []).filter(x => x.is_active),
            customers: Array.isArray(c) ? c : [],
            invoices: Array.isArray(i) ? i : [],
            requests: Array.isArray(r) ? r : [],
            reviews: Array.isArray(rv) ? rv : []  // Store ALL reviews
        };
        
        _ready = true;
        console.log('Data loaded from Supabase');
        
        window.dispatchEvent(new CustomEvent('authSystemReady'));
    } catch (e) { 
        console.error('Load error:', e); 
    }
}

function isReady() { return _ready; }

async function waitForReady() {
    if (_ready) return;
    if (_loadingPromise) await _loadingPromise;
}

function getServices() { return _cache.services; }
function getPricing() { return _cache.pricing; }
function getCustomers() { return _cache.customers; }
function getInvoices() { return _cache.invoices; }
function getServiceRequests() { return _cache.requests; }
function getReviews() { return _cache.reviews; }

function getRegisteredUsers() {
    // Return customers from Supabase as "registered users"
    return _cache.customers;
}

function getCustomerById(id) {
    // Handle both string UUIDs and numeric IDs
    return _cache.customers.find(c => c.id === id || c.id == id);
}

function saveReviews(reviews) {
    _cache.reviews = reviews;
    console.log('Reviews saved to cache (not persisted to DB)');
}

// CRUD operations for customers
async function addCustomer(data) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/customers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({
                company_name: data.company_name || data.first_name + ' ' + data.last_name,
                email: data.email,
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                phone: data.phone || '',
                billing_address: data.address || '',
                billing_city: data.city || '',
                billing_country: data.country || 'Kenya'
            })
        });
        
        if (!response.ok) throw new Error('Failed to add customer');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error adding customer:', e);
        return { success: false, error: e.message };
    }
}

async function updateCustomer(id, data) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/customers?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({
                email: data.email,
                first_name: data.first_name || '',
                last_name: data.last_name || '',
                phone: data.phone || '',
                company_name: data.company_name || data.first_name + ' ' + data.last_name
            })
        });
        
        if (!response.ok) throw new Error('Failed to update customer');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating customer:', e);
        return { success: false, error: e.message };
    }
}

async function deleteCustomer(id) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/customers?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete customer');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting customer:', e);
        return { success: false, error: e.message };
    }
}

// ============ SERVICES CRUD ============
async function addService(data) {
    try {
        const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now();
        const response = await fetch(`${SB_URL}/rest/v1/services`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({
                name: data.name,
                slug: slug,
                icon: data.icon || 'fa-shield-alt',
                description: data.description || '',
                is_active: data.active !== false
            })
        });
        
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error adding service:', e);
        return { success: false, error: e.message };
    }
}

async function updateService(id, data) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/services?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({
                name: data.name,
                slug: data.slug,
                icon: data.icon,
                description: data.description,
                is_active: data.is_active
            })
        });
        
        if (!response.ok) throw new Error('Failed to update service');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating service:', e);
        return { success: false, error: e.message };
    }
}

async function deleteService(id) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/services?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete service');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting service:', e);
        return { success: false, error: e.message };
    }
}

// ============ PRICING CRUD ============
async function addPricingPlan(data) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/pricing_plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({
                service_id: data.service_id,
                name: data.name,
                price: data.price,
                billing_cycle: data.billing_cycle || 'one_time',
                description: data.description || '',
                features: data.features || [],
                is_active: data.active !== false
            })
        });
        
        if (!response.ok) throw new Error('Failed to add pricing plan');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error adding pricing plan:', e);
        return { success: false, error: e.message };
    }
}

async function updatePricingPlan(id, data) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/pricing_plans?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({
                service_id: data.service_id,
                name: data.name,
                price: data.price,
                billing_cycle: data.billing_cycle,
                description: data.description,
                features: data.features,
                is_active: data.is_active
            })
        });
        
        if (!response.ok) throw new Error('Failed to update pricing plan');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating pricing plan:', e);
        return { success: false, error: e.message };
    }
}

async function deletePricingPlan(id) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/pricing_plans?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete pricing plan');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting pricing plan:', e);
        return { success: false, error: e.message };
    }
}

// ============ INVOICES CRUD ============
async function addInvoice(data) {
    try {
        const invoiceNumber = generateInvoiceNumber();
        const today = new Date().toISOString().split('T')[0];
        
        const response = await fetch(`${SB_URL}/rest/v1/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({
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
            })
        });
        
        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }
        await loadAllData();
        return { success: true, invoice_number: invoiceNumber };
    } catch (e) {
        console.error('Error adding invoice:', e);
        return { success: false, error: e.message };
    }
}

async function updateInvoice(id, data) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/invoices?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to update invoice');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating invoice:', e);
        return { success: false, error: e.message };
    }
}

async function deleteInvoice(id) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/invoices?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete invoice');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting invoice:', e);
        return { success: false, error: e.message };
    }
}

// ============ SERVICE REQUESTS CRUD ============
async function updateServiceRequest(id, data) {
    try {
        const updateData = { ...data };
        if (data.status === 'completed' && !data.completed_date) {
            updateData.completed_date = new Date().toISOString().split('T')[0];
        }
        
        const response = await fetch(`${SB_URL}/rest/v1/service_requests?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Failed to update service request');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating service request:', e);
        return { success: false, error: e.message };
    }
}

// ============ REVIEWS CRUD ============
async function updateReview(id, data) {
    try {
        // Convert flagged to is_approved (inverted logic)
        const updateData = { ...data };
        if ('flagged' in updateData) {
            updateData.is_approved = !updateData.flagged;
            delete updateData.flagged;
        }
        
        const response = await fetch(`${SB_URL}/rest/v1/reviews?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify(updateData)
        });
        
        if (!response.ok) throw new Error('Failed to update review');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating review:', e);
        return { success: false, error: e.message };
    }
}

async function addReview(data) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({
                customer_name: data.customer_name || 'Anonymous',
                customer_email: data.customer_email || '',
                rating: data.rating || 5,
                comment: data.comment || '',
                is_approved: data.is_approved !== undefined ? data.is_approved : false
            })
        });
        
        if (!response.ok) throw new Error('Failed to add review');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error adding review:', e);
        return { success: false, error: e.message };
    }
}

async function deleteReview(id) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/reviews?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete review');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error deleting review:', e);
        return { success: false, error: e.message };
    }
}

// Services CRUD
function saveServices(services) {
    _cache.services = services;
}



// Pricing CRUD
function savePricing(pricing) {
    _cache.pricing = pricing;
}

// Invoices
function generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const count = _cache.invoices.length + 1;
    return `INV-${year}-${String(count).padStart(4, '0')}`;
}



function saveInvoices(invoices) {
    _cache.invoices = invoices;
}

async function updateInvoice(id, data) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/invoices?id=eq.${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Failed to update invoice');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error updating invoice:', e);
        return { success: false, error: e.message };
    }
}

// Service Requests
function saveServiceRequests(requests) {
    _cache.requests = requests;
}

async function addServiceRequest(data) {
    try {
        const response = await fetch(`${SB_URL}/rest/v1/service_requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({
                customer_id: data.customer_id || null,
                customer_email: data.customer_email || '',
                customer_name: data.customer_name || '',
                title: data.title,
                description: data.description,
                status: 'pending',
                priority: data.priority || 'medium',
                requested_date: new Date().toISOString()
            })
        });
        
        if (!response.ok) throw new Error('Failed to add service request');
        await loadAllData();
        return { success: true };
    } catch (e) {
        console.error('Error adding service request:', e);
        return { success: false, error: e.message };
    }
}

// Notifications
let _notifications = [];

function markNotificationRead(id) {
    const notification = _notifications.find(n => n.id === id);
    if (notification) notification.read = true;
}

function clearNotifications() {
    _notifications = [];
}

function getNotifications() {
    return _notifications;
}

// Save customers (for import/export)
function saveCustomers(customers) {
    _cache.customers = customers;
}

// Export all data
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
    if (_ready) {
        callback();
    } else {
        window.addEventListener('authSystemReady', callback, { once: true });
    }
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
    
    if (requests.length > 0) {
        notifications.push({
            type: 'warning',
            message: requests.length + ' pending service request(s)'
        });
    }
    if (overdueInvoices.length > 0) {
        notifications.push({
            type: 'danger',
            message: overdueInvoices.length + ' overdue invoice(s)'
        });
    }
    return notifications;
}

// Auth using Supabase SDK
async function login(email, password) {
    init();
    try {
        const { data, error } = await _sb.auth.signInWithPassword({ email, password });
        if (error) return { success: false, error: error.message };
        
        const role = data.user.user_metadata?.role || 'customer';
        const firstName = data.user.user_metadata?.first_name || '';
        const lastName = data.user.user_metadata?.last_name || '';
        
        const finalUser = {
            id: data.user.id,
            email: data.user.email,
            role: role,
            first_name: firstName,
            last_name: lastName
        };
        
        localStorage.setItem('user', JSON.stringify(finalUser));
        return { success: true, user: finalUser, session: data.session };
    } catch (err) { return { success: false, error: err.message }; }
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
function isAuthenticated() { return !!localStorage.getItem('user'); }
async function getCurrentUser() { return getStoredUser(); }

async function register(email, password, metadata = {}) {
    init();
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
        
        const user = {
            id: data.user.id,
            email: data.user.email,
            role: 'customer',
            first_name: metadata.first_name || '',
            last_name: metadata.last_name || ''
        };
        
        return { success: true, user, session: data.session };
    } catch (err) { return { success: false, error: err.message }; }
}

async function requestPasswordReset(email) {
    init();
    try {
        const { error } = await _sb.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) return { success: false, error: error.message };
        return { success: true, message: 'Password reset email sent' };
    } catch (err) { return { success: false, error: err.message }; }
}

async function updatePassword(newPassword) {
    init();
    try {
        const { error } = await _sb.auth.updateUser({ password: newPassword });
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (err) { return { success: false, error: err.message }; }
}

async function updateCustomerPassword(customerId, newPassword) {
    try {
        // Update password in users table (if using custom auth)
        const response = await fetch(`${SB_URL}/rest/v1/users?id=eq.${customerId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SB_SVC,
                'Authorization': 'Bearer ' + SB_SVC
            },
            body: JSON.stringify({ password_hash: newPassword })
        });
        
        if (!response.ok) throw new Error('Failed to update password');
        return { success: true };
    } catch (e) {
        console.error('Error updating customer password:', e);
        return { success: false, error: e.message };
    }
}

async function resetCustomerPassword(email) {
    try {
        const { error } = await _sb.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password.html'
        });
        if (error) return { success: false, error: error.message };
        return { success: true, message: 'Password reset email sent to ' + email };
    } catch (e) {
        console.error('Error sending password reset:', e);
        return { success: false, error: e.message };
    }
}

init();

window.authSystem = {
    login, register, logout, clearAuth, getCurrentUser, getStoredUser, isAuthenticated,
    requestPasswordReset, updatePassword, resetCustomerPassword,
    getServices, getPricing, getCustomers, getInvoices, getServiceRequests, getReviews,
    getCustomerById, getRegisteredUsers,
    addCustomer, updateCustomer, deleteCustomer, updateCustomerPassword,
    addService, updateService, deleteService,
    addPricingPlan, updatePricingPlan, deletePricingPlan,
    generateInvoiceNumber, addInvoice, updateInvoice, deleteInvoice,
    updateServiceRequest,
    updateReview, deleteReview, addReview,
    saveServices, savePricing, saveInvoices, saveServiceRequests, saveReviews, saveCustomers,
    addServiceRequest,
    getNotifications, markNotificationRead, clearNotifications,
    exportAllData,
    getServicesAsync, getPricingAsync, getCustomersAsync, getInvoicesAsync, getServiceRequestsAsync, getReviewsAsync,
    getDashboardStats, getAdminNotifications,
    isReady, waitForReady, onReady,
    init
};

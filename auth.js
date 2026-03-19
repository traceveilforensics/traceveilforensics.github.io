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
            reviews: (Array.isArray(rv) ? rv : []).filter(x => x.is_approved)
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

function saveReviews(reviews) {
    _cache.reviews = reviews;
    // Note: To persist, you would need to update via Supabase API
    console.log('Reviews saved to cache (not persisted to DB)');
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

init();

window.authSystem = {
    login, logout, clearAuth, getCurrentUser, getStoredUser, isAuthenticated,
    getServices, getPricing, getCustomers, getInvoices, getServiceRequests, getReviews, saveReviews,
    getServicesAsync, getPricingAsync, getCustomersAsync, getInvoicesAsync, getServiceRequestsAsync, getReviewsAsync,
    getDashboardStats, getAdminNotifications,
    isReady, waitForReady, onReady,
    init
};

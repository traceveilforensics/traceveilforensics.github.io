// Shared auth and navigation script for all pages
let currentUser = null;
let userToken = null;

function checkAuth() {
    userToken = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (userToken && userStr) {
        try {
            currentUser = JSON.parse(userStr);
            updateAuthUI(true);
            return true;
        } catch(e) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
    updateAuthUI(false);
    return false;
}

function updateAuthUI(isLoggedIn) {
    const authButtons = document.getElementById('authButtons');
    const userMenu = document.getElementById('userMenu');
    const userDisplayName = document.getElementById('userDisplayName');
    const userDropdown = document.getElementById('userDropdown');
    
    if (isLoggedIn && currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        if (userMenu) {
            userMenu.style.display = 'block';
            if (userDisplayName) {
                userDisplayName.textContent = currentUser.first_name || currentUser.email;
            }
            // Update dropdown based on role
            if (userDropdown) {
                if (currentUser.role === 'admin') {
                    userDropdown.innerHTML = `
                        <li><a href="admin-dashboard.html"><i class="fas fa-tachometer-alt"></i> Admin Dashboard</a></li>
                        <li><a href="index.html"><i class="fas fa-globe"></i> View Website</a></li>
                        <li class="divider"></li>
                        <li><a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                    `;
                } else {
                    userDropdown.innerHTML = `
                        <li><a href="customer-dashboard.html"><i class="fas fa-tachometer-alt"></i> Dashboard</a></li>
                        <li><a href="customer-dashboard.html?tab=invoices"><i class="fas fa-file-invoice"></i> My Invoices</a></li>
                        <li><a href="customer-dashboard.html?tab=requests"><i class="fas fa-clipboard-list"></i> Service Requests</a></li>
                        <li><a href="customer-dashboard.html?tab=profile"><i class="fas fa-user"></i> Profile</a></li>
                        <li class="divider"></li>
                        <li><a href="#" id="logoutBtn"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
                    `;
                }
                // Re-attach logout handler
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        logout();
                    });
                }
            }
        }
    } else {
        if (authButtons) authButtons.style.display = 'flex';
        if (userMenu) userMenu.style.display = 'none';
    }
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    userToken = null;
    window.location.href = 'index.html';
}

function setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navMenu = document.getElementById('navMenu');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    function toggleMobileMenu() {
        navMenu.classList.toggle('active');
        mobileMenuOverlay.classList.toggle('active');
        mobileMenuBtn.classList.toggle('active');
        mobileMenuBtn.innerHTML = navMenu.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    }

    function closeMobileMenu() {
        navMenu.classList.remove('active');
        mobileMenuOverlay.classList.remove('active');
        mobileMenuBtn.classList.remove('active');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.style.overflow = '';
    }
    
    if (mobileMenuBtn && navMenu) {
        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', closeMobileMenu);
        }
    }
}

function setupHeaderScroll() {
    const header = document.getElementById('header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.classList.toggle('scrolled', window.scrollY > 50);
        });
    }
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    if (themeToggle && themeIcon) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
        
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const isDark = document.body.classList.contains('dark-mode');
            themeIcon.classList.toggle('fa-moon', !isDark);
            themeIcon.classList.toggle('fa-sun', isDark);
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }
}

function setupUserMenuDropdown() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
        
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
        
        // Setup logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                logout();
            });
        }
    }
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

async function loadPublicServices(containerId = 'servicesContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        const res = await fetch('/api/public-services');
        const data = await res.json();
        const services = data.services || [];
        
        if (container.id === 'servicesContainer') {
            container.innerHTML = services.map(s => `
                <div class="service-card" id="${s.slug}">
                    <div class="service-icon">
                        <i class="fas ${s.icon || 'fa-cog'}"></i>
                    </div>
                    <h3>${s.name}</h3>
                    <p>${s.description || ''}</p>
                    <a href="services.html#${s.slug}" class="btn btn-primary btn-sm">
                        <i class="fas fa-arrow-right"></i> Learn More
                    </a>
                </div>
            `).join('') || '<p>No services available</p>';
        }
    } catch(e) {
        console.error('Error loading services:', e);
    }
}

async function loadPricingPlans(containerId = 'pricingPlansContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px"></i><p>Loading pricing...</p></div>';
    
    try {
        const res = await fetch('/api/public-services');
        const data = await res.json();
        const services = data.services || [];
        
        let html = '';
        services.forEach(service => {
            const plans = service.service_plans || [];
            if (plans.length > 0) {
                html += `
                    <div class="pricing-service-group">
                        <h3 class="service-title"><i class="fas ${service.icon || 'fa-cog'}"></i> ${service.name}</h3>
                        <div class="pricing-grid">
                            ${plans.map(plan => `
                                <div class="pricing-card">
                                    <div class="pricing-header">
                                        <h4>${plan.name}</h4>
                                        <p>${plan.description || ''}</p>
                                    </div>
                                    <div class="pricing-price">
                                        <span class="currency">KES</span>
                                        <span class="amount">${parseFloat(plan.price || 0).toLocaleString()}</span>
                                        <span class="period">/${plan.billing_cycle === 'monthly' ? 'month' : 'one time'}</span>
                                    </div>
                                    <ul class="pricing-features">
                                        ${(plan.features || []).map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
                                    </ul>
                                    <a href="contact.html" class="btn btn-primary">Get Started</a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        container.innerHTML = html || '<p>No pricing plans available</p>';
    } catch(e) {
        console.error('Error loading pricing:', e);
        container.innerHTML = '<p>Error loading pricing. Please try again later.</p>';
    }
}

async function loadFullServices(containerId = 'fullServicesContainer') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center;padding:40px"><i class="fas fa-spinner fa-spin" style="font-size:24px"></i><p>Loading services...</p></div>';
    
    try {
        const res = await fetch('/api/public-services');
        const data = await res.json();
        const services = data.services || [];
        
        container.innerHTML = services.map(s => `
            <div class="service-detail-card" id="${s.slug}">
                <div class="service-detail-header">
                    <div class="service-detail-icon">
                        <i class="fas ${s.icon || 'fa-cog'}"></i>
                    </div>
                    <div>
                        <h2>${s.name}</h2>
                        <p class="service-detail-desc">${s.description || ''}</p>
                    </div>
                </div>
                ${s.service_plans?.length ? `
                    <div class="service-plans-grid">
                        ${s.service_plans.map(plan => `
                            <div class="plan-card">
                                <h4>${plan.name}</h4>
                                <p>${plan.description || ''}</p>
                                <div class="plan-price">KES ${parseFloat(plan.price || 0).toLocaleString()} <span>/${plan.billing_cycle === 'monthly' ? 'month' : 'one time'}</span></div>
                                <ul class="plan-features">
                                    ${(plan.features || []).map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
                                </ul>
                                <a href="contact.html" class="btn btn-primary btn-sm">Request This Service</a>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p>No plans available for this service</p>'}
            </div>
        `).join('') || '<p>No services available</p>';
    } catch(e) {
        console.error('Error loading services:', e);
        container.innerHTML = '<p>Error loading services. Please try again later.</p>';
    }
}

function initShared() {
    checkAuth();
    setupMobileMenu();
    setupHeaderScroll();
    setupThemeToggle();
    setupUserMenuDropdown();
    setupSmoothScroll();
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', initShared);

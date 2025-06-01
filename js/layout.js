async function loadHTML(elementId, filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to load ${filePath}: ${response.statusText}`);
        }
        const text = await response.text();
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = text;
        } else {
            console.warn(`Element with ID '${elementId}' not found.`);
        }
    } catch (error) {
        console.error(error);
    }
}

function updateNavBasedOnAuth() {
    const token = localStorage.getItem('authToken');
    const dashboardLink = document.getElementById('dashboard-link');
    const mobileDashboardLink = document.getElementById('mobile-dashboard-link');
    const loginLink = document.getElementById('login-link');
    const mobileLoginLink = document.getElementById('mobile-login-link');
    const signupLink = document.getElementById('signup-link');
    const mobileSignupLink = document.getElementById('mobile-signup-link');
    const logoutButton = document.getElementById('header-logout-button');
    const mobileLogoutButton = document.getElementById('mobile-header-logout-button');

    if (token) {
        if (dashboardLink) dashboardLink.classList.remove('hidden');
        if (mobileDashboardLink) mobileDashboardLink.classList.remove('hidden');
        if (loginLink) loginLink.classList.add('hidden');
        if (mobileLoginLink) mobileLoginLink.classList.add('hidden');
        if (signupLink) signupLink.classList.add('hidden');
        if (mobileSignupLink) mobileSignupLink.classList.add('hidden');
        if (logoutButton) logoutButton.classList.remove('hidden');
        if (mobileLogoutButton) mobileLogoutButton.classList.remove('hidden');
    } else {
        if (dashboardLink) dashboardLink.classList.add('hidden');
        if (mobileDashboardLink) mobileDashboardLink.classList.add('hidden');
        if (loginLink) loginLink.classList.remove('hidden');
        if (mobileLoginLink) mobileLoginLink.classList.remove('hidden');
        if (signupLink) signupLink.classList.remove('hidden');
        if (mobileSignupLink) mobileSignupLink.classList.remove('hidden');
        if (logoutButton) logoutButton.classList.add('hidden');
        if (mobileLogoutButton) mobileLogoutButton.classList.add('hidden');
    }
}


async function initializeLayout() {
    await Promise.all([
        loadHTML('header-placeholder', 'shared/header.html'),
        loadHTML('footer-placeholder', 'shared/footer.html')
    ]);

    const currentYearElement = document.getElementById('currentYear');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }
    
    updateNavBasedOnAuth();
    lucide.createIcons();

    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
    
    const logoutButton = document.getElementById('header-logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        });
    }
    const mobileLogoutButton = document.getElementById('mobile-header-logout-button');
    if (mobileLogoutButton) {
        mobileLogoutButton.addEventListener('click', () => {
            localStorage.removeItem('authToken');
            window.location.href = 'login.html';
        });
    }

}

document.addEventListener('DOMContentLoaded', initializeLayout);
export { updateNavBasedOnAuth };

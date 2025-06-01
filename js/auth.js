import { updateNavBasedOnAuth } from './layout.js';

const API_BASE_URL = 'http://localhost:3001/api'; 

function displayMessage(elementId, message, isError = true) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = message;
        el.classList.remove('hidden');
        el.classList.toggle('text-red-400', isError);
        el.classList.toggle('text-green-400', !isError);
    }
}

function clearMessages(...elementIds) {
    elementIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = '';
            el.classList.add('hidden');
        }
    });
}

async function handleLogin(event) {
    event.preventDefault();
    clearMessages('errorMessage');
    const email = event.target.email.value;
    const password = event.target.password.value;

    if (!email || !password) {
        displayMessage('errorMessage', 'Email and password are required.');
        return;
    }
    
    try {
        console.log('Attempting login with:', { email }); 
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Login failed. Please check your credentials.');
        }
        
        console.log('Login successful:', data);
        localStorage.setItem('authToken', data.session.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        updateNavBasedOnAuth();
        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Login error:', error);
        
        if (error.message.includes('Failed to fetch')) {
             displayMessage('errorMessage', 'Simulated Login: Could not connect to server. For demo, redirecting...');
             setTimeout(() => {
                 localStorage.setItem('authToken', 'fake-demo-token-login');
                 localStorage.setItem('user', JSON.stringify({ email: email, id: 'demo-user-id' }));
                 updateNavBasedOnAuth();
                 window.location.href = 'dashboard.html';
             }, 2000);
        } else {
            displayMessage('errorMessage', error.message);
        }
    }
}

async function handleSignup(event) {
    event.preventDefault();
    clearMessages('errorMessage', 'successMessage');
    const email = event.target.email.value;
    const password = event.target.password.value;
    const confirmPassword = event.target['confirm-password'].value;

    if (!email || !password || !confirmPassword) {
        displayMessage('errorMessage', 'All fields are required.');
        return;
    }
    if (password.length < 6) {
        displayMessage('errorMessage', 'Password must be at least 6 characters long.');
        return;
    }
    if (password !== confirmPassword) {
        displayMessage('errorMessage', 'Passwords do not match.');
        return;
    }

    try {
        console.log('Attempting signup with:', { email });
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok && response.status !== 201) {
             throw new Error(data.message || 'Signup failed. Please try again.');
        }
        
        console.log('Signup successful:', data);

        if (data.session && data.session.access_token) { // User auto-logged in
            localStorage.setItem('authToken', data.session.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            displayMessage('successMessage', 'Signup successful! Redirecting to dashboard...', false);
            setTimeout(() => {
                updateNavBasedOnAuth();
                window.location.href = 'dashboard.html';
            }, 2000);
        } else { // Email confirmation might be pending
             displayMessage('successMessage', data.message || 'Signup successful! Please check your email to confirm your account.', false);
             event.target.reset(); // Clear form
        }


    } catch (error) {
        console.error('Signup error:', error);
         if (error.message.includes('Failed to fetch')) {
             displayMessage('errorMessage', 'Simulated Signup: Could not connect to server. For demo, simulating success...');
             setTimeout(() => {
                displayMessage('successMessage', 'Simulated signup successful! Please "login" to continue (no email sent).', false);
                event.target.reset();
             }, 2000);
        } else {
            displayMessage('errorMessage', error.message);
        }
    }
}

export function logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    updateNavBasedOnAuth();
    window.location.href = 'login.html';
}


document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

const CLOUD_API_BASE = 'https://cgpa-calculator-backend-a9kj.onrender.com/api';
const LOCAL_API_BASE = 'http://localhost:5000/api';

function resolveApiBase() {
    if (window.location.protocol === 'https:') {
        return CLOUD_API_BASE;
    }
    const saved = localStorage.getItem('apiBase');
    if (saved && typeof saved === 'string' && saved.startsWith('http')) {
        return saved;
    }
    return CLOUD_API_BASE;
}
let AUTH_API_BASE = resolveApiBase();
let API_URL = `${AUTH_API_BASE}/auth`;

// Background probe for local development server
(async function probeLocalBackend() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        try {
            const ctrl = new AbortController();
            const tm = setTimeout(() => ctrl.abort(), 1200);
            const res = await fetch('http://localhost:5000/health', { signal: ctrl.signal });
            clearTimeout(tm);
            if (res.ok) {
                AUTH_API_BASE = LOCAL_API_BASE;
                API_URL = `${AUTH_API_BASE}/auth`;
                localStorage.setItem('apiBase', LOCAL_API_BASE);
            }
        } catch (e) {
            // Local server not running; stays on CLOUD_API_BASE
        }
    }
})();


const showError = (message) => {
    const errorBox = document.getElementById('error-box');
    if (errorBox) {
        errorBox.textContent = message;
        errorBox.style.display = 'block';
    }
};

// Auth Check (Used to verify session on page loads if needed)
function checkAuth() {
    const user = localStorage.getItem('user');
    if (!user && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('signup.html')) {
        window.location.href = 'login.html';
    }
}

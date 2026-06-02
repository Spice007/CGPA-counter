const getApiBase = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        return 'http://localhost:5000/api';
    }
    return 'https://cgpa-counter-production.up.railway.app/api';
};
const API_BASE = getApiBase();
const API_URL = `${API_BASE}/auth`;


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

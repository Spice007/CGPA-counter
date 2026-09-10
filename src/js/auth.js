const AUTH_API_BASE = 'https://cgpa-calculator-backend-a9kj.onrender.com/api';
const API_URL = `${AUTH_API_BASE}/auth`;


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

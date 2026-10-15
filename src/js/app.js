window.CLOUD_API_BASE = window.CLOUD_API_BASE || 'https://cgpa-calculator-backend-a9kj.onrender.com/api';
window.LOCAL_API_BASE = window.LOCAL_API_BASE || 'http://localhost:5000/api';
var CLOUD_API_BASE = window.CLOUD_API_BASE;
var LOCAL_API_BASE = window.LOCAL_API_BASE;

window.resolveApiBase = window.resolveApiBase || function resolveApiBase() {
    if (window.location.protocol === 'https:') {
        return window.CLOUD_API_BASE;
    }
    const saved = localStorage.getItem('apiBase');
    if (saved && typeof saved === 'string' && saved.startsWith('http')) {
        return saved;
    }
    // Default to cloud so local file:// or static server loads real courses and data immediately
    return window.CLOUD_API_BASE;
};
var resolveApiBase = window.resolveApiBase;
window.API_BASE = window.API_BASE || window.resolveApiBase();
var API_BASE = window.API_BASE;

// Resilient API Fetch Helper with automatic cloud fallback
async function apiFetch(endpoint, options = {}) {
    var url = `${window.API_BASE || API_BASE}${endpoint}`;
    try {
        var res = await fetch(url, options);
        return res;
    } catch (err) {
        if ((window.API_BASE || API_BASE) !== CLOUD_API_BASE) {
            console.warn(`[API] Local backend unreachable. Falling back to Cloud API: ${CLOUD_API_BASE}`);
            API_BASE = CLOUD_API_BASE;
            window.API_BASE = CLOUD_API_BASE;
            localStorage.setItem('apiBase', CLOUD_API_BASE);
            return await fetch(`${CLOUD_API_BASE}${endpoint}`, options);
        }
        throw err;
    }
}

// Background probe for local development server
(async function probeLocalBackend() {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        try {
            const ctrl = new AbortController();
            const tm = setTimeout(() => ctrl.abort(), 1200);
            const res = await fetch('http://localhost:5000/health', { signal: ctrl.signal });
            clearTimeout(tm);
            if (res.ok) {
                API_BASE = LOCAL_API_BASE;
                localStorage.setItem('apiBase', LOCAL_API_BASE);
            }
        } catch (e) {
            // Local server not running; API_BASE stays on CLOUD_API_BASE
        }
    }
})();


const savedUser = JSON.parse(localStorage.getItem('user')) || {};
let cachedProfileData = {};
try {
    cachedProfileData = JSON.parse(localStorage.getItem('cgpa_profile')) || {};
} catch(e) {}

let studentProfile = {
    name: cachedProfileData.name || savedUser.fullName || savedUser.name || '',
    uni: cachedProfileData.uni || savedUser.university || '',
    session: cachedProfileData.session || '2023/2024',
    matric: cachedProfileData.matric || savedUser.matricNumber || '',
    faculty: cachedProfileData.faculty || savedUser.faculty || '',
    department: cachedProfileData.department || savedUser.department || '',
    profilePicture: cachedProfileData.profilePicture || ''
};
if (!studentProfile.name && (savedUser.fullName || savedUser.name)) {
    studentProfile.name = savedUser.fullName || savedUser.name;
}

function formatSemesterName(name) {
    if (!name) return 'Semester';
    // If it ends with " - First" or " - Second" (or has First/Second) without the word "Semester"
    if (/\b(First|Second|1st|2nd)\b/i.test(name) && !/Semester/i.test(name)) {
        return `${name} Semester`;
    }
    return name;
}

function formatToAcademicSession(sessionStr) {
    if (!sessionStr) sessionStr = (studentProfile && studentProfile.session) || '2024/2025';
    sessionStr = String(sessionStr).trim();

    // Standard YYYY/YYYY (e.g. "2024/2025")
    const slashParts = sessionStr.split('/');
    if (slashParts.length === 2) {
        const start = parseInt(slashParts[0]);
        const end = parseInt(slashParts[1]);
        if (!isNaN(start) && !isNaN(end)) {
            return `${start}/${end}`;
        }
    }

    // Hyphenated YYYY-YYYY (e.g. "2024-2025")
    const dashParts = sessionStr.split('-');
    if (dashParts.length === 2 && !isNaN(parseInt(dashParts[0])) && !isNaN(parseInt(dashParts[1]))) {
        const start = parseInt(dashParts[0]);
        const end = parseInt(dashParts[1]);
        return `${start}/${end}`;
    }

    // Single 4-digit year (e.g. "2025") -> "2024/2025"
    const yearMatch = sessionStr.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch) {
        const y = parseInt(yearMatch[1]);
        return `${y - 1}/${y}`;
    }

    return sessionStr;
}

function getNextAcademicSession(sessionStr, yearsToAdd = 1) {
    sessionStr = formatToAcademicSession(sessionStr);
    const slashParts = sessionStr.split('/');
    if (slashParts.length === 2) {
        const start = parseInt(slashParts[0]);
        const end = parseInt(slashParts[1]);
        if (!isNaN(start) && !isNaN(end)) {
            return `${start + yearsToAdd}/${end + yearsToAdd}`;
        }
    }
    return sessionStr;
}

function getSemesterLevel(sem, index, allSemesters) {
    if (!sem) return 100;

    const extractYear = (str) => {
        if (!str) return null;
        const m = str.match(/\b(19\d\d|20\d\d)\b/);
        return m ? parseInt(m[1]) : null;
    };

    const list = Array.isArray(allSemesters) ? allSemesters : semesters;
    const firstSemYear = (list && list.length > 0) ? extractYear(list[0].name) : null;
    const baseYear = firstSemYear || extractYear((studentProfile && studentProfile.session));
    const semYear = extractYear(sem.name);

    if (semYear && baseYear) {
        const diff = semYear - baseYear;
        if (diff >= 0) {
            return (diff + 1) * 100;
        }
    }

    if (typeof index === 'number' && index >= 0) {
        return (Math.floor(index / 2) + 1) * 100;
    }

    return 100;
}

function normalizeSemesters(semList) {
    if (!Array.isArray(semList) || semList.length === 0) return [];

    let list = [...semList];

    // Check if 100L First Semester is missing (i.e. first existing semester is a Second Semester)
    if (list.length > 0 && /Second|2nd/i.test(list[0].name)) {
        const rawFirstSession = list[0].name.split(' - ')[0] || (studentProfile && studentProfile.session) || '2024/2025';
        const properFirstSession = formatToAcademicSession(rawFirstSession);
        // Insert the missing First Semester at index 0
        list.unshift({
            id: `sem_first_${Date.now()}`,
            name: `${properFirstSession} - First Semester`,
            courses: []
        });
    }

    let currentSession = null;
    let prevWasSecond = false;

    return list.map((sem, idx) => {
        let name = formatSemesterName(sem.name);
        const parts = name.split(' - ');
        let semSession = parts.length > 1 ? formatToAcademicSession(parts[0].trim()) : null;
        const semType = /Second|2nd/i.test(name) ? 'Second Semester' : 'First Semester';

        if (idx === 0) {
            currentSession = semSession || formatToAcademicSession(studentProfile && studentProfile.session) || '2024/2025';
        } else {
            if (prevWasSecond && semType === 'First Semester') {
                if (!semSession || semSession === currentSession) {
                    currentSession = getNextAcademicSession(currentSession, 1);
                } else {
                    currentSession = semSession;
                }
            } else if (semSession) {
                currentSession = semSession;
            }
        }

        prevWasSecond = (semType === 'Second Semester');
        const formattedName = `${currentSession} - ${semType}`;

        return {
            ...sem,
            name: formattedName
        };
    });
}

// Expose globally for mobile.js and external callers
window.formatSemesterName = formatSemesterName;
window.formatToAcademicSession = formatToAcademicSession;
window.getNextAcademicSession = getNextAcademicSession;
window.getSemesterLevel = getSemesterLevel;
window.normalizeSemesters = normalizeSemesters;

let semesters = [];
try {
    const cachedSem = JSON.parse(localStorage.getItem('cgpa_semesters'));
    if (Array.isArray(cachedSem)) {
        semesters = normalizeSemesters(cachedSem);
        localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
    }
} catch (e) {}

let activeSemesterId = null;
let cgpaChart = null;
let archiveChart = null;
let tasks = JSON.parse(localStorage.getItem('cgpa_tasks')) || [];
let resources = JSON.parse(localStorage.getItem('cgpa_resources')) || [];
let gradingScale = parseInt(localStorage.getItem('cgpa_scale')) || 5;

// DOM Elements
const semestersContainer = document.getElementById('semesters-container');
const cgpaDisplay = document.getElementById('cgpa-display');
const totalUnitsDisplay = document.getElementById('total-units-display');
const totalPointsDisplay = document.getElementById('total-points-display');
const standingDisplay = document.getElementById('standing-display');
const courseModal = document.getElementById('course-modal');
const modalOverlay = document.getElementById('modal-overlay');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    try { if (window.lucide) lucide.createIcons(); } catch(e) {}
    try { setupNavigation(); } catch(e) {}
    try { setupEventListeners(); } catch(e) {}
    try { renderAll(); } catch(e) {}
    try { loadProfile(); } catch(e) {}
    try { initChart(); } catch(e) {}
    loadData(); // Synchronize state with backend
});

// Load and Synchronize state with MongoDB Backend
async function loadData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
        window.location.href = 'login.html';
        return;
    }

    // 0. Instant Cache-First Load from LocalStorage
    const cachedProfile = localStorage.getItem('cgpa_profile');
    if (cachedProfile) {
        try {
            const parsed = JSON.parse(cachedProfile);
            studentProfile = { ...studentProfile, ...parsed };
            if (!studentProfile.name && (user.fullName || user.name)) {
                studentProfile.name = user.fullName || user.name;
            }
        } catch (e) {}
    }

    const cachedSemesters = localStorage.getItem('cgpa_semesters');
    let hasLocalSemesters = false;
    if (cachedSemesters) {
        try {
            const parsed = JSON.parse(cachedSemesters);
            if (Array.isArray(parsed) && parsed.length > 0) {
                semesters = normalizeSemesters(parsed);
                hasLocalSemesters = true;
                localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
            }
        } catch (e) {}
    }

    // Render local data immediately so user isn't blocked (0ms delay)
    renderAll();
    loadProfile();

    const token = user.token;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Controller with 10-second timeout to prevent infinite stuck spinner
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        // 1. Fetch User Profile
        const profileRes = await apiFetch(`/users/profile`, { headers, signal: controller.signal });
        
        if (profileRes.status === 401) {
            clearTimeout(timeoutId);
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        if (profileRes.ok) {
            const profileData = await profileRes.json();
            studentProfile = {
                name: profileData.fullName || profileData.name || studentProfile.name || '',
                uni: profileData.university || studentProfile.uni || '',
                session: profileData.academicSession || studentProfile.session || '2023/2024',
                matric: profileData.matricNumber || studentProfile.matric || '',
                faculty: profileData.faculty || studentProfile.faculty || '',
                department: profileData.department || studentProfile.department || '',
                profilePicture: profileData.profilePicture || studentProfile.profilePicture || ''
            };
            localStorage.setItem('cgpa_profile', JSON.stringify(studentProfile));
            loadProfile(); // Update header greeting immediately with fetched server profile name
            if (isRegistrationIncomplete()) {
                if (typeof window.switchSection === 'function') {
                    window.switchSection('section-profile');
                }
            } else if (document.getElementById('section-profile')?.style.display === 'block') {
                loadProfileEditForm();
            }
        }

        // 2. Fetch Saved Courses from Database
        const coursesRes = await apiFetch(`/courses`, { headers, signal: controller.signal });
        clearTimeout(timeoutId);

        if (coursesRes.ok) {
            const coursesData = await coursesRes.json();
            
            const grouped = {};
            coursesData.forEach(c => {
                const key = `${c.session} - ${c.semester}`;
                if (!grouped[key]) {
                    grouped[key] = {
                        id: key,
                        name: `${c.session} - ${c.semester} Semester`,
                        courses: []
                    };
                }
                
                const gradePointMap = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
                const numericGrade = c.gradePoint !== undefined ? c.gradePoint : (gradePointMap[c.grade.toUpperCase()] || 0);

                const codeUpper = (c.code || c.title || '').trim().toUpperCase();
                // Deduplicate any duplicate course codes within the same semester
                if (!grouped[key].courses.some(existing => (existing.code || existing.title || '').trim().toUpperCase() === codeUpper)) {
                    grouped[key].courses.push({
                        id: c._id,
                        title: c.title,
                        code: c.code || c.title,
                        units: c.unit,
                        grade: numericGrade
                    });
                }
            });

            if (Object.keys(grouped).length > 0) {
                semesters = normalizeSemesters(Object.values(grouped));
                semesters.sort((a, b) => {
                    const yearA = parseInt(a.name.split('/')[0]) || 0;
                    const yearB = parseInt(b.name.split('/')[0]) || 0;
                    if (yearA !== yearB) return yearA - yearB;
                    const isFirstA = a.name.includes('First') || a.name.includes('1st') ? 0 : 1;
                    const isFirstB = b.name.includes('First') || b.name.includes('1st') ? 0 : 1;
                    return isFirstA - isFirstB;
                });
                localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
            } else if (Array.isArray(coursesData) && coursesData.length === 0) {
                // If the user has 0 courses in DB, clear cached semesters
                semesters = [];
                localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
            }
        }
        
        // 3. Admin check
        const ADMIN_EMAILS = ['gideonlastgids@gmail.com'];
        const isAdmin = user && ADMIN_EMAILS.includes(user.email);
        const navItemAdmin = document.getElementById('nav-item-admin');
        if (navItemAdmin) navItemAdmin.style.display = isAdmin ? 'block' : 'none';
        const mobNavItemAdmin = document.getElementById('mobnav-admin');
        if (mobNavItemAdmin) mobNavItemAdmin.style.display = isAdmin ? 'block' : 'none';
        
        hideLoadingOverlay();
        renderAll();
        loadProfile();
    } catch (err) {
        clearTimeout(timeoutId);
        console.error('Error or timeout synchronizing with database server:', err);
        hideLoadingOverlay();
        renderAll();
        loadProfile();
    }
}

function showLoadingOverlay(message, isRetry = false) {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 9999;
            background: rgba(2,6,23,0.92); backdrop-filter: blur(8px);
            display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.25rem;
        `;
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div style="width:52px;height:52px;border-radius:50%;border:3px solid rgba(16,185,129,0.15);border-top-color:#10b981;animation:spin 0.9s linear infinite;"></div>
        <p style="color:#94a3b8;font-family:'Inter',sans-serif;font-size:0.95rem;text-align:center;max-width:280px;line-height:1.6;">${message}</p>
        ${isRetry ? '<p style="color:#475569;font-size:0.8rem;font-family:Inter,sans-serif;">Retrying automatically…</p>' : ''}
        <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
    `;
    overlay.style.display = 'flex';
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}


function isRegistrationIncomplete() {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const urlParams = new URLSearchParams(window.location.search);
    const flag = sessionStorage.getItem('complete_registration_required') === 'true' || urlParams.get('complete_profile') === '1';
    
    const matric = ((studentProfile && studentProfile.matric) || user.matricNumber || '').trim();
    const dept = ((studentProfile && studentProfile.department) || user.department || '').trim();
    const faculty = ((studentProfile && studentProfile.faculty) || user.faculty || '').trim();

    const isFieldMissing = (val) => !val || val === 'N/A' || val.toLowerCase() === 'not set' || val.toLowerCase() === 'undefined';
    const fieldsIncomplete = isFieldMissing(matric) || isFieldMissing(dept) || isFieldMissing(faculty);

    const isGoogle = user.authProvider === 'google' || !!user.googleId || flag;
    return Boolean(isGoogle && fieldsIncomplete);
}
window.isRegistrationIncomplete = isRegistrationIncomplete;

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.app-section');
    const profileTrigger = document.getElementById('profile-trigger');

    function switchSection(targetId) {
        // Enforce registration completion for Google users before allowing access to dashboard/other sections
        if (isRegistrationIncomplete() && targetId !== 'section-profile') {
            if (typeof window.showToast === 'function') {
                window.showToast('Please fill in your Matric Number, Faculty, and Department and click Save Changes before accessing the dashboard.', 'Registration Required 🎓', 'warning');
            } else if (typeof window.showMobileToast === 'function') {
                window.showMobileToast('Please complete your profile details and save changes first.', 'Registration Required 🎓', 'warning');
            }
            targetId = 'section-profile';
        }

        console.log('Switching to:', targetId);
        
        // 1. Update Sidebar UI
        navLinks.forEach(l => {
            l.classList.remove('active');
            l.style.background = 'none';
            l.style.color = 'var(--text-secondary)';
            if (l.id === `nav-${targetId.replace('section-', '')}`) {
                l.classList.add('active');
                l.style.background = 'rgba(16, 185, 129, 0.1)';
                l.style.color = 'var(--primary)';
            }
        });

        // 2. Hide all sections first
        sections.forEach(sec => {
            sec.style.display = 'none';
            sec.style.opacity = '0';
        });

        // 3. Show target section
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.style.display = 'block';
            setTimeout(() => {
                targetSection.style.opacity = '1';
                targetSection.classList.add('animate-fade-in');
            }, 50);
            
            const mainHeaderTitle = document.getElementById('main-header-title');
            if (mainHeaderTitle) {
                mainHeaderTitle.style.display = targetId === 'section-dashboard' ? 'block' : 'none';
            }
            
            // 4. Load specific section data
            if (targetId === 'section-dashboard') {
                calculateStats();
                renderSemesters();
                renderGradingGuide();
            }
            if (targetId === 'section-courses') renderMasterCourseList();
            if (targetId === 'section-profile') loadProfileEditForm();
            if (targetId === 'section-planner') renderPlanner();
            if (targetId === 'section-resources') renderResources();
            if (targetId === 'section-archives') renderArchives();
            if (targetId === 'section-admin') fetchAdminAnalytics();
            
            // 5. Refresh icons
            if (window.lucide) lucide.createIcons();
            
            // 6. Scroll top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Expose switchSection globally
    window.switchSection = switchSection;

    // Attach listeners to sidebar links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                return; // Allow standard page navigation (e.g., help.html)
            }
            e.preventDefault();
            if (link.id) {
                const targetId = link.id.replace('nav-', 'section-');
                switchSection(targetId);
            }
        });
    });

    // Profile Preview trigger (University Modal Only, no section redirection)
    // Kept for opening uni-modal which is registered in setupEventListeners

    // Initial section display: route to section-profile if registration is incomplete, otherwise dashboard
    if (isRegistrationIncomplete()) {
        switchSection('section-profile');
    } else {
        switchSection('section-dashboard');
    }
}

function setupEventListeners() {
    document.getElementById('add-semester-btn').addEventListener('click', () => {
        let newSession = (studentProfile && studentProfile.session) || '2023/2024';
        let newSemType = 'First Semester';

        if (semesters.length > 0) {
            const lastSem = semesters[semesters.length - 1];
            const parts = (lastSem.name || '').split(' - ');
            const lastSession = parts.length > 1 ? parts[0].trim() : ((studentProfile && studentProfile.session) || '2023/2024');
            const isLastSecond = /Second|2nd/i.test(lastSem.name);

            if (isLastSecond) {
                // Previous semester was Second Semester -> start First Semester of NEXT session/level
                newSession = getNextAcademicSession(lastSession, 1);
                newSemType = 'First Semester';
            } else {
                // Previous semester was First Semester -> start Second Semester of SAME session/level
                newSession = lastSession;
                newSemType = 'Second Semester';
            }
        }

        const newSemester = {
            id: `temp_${Date.now()}`,
            name: `${newSession} - ${newSemType}`,
            courses: []
        };
        semesters.push(newSemester);
        localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
        renderAll();

        if (typeof window.showMobileToast === 'function') {
            window.showMobileToast(`${newSemester.name} has been added.`, 'Semester Added! 🎓');
        }
    });

    // Modal Controls
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save').addEventListener('click', saveCourse);
    document.getElementById('modal-course-score').addEventListener('input', updateGradeFromScore);

    // Theme Toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', nextTheme);
        
        const icon = document.getElementById('theme-icon');
        icon.setAttribute('data-lucide', nextTheme === 'dark' ? 'sun' : 'moon');
        lucide.createIcons();
    });

    // Profile Trigger (Opens University Settings Modal)
    document.getElementById('profile-trigger').addEventListener('click', openUniModal);

    // University Modal Controls
    document.getElementById('uni-modal-cancel').addEventListener('click', closeUniModal);
    document.getElementById('uni-modal-save').addEventListener('click', saveUniSettings);

    // Edit Semester Modal Controls
    const editSemCancel = document.getElementById('edit-semester-cancel');
    if (editSemCancel) editSemCancel.addEventListener('click', closeEditSemesterModal);
    const editSemSave = document.getElementById('edit-semester-save');
    if (editSemSave) editSemSave.addEventListener('click', saveEditedSemester);

    // Profile Update Button (Personal Details)
    document.getElementById('profile-update-btn').addEventListener('click', updateProfile);

    // Score Converter
    document.getElementById('convert-score').addEventListener('input', (e) => {
        const score = e.target.value;
        const resultDiv = document.getElementById('convert-result');
        if (score === '') {
            resultDiv.innerText = '-';
            return;
        }
        const grade = calculateGradeFromScore(score);
        resultDiv.innerText = grade;
        resultDiv.style.color = grade === 'F' ? 'var(--danger)' : 'var(--primary)';
    });

    // Exports
    const exportPdfBtn = document.getElementById('export-pdf');
    if (exportPdfBtn) exportPdfBtn.addEventListener('click', exportToPDF);
    const exportImageBtn = document.getElementById('export-image');
    if (exportImageBtn) exportImageBtn.addEventListener('click', exportToImage);

    // Settings
    document.getElementById('settings-scale-select').value = gradingScale;
    document.getElementById('settings-scale-select').addEventListener('change', (e) => {
        gradingScale = parseInt(e.target.value);
        localStorage.setItem('cgpa_scale', gradingScale);
        calculateStats();
        renderGradingGuide();
    });

    // Photo Selection Modal Controls
    const photoSelectModal = document.getElementById('photo-select-modal');
    
    document.getElementById('take-photo-btn').addEventListener('click', () => {
        photoSelectModal.style.display = 'flex';
        lucide.createIcons();
    });
    
    document.getElementById('photo-select-close-btn').addEventListener('click', () => {
        photoSelectModal.style.display = 'none';
    });

    document.getElementById('photo-select-upload-btn').addEventListener('click', () => {
        photoSelectModal.style.display = 'none';
        document.getElementById('profile-file-input').click();
    });

    document.getElementById('photo-select-camera-btn').addEventListener('click', () => {
        photoSelectModal.style.display = 'none';
        startCamera();
    });

    // File Input Upload Event
    document.getElementById('profile-file-input').addEventListener('change', handleProfileUpload);

    // Camera Modal Buttons
    document.getElementById('camera-cancel-btn').addEventListener('click', stopCamera);
    document.getElementById('camera-close-btn').addEventListener('click', stopCamera);
    document.getElementById('camera-capture-btn').addEventListener('click', captureImage);

    // Planner Events
    document.getElementById('add-task-btn').addEventListener('click', () => {
        document.getElementById('planner-modal').style.display = 'block';
        modalOverlay.style.display = 'block';
    });
    document.getElementById('planner-modal-cancel').addEventListener('click', () => {
        document.getElementById('planner-modal').style.display = 'none';
        modalOverlay.style.display = 'none';
    });
    document.getElementById('planner-modal-save').addEventListener('click', saveTask);

    // Resource Events
    document.getElementById('add-resource-btn').addEventListener('click', () => {
        document.getElementById('resource-modal').style.display = 'block';
        modalOverlay.style.display = 'block';
    });
    document.getElementById('resource-modal-cancel').addEventListener('click', () => {
        document.getElementById('resource-modal').style.display = 'none';
        modalOverlay.style.display = 'none';
    });
    document.getElementById('resource-modal-save').addEventListener('click', saveResource);

    // Settings Events
    document.getElementById('settings-theme-toggle').addEventListener('click', () => {
        document.getElementById('theme-toggle').click();
        const icon = document.querySelector('#settings-theme-toggle i');
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
        lucide.createIcons();
    });
    document.getElementById('settings-export-btn').addEventListener('click', exportCSV);

    const settingsUniBtn = document.getElementById('settings-uni-btn');
    if (settingsUniBtn) {
        settingsUniBtn.addEventListener('click', openUniModal);
    }
}

// Rendering Functions
function renderAll() {
    renderSemesters();
    calculateStats();
    renderGradingGuide();
    updateChart();
    renderMasterCourseList();
    renderLevelStats();
}

function renderLevelStats() {
    const container = document.getElementById('level-performance-container');
    if (!container) return;
    
    const levelsMap = {};
    semesters.forEach((sem, idx) => {
        const level = getSemesterLevel(sem, idx, semesters);
        
        if (!levelsMap[level]) {
            levelsMap[level] = { level, name: `${level} Level`, totalUnits: 0, totalPoints: 0 };
        }
        
        sem.courses.forEach(c => {
            levelsMap[level].totalUnits += parseInt(c.units || 0);
            levelsMap[level].totalPoints += parseInt(c.units || 0) * parseFloat(c.grade || 0);
        });
    });

    const levels = Object.values(levelsMap)
        .sort((a, b) => a.level - b.level)
        .map(l => {
            const gpa = l.totalUnits > 0 ? (l.totalPoints / l.totalUnits).toFixed(2) : "0.00";
            return { name: l.name, gpa, units: l.totalUnits };
        });

    if (levels.length === 0) {
        container.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: 1rem; width: 100%;">No level breakdown data available yet. Please add semesters and courses.</p>`;
        return;
    }

    container.innerHTML = levels.map(l => {
        const percentage = Math.min(100, Math.max(0, (parseFloat(l.gpa) / gradingScale) * 100));
        return `
            <div class="level-breakdown-row" style="display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; width: 100%;">
                <div class="level-info-title" style="display: flex; align-items: center; gap: 0.5rem; width: 130px; flex-shrink: 0;">
                    <div class="level-icon-circle"><i data-lucide="layers" style="width: 14px; height: 14px;"></i></div>
                    <span style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary);">${l.name}</span>
                </div>
                <div class="level-progress-bar-wrap" style="flex: 1; height: 8px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; position: relative;">
                    <div class="level-progress-bar" style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, #10b981 0%, #6366f1 50%, #8b5cf6 100%); border-radius: 4px; box-shadow: 0 0 10px rgba(99, 102, 241, 0.25);"></div>
                </div>
                <div class="level-stats-wrap" style="display: flex; align-items: center; gap: 1.5rem; text-align: right; width: 160px; justify-content: flex-end; flex-shrink: 0;">
                    <div>
                        <span style="font-size: 1.25rem; font-weight: 800; color: #10b981; font-family: 'Outfit', sans-serif;">${l.gpa}</span>
                        <span style="font-size: 0.75rem; color: #64748b; margin-left: 0.15rem; font-weight: 600;">GPA</span>
                    </div>
                    <div style="font-size: 0.825rem; color: #94a3b8; font-weight: 600; min-width: 65px;">${l.units} Units</div>
                </div>
            </div>
        `;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
}

function renderSemesters() {
    if (!semestersContainer) return;
    semestersContainer.innerHTML = '';

    if (!Array.isArray(semesters) || semesters.length === 0) {
        semestersContainer.innerHTML = `
            <div class="glass card animate-fade-in" style="text-align: center; padding: 3rem 1.5rem; border: 1px dashed rgba(255,255,255,0.12); border-radius: 1rem; margin-bottom: 1.5rem;">
                <div style="width: 52px; height: 52px; border-radius: 50%; background: rgba(16, 185, 129, 0.12); color: #10b981; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; border: 1px solid rgba(16, 185, 129, 0.25);">
                    <i data-lucide="book-open" style="width: 26px; height: 26px;"></i>
                </div>
                <h3 class="font-heading" style="font-weight: 700; font-size: 1.15rem; color: #ffffff; margin-bottom: 0.35rem;">No Semesters Added Yet</h3>
                <p style="color: var(--text-secondary); font-size: 0.875rem; max-width: 380px; margin: 0 auto 1.5rem; line-height: 1.5;">
                    Add your current or past academic semesters to track your GPAs and cumulative CGPA across your university levels.
                </p>
                <button onclick="document.getElementById('add-semester-btn').click()" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 0.5rem; margin: 0 auto; padding: 0.65rem 1.25rem;">
                    <i data-lucide="plus" style="width: 18px; height: 18px;"></i>
                    <span>Add Your First Semester</span>
                </button>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
    }

    semesters.forEach((sem, index) => {
        const semGPA = calculateGPA(sem.courses);
        const semLevel = getSemesterLevel(sem, index, semesters);
        const card = document.createElement('div');
        card.className = 'glass card animate-fade-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="semester-card-header">
                <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <span style="background: rgba(99, 102, 241, 0.15); color: #818cf8; font-size: 0.72rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 99px; border: 1px solid rgba(99, 102, 241, 0.3); letter-spacing: 0.03em;">${semLevel}L</span>
                    <h3 class="font-heading" style="margin: 0;">${formatSemesterName(sem.name)}</h3>
                </div>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span class="gpa-pill">GPA: ${semGPA}</span>
                    <button onclick="openCourseModal('${sem.id}')" title="Add Course" class="btn glass-card" style="padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary);">
                        <i data-lucide="plus-circle" style="width: 18px;"></i>
                    </button>
                    <button onclick="openEditSemesterModal('${sem.id}')" title="Edit Semester Details" class="btn glass-card" style="padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary);">
                        <i data-lucide="edit-3" style="width: 18px;"></i>
                    </button>
                    <button onclick="deleteSemester('${sem.id}')" title="Delete Semester" class="btn glass-card" style="padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); color: var(--warning);">
                        <i data-lucide="trash-2" style="width: 18px;"></i>
                    </button>
                </div>
            </div>
            
            <div class="course-list">
                ${sem.courses.length === 0 ? '<p style="color: var(--text-secondary); font-size: 0.875rem; text-align: center; padding: 1rem;">No courses added yet.</p>' : ''}
                <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
                    ${sem.courses.map(course => `
                        <tr class="course-item-row">
                            <td style="padding: 0.85rem 0; font-weight: 700; color: var(--text-primary); font-family: monospace;">${course.code}</td>
                            <td style="padding: 0.85rem 0; color: var(--text-secondary); font-weight: 500;">${course.title}</td>
                            <td style="padding: 0.85rem 0; text-align: center; color: #94a3b8; font-weight: 600;">${course.units} Units</td>
                            <td style="padding: 0.85rem 0; text-align: center; font-weight: 700; color: #10b981;">Grade: ${getGradeLetter(course.grade)} (${course.grade})</td>
                            <td style="padding: 0.85rem 0; text-align: right;">
                                <button onclick="deleteCourse('${sem.id}', '${course.id}')" class="delete-course-btn">
                                    <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>

            <a href="#" class="semester-footer-link" onclick="event.preventDefault(); document.getElementById('nav-courses').click();">
                <span>View all semesters</span>
                <i data-lucide="chevron-right" style="width: 16px; height: 16px;"></i>
            </a>
        `;
        semestersContainer.appendChild(card);
    });
    lucide.createIcons();
}

function renderMasterCourseList() {
    const container = document.getElementById('all-courses-container');
    if (!container) return;

    let allCourses = [];
    semesters.forEach(sem => {
        sem.courses.forEach(c => {
            allCourses.push({ ...c, semName: sem.name });
        });
    });

    if (allCourses.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 3rem; font-size: 1.05rem;">No courses registered yet. Go to Dashboard to add courses.</p>';
        return;
    }

    container.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; font-size: 1.05rem;">
            <thead style="border-bottom: 2px solid var(--border);">
                <tr>
                    <th style="text-align: left; padding: 1.25rem 0.5rem; color: var(--text-secondary); text-transform: uppercase; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em;">Code</th>
                    <th style="text-align: left; padding: 1.25rem 0.5rem; color: var(--text-secondary); text-transform: uppercase; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em;">Course Title</th>
                    <th style="text-align: center; padding: 1.25rem 0.5rem; color: var(--text-secondary); text-transform: uppercase; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em;">Semester</th>
                    <th style="text-align: center; padding: 1.25rem 0.5rem; color: var(--text-secondary); text-transform: uppercase; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em;">Units</th>
                    <th style="text-align: right; padding: 1.25rem 0.5rem; color: var(--text-secondary); text-transform: uppercase; font-size: 0.85rem; font-weight: 700; letter-spacing: 0.05em;">Grade</th>
                </tr>
            </thead>
            <tbody>
                ${allCourses.map(c => `
                    <tr style="border-bottom: 1px solid var(--border);" class="course-item-row">
                        <td style="padding: 1.25rem 0.5rem; font-family: monospace; font-weight: 700; color: var(--text-primary); font-size: 1.1rem;">${c.code}</td>
                        <td style="padding: 1.25rem 0.5rem; font-weight: 600; color: var(--text-secondary);">${c.title}</td>
                        <td style="padding: 1.25rem 0.5rem; text-align: center; color: var(--text-secondary); font-weight: 500;">${c.semName}</td>
                        <td style="padding: 1.25rem 0.5rem; text-align: center; font-weight: 600; color: var(--text-primary);">${c.units} Units</td>
                        <td style="padding: 1.25rem 0.5rem; text-align: right; font-weight: 800; color: ${c.grade >= 4 ? 'var(--primary)' : c.grade < 2 ? 'var(--danger)' : 'var(--text-primary)'}; font-size: 1.1rem;">
                            ${getGradeLetter(c.grade)} (${c.grade})
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Logic Functions
function calculateGPA(courses) {
    if (courses.length === 0) return "0.00";
    let totalUnits = 0;
    let totalPoints = 0;
    courses.forEach(c => {
        totalUnits += parseInt(c.units);
        totalPoints += parseInt(c.units) * parseFloat(c.grade);
    });
    return (totalPoints / totalUnits).toFixed(2);
}

function calculateStats() {
    let totalUnits = 0;
    let totalPoints = 0;
    
    semesters.forEach(sem => {
        sem.courses.forEach(course => {
            const units = parseInt(course.units);
            const rawGrade = parseFloat(course.grade);
            
            // Adjust grade point based on scale
            let gp = rawGrade;
            if (gradingScale === 4 && gp > 0) {
                gp = Math.max(0, gp - 1); 
            }

            totalUnits += units;
            totalPoints += units * gp;
        });
    });

    const cgpa = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : "0.00";
    
    cgpaDisplay.textContent = cgpa;
    totalUnitsDisplay.textContent = totalUnits;
    totalPointsDisplay.textContent = totalPoints.toFixed(1);
    
    // Standing logic
    const standing = document.getElementById('standing-display');
    const standingCardValue = document.getElementById('standing-card-value');
    const standingProgress = document.getElementById('standing-progress');
    
    const cgpaVal = parseFloat(cgpa);
    let standingText = "Pass/Fail";
    
    if (gradingScale === 5) {
        if (cgpaVal >= 4.5) standingText = "First Class";
        else if (cgpaVal >= 3.5) standingText = "Second Class Upper";
        else if (cgpaVal >= 2.4) standingText = "Second Class Lower";
        else standingText = "Pass/Fail";
    } else {
        if (cgpaVal >= 3.5) standingText = "Excellent";
        else if (cgpaVal >= 3.0) standingText = "Very Good";
        else if (cgpaVal >= 2.0) standingText = "Good/Satisfactory";
        else standingText = "Pass/Fail";
    }
    
    if (standing) standing.textContent = standingText;
    if (standingCardValue) standingCardValue.textContent = standingText;
    
    if (standingProgress) {
        const percentage = Math.min(100, Math.max(0, (cgpaVal / gradingScale) * 100));
        standingProgress.style.width = `${percentage}%`;
    }

    updateChart();
    renderLevelStats();
}

function initChart() {
    const canvas = document.getElementById('cgpaChart');
    if (!canvas) return;
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded yet; skipping chart init');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
        if (cgpaChart) {
            cgpaChart.destroy();
            cgpaChart = null;
        }

        // Create a beautiful glowing green gradient under the curve
        const gradient = ctx.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

        const safeSemesters = Array.isArray(semesters) ? semesters : [];
        const chartData = safeSemesters.map(s => calculateGPA(s.courses));
        const chartLabels = safeSemesters.map((s, idx) => {
            const level = getSemesterLevel(s, idx, safeSemesters);
            const sem = s.name.includes('Second') || s.name.includes('2nd') ? '2nd' : '1st';
            return `${level}L - ${sem} Sem`;
        });

        cgpaChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartLabels.length > 0 ? chartLabels : ['100L - 1st Sem'],
                datasets: [{
                    label: 'GPA Trend',
                    data: chartData.length > 0 ? chartData : [0.0],
                    borderColor: '#10b981',
                    borderWidth: 3.5,
                    tension: 0.4,
                    fill: true,
                    backgroundColor: gradient,
                    pointRadius: 5,
                    pointBackgroundColor: '#10b981',
                    pointBorderColor: '#090d16',
                    pointBorderWidth: 2,
                    pointHoverRadius: 7,
                    pointHoverBackgroundColor: '#10b981',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        min: 0, 
                        max: gradingScale,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.04)',
                            drawBorder: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: "'Outfit', sans-serif",
                                weight: 600,
                                size: 11
                            }
                        }
                    },
                    x: { 
                        grid: { 
                            display: false 
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                family: "'Outfit', sans-serif",
                                weight: 600,
                                size: 11
                            }
                        }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
    } catch (err) {
        console.warn('Could not initialize cgpaChart:', err);
    }
}

function updateChart() {
    if (typeof Chart === 'undefined') return;
    if (!cgpaChart) {
        initChart();
        return;
    }
    
    try {
        const canvas = document.getElementById('cgpaChart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 220);
            gradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
            gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
            cgpaChart.data.datasets[0].backgroundColor = gradient;
        }

        const safeSemesters = Array.isArray(semesters) ? semesters : [];
        const chartLabels = safeSemesters.map((s, idx) => {
            const level = getSemesterLevel(s, idx, safeSemesters);
            const sem = s.name.includes('Second') || s.name.includes('2nd') ? '2nd' : '1st';
            return `${level}L - ${sem} Sem`;
        });

        const chartData = safeSemesters.map(s => calculateGPA(s.courses));
        
        cgpaChart.data.labels = chartLabels.length > 0 ? chartLabels : ['100L - 1st Sem'];
        cgpaChart.data.datasets[0].data = chartData.length > 0 ? chartData : [0.0];
        cgpaChart.options.scales.y.max = gradingScale;
        cgpaChart.update();
    } catch (err) {
        console.warn('Could not update cgpaChart:', err);
    }
}

function renderGradingGuide() {
    const container = document.getElementById('grading-guide-container');
    if (!container) return;
    const scaleMap = {
        "5": [
            { range: "70-100", grade: "A", gp: "5.0" },
            { range: "60-69", grade: "B", gp: "4.0" },
            { range: "50-59", grade: "C", gp: "3.0" },
            { range: "45-49", grade: "D", gp: "2.0" },
            { range: "40-44", grade: "E", gp: "1.0" },
            { range: "0-39", grade: "F", gp: "0.0" }
        ],
        "4": [
            { range: "70-100", grade: "A", gp: "4.0" },
            { range: "60-69", grade: "B", gp: "3.0" },
            { range: "50-59", grade: "C", gp: "2.0" },
            { range: "45-49", grade: "D", gp: "1.0" },
            { range: "0-44", grade: "F", gp: "0.0" }
        ]
    };

    const activeScale = scaleMap[gradingScale] || scaleMap["5"];
    const colors = {
        'A': '#10b981', // green
        'B': '#3b82f6', // blue
        'C': '#f59e0b', // gold/yellow
        'D': '#8b5cf6', // purple
        'E': '#f43f5e', // pink/red
        'F': '#ef4444'  // red
    };
    
    container.innerHTML = activeScale.filter(item => item.grade !== 'F').map(item => `
        <div class="glass-card" style="padding: 0.75rem 0.5rem; display: flex; flex-direction: column; gap: 0.25rem; border: 1px solid rgba(255,255,255,0.03); background: rgba(255,255,255,0.01);">
            <span style="font-size: 0.7rem; color: #64748b; font-weight: 600; text-transform: uppercase;">${item.grade} (${item.range})</span>
            <strong style="color: ${colors[item.grade] || 'var(--primary)'}; font-size: 1.1rem; font-weight: 800; font-family: 'Outfit';">${item.gp}</strong>
        </div>
    `).join('');
}

function getGradeLetter(points) {
    const p = parseFloat(points);
    if (p >= 5) return 'A';
    if (p >= 4) return 'B';
    if (p >= 3) return 'C';
    if (p >= 2) return 'D';
    if (p >= 1) return 'E';
    return 'F';
}

// Modal Logic
function openCourseModal(semId) {
    activeSemesterId = semId;
    courseModal.style.display = 'block';
    modalOverlay.style.display = 'block';
    document.getElementById('modal-course-title').focus();
    
    const scoreInput = document.getElementById('modal-course-score');
    if (scoreInput) scoreInput.value = '';
    const calcText = document.getElementById('grade-calc-text');
    if (calcText) {
        calcText.textContent = '--';
        calcText.parentElement.style.color = '#94a3b8';
    }
}

function closeModal() {
    courseModal.style.display = 'none';
    modalOverlay.style.display = 'none';
    document.getElementById('modal-course-title').value = '';
    const scoreInput = document.getElementById('modal-course-score');
    if (scoreInput) scoreInput.value = '';
}

function updateGradeFromScore() {
    const scoreInput = document.getElementById('modal-course-score');
    const gradeSelect = document.getElementById('modal-course-grade');
    const calcText = document.getElementById('grade-calc-text');
    if (!scoreInput || !gradeSelect || !calcText) return;

    const scoreVal = scoreInput.value.trim();
    if (scoreVal === '') {
        calcText.textContent = '--';
        calcText.parentElement.style.color = '#94a3b8';
        gradeSelect.value = '0';
        return;
    }

    const score = parseInt(scoreVal);
    if (isNaN(score) || score < 0 || score > 100) {
        calcText.textContent = 'Invalid';
        calcText.parentElement.style.color = '#ef4444';
        gradeSelect.value = '0';
        return;
    }

    let gradeLetter = 'F';
    let gradePoints = '0';

    if (gradingScale === 5) {
        if (score >= 70) { gradeLetter = 'A'; gradePoints = '5'; }
        else if (score >= 60) { gradeLetter = 'B'; gradePoints = '4'; }
        else if (score >= 50) { gradeLetter = 'C'; gradePoints = '3'; }
        else if (score >= 45) { gradeLetter = 'D'; gradePoints = '2'; }
        else if (score >= 40) { gradeLetter = 'E'; gradePoints = '1'; }
        else { gradeLetter = 'F'; gradePoints = '0'; }
    } else { // 4.0 Scale
        if (score >= 70) { gradeLetter = 'A'; gradePoints = '4'; }
        else if (score >= 60) { gradeLetter = 'B'; gradePoints = '3'; }
        else if (score >= 50) { gradeLetter = 'C'; gradePoints = '2'; }
        else if (score >= 45) { gradeLetter = 'D'; gradePoints = '1'; }
        else { gradeLetter = 'F'; gradePoints = '0'; }
    }

    const colors = {
        'A': '#10b981', // green
        'B': '#3b82f6', // blue
        'C': '#f59e0b', // gold/yellow
        'D': '#8b5cf6', // purple
        'E': '#f43f5e', // pink/red
        'F': '#ef4444'  // red
    };

    gradeSelect.value = gradePoints;
    calcText.textContent = `${gradeLetter} (${parseFloat(gradePoints).toFixed(1)} GP)`;
    calcText.parentElement.style.color = colors[gradeLetter] || '#94a3b8';
}

async function saveCourse() {
    const title = document.getElementById('modal-course-title').value.trim();
    const units = document.getElementById('modal-course-units').value;
    
    if (!title) {
        alert('Please enter a course title/code.');
        return;
    }

    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        const scoreVal = document.getElementById('modal-course-score').value.trim();
        if (scoreVal === '') {
            alert('Please enter your score (0-100).');
            return;
        }

        const score = parseInt(scoreVal);
        if (isNaN(score) || score < 0 || score > 100) {
            alert('Please enter a valid score between 0 and 100.');
            return;
        }
    }

    const gradeVal = document.getElementById('modal-course-grade').value; // numeric value: "5", "4", etc.
    
    const sem = semesters.find(s => s.id === activeSemesterId);
    if (!sem) return;

    // Check for duplicate course in this semester
    const isDuplicate = sem.courses.some(c => 
        (c.code && c.code.toUpperCase() === title.toUpperCase()) || 
        (c.title && c.title.trim().toUpperCase() === title.toUpperCase())
    );
    if (isDuplicate) {
        alert(`Course "${title.toUpperCase()}" is already added in this semester.`);
        return;
    }

    const saveBtn = document.getElementById('modal-save');
    const originalText = saveBtn ? saveBtn.innerText : 'Save Course';
    if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerText = originalText;
    }

    // Close the modal immediately
    closeModal();

    let session = studentProfile.session || '2023/2024';
    let semester = 'First';

    if (sem.name.includes('Semester 2') || sem.name.includes('Second')) {
        semester = 'Second';
    }

    // Extract session if present in the card title
    const parts = sem.name.split(' - ');
    if (parts.length > 1 && parts[0].trim()) {
        session = parts[0].trim();
    }

    // Convert numeric value ("5", "4", etc.) to letter grade ("A", "B", etc.)
    const gradeMap = { "5": "A", "4": "B", "3": "C", "2": "D", "1": "E", "0": "F" };
    const gradeLetter = gradeMap[gradeVal] || "A";

    // 1. Instant Optimistic UI Update (0ms delay - Blazing fast)
    const tempCourseId = `temp_${Date.now()}`;
    const newCourseObj = {
        id: tempCourseId,
        title: title,
        code: title.toUpperCase(),
        units: Number(units),
        grade: Number(gradeVal)
    };

    sem.courses.push(newCourseObj);
    localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
    renderAll();
    calculateStats();

    if (typeof window.showMobileToast === 'function') {
        window.showMobileToast(`${title.toUpperCase()} added!`, 'Course Saved 🎓');
    }

    // 2. Background Server Sync (Non-blocking)
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';

    if (token) {
        (async () => {
            try {
                const response = await apiFetch(`/courses`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        title: title,
                        code: title.toUpperCase(),
                        unit: Number(units),
                        grade: gradeLetter,
                        semester: semester,
                        session: session
                    })
                });

                if (response.ok) {
                    const serverCourse = await response.json();
                    if (serverCourse && (serverCourse._id || serverCourse.id)) {
                        newCourseObj.id = serverCourse._id || serverCourse.id;
                        localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
                    }
                    // Trigger calculation snapshot in background
                    apiFetch(`/results/calculate`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ session, semester })
                    }).catch(() => {});
                }
            } catch (err) {
                console.warn('Course saved locally; backend sync deferred:', err.message);
            }
        })();
    }
}

async function deleteSemester(id) {
    if (!confirm('Delete this semester? Note: This deletes courses under it.')) return;
    const sem = semesters.find(s => s.id === id);
    if (!sem) return;

    const coursesToDelete = [...sem.courses];

    // 1. Instant Optimistic UI Update (0ms delay)
    semesters = semesters.filter(s => s.id !== id);
    localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
    renderAll();
    calculateStats();

    // 2. Background Server Sync (Non-blocking)
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';

    if (token) {
        for (const c of coursesToDelete) {
            const courseId = c.id || c._id;
            if (courseId && !courseId.toString().startsWith('temp_')) {
                apiFetch(`/courses/${courseId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => {});
            }
        }
    }
}

async function deleteCourse(semId, courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;

    const sem = semesters.find(s => s.id === semId);
    if (!sem) return;

    // 1. Instant Optimistic UI Update (0ms delay)
    sem.courses = sem.courses.filter(c => c.id !== courseId && c._id !== courseId);
    localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
    renderAll();
    calculateStats();

    // 2. Background Server Sync (Non-blocking)
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';

    if (token && courseId && !courseId.toString().startsWith('temp_')) {
        try {
            await apiFetch(`/courses/${courseId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } catch (err) {
            console.warn('Course deleted locally; backend sync deferred:', err.message);
        }
    }
}

// Profile Logic
function loadProfile() {
    const sessEl = document.getElementById('student-session');
    if (sessEl) {
        const sess = formatToAcademicSession(studentProfile.session || '2024/2025');
        sessEl.innerText = `${sess} Session`;
    }
    const uniEl = document.getElementById('student-uni');
    if (uniEl) {
        uniEl.innerText = studentProfile.uni || 'Set your university';
    }
    
    // Update sidebar avatar
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarAvatar) {
        if (studentProfile.profilePicture) {
            sidebarAvatar.innerHTML = `<img src="${studentProfile.profilePicture}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;" alt="Profile">`;
        } else {
            sidebarAvatar.innerHTML = '<i data-lucide="school" style="width:18px;height:18px;"></i>';
            if (window.lucide) lucide.createIcons();
        }
    }

    // Update Dashboard Header Prominently
    const dashWelcome = document.getElementById('dashboard-welcome');
    const dashUni = document.getElementById('dashboard-uni-info');
    if (dashWelcome) {
        const currentUser = JSON.parse(localStorage.getItem('user')) || {};
        const rawName = studentProfile.name || currentUser.fullName || currentUser.name || (currentUser.email ? currentUser.email.split('@')[0] : '');
        let firstName = rawName ? rawName.trim().split(' ')[0] : '';
        if (firstName) {
            firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
            dashWelcome.innerHTML = `Welcome back, ${firstName} 👋`;
        } else {
            dashWelcome.innerHTML = `Welcome back 👋`;
        }
    }
    if (dashUni) {
        const uniPart = studentProfile.uni ? studentProfile.uni : 'Set your university';
        const properSess = formatToAcademicSession(studentProfile.session || '2024/2025');
        dashUni.innerHTML = `<span style="color: #10b981; font-weight: 600;">${uniPart}</span><span style="color: #64748b;"> · ${properSess} Session</span>`;
    }
}

function loadProfileEditForm() {
    const cleanVal = (val) => {
        if (!val || val === 'N/A' || val.toLowerCase() === 'not set' || val.toLowerCase() === 'undefined') return '';
        return val;
    };

    const nameEl = document.getElementById('profile-edit-name');
    const matricEl = document.getElementById('profile-edit-matric');
    const facultyEl = document.getElementById('profile-edit-faculty');
    const deptEl = document.getElementById('profile-edit-department');

    if (nameEl) nameEl.value = cleanVal(studentProfile.name);
    if (matricEl) matricEl.value = cleanVal(studentProfile.matric);
    if (facultyEl) facultyEl.value = cleanVal(studentProfile.faculty);
    if (deptEl) deptEl.value = cleanVal(studentProfile.department);

    // Toggle registration banner
    const banner = document.getElementById('complete-reg-banner');
    if (banner) {
        if (isRegistrationIncomplete()) {
            banner.style.display = 'block';
            if (window.lucide) lucide.createIcons();
        } else {
            banner.style.display = 'none';
        }
    }

    // Update large profile avatar in edit form
    const avatarLarge = document.getElementById('profile-avatar-large');
    if (avatarLarge) {
        if (studentProfile.profilePicture) {
            avatarLarge.innerHTML = `<img src="${studentProfile.profilePicture}" style="width:100%;height:100%;object-fit:cover;" alt="Profile">`;
        } else {
            avatarLarge.innerHTML = '<i data-lucide="user" style="width:48px;height:48px;"></i>';
            if (window.lucide) lucide.createIcons();
        }
    }
}

async function updateProfile() {
    const nameInput = document.getElementById('profile-edit-name');
    const matricInput = document.getElementById('profile-edit-matric');
    const facultyInput = document.getElementById('profile-edit-faculty');
    const deptInput = document.getElementById('profile-edit-department');

    const name = (nameInput ? nameInput.value : '').trim();
    const matric = (matricInput ? matricInput.value : '').trim();
    const faculty = (facultyInput ? facultyInput.value : '').trim();
    const department = (deptInput ? deptInput.value : '').trim();

    if (!name) {
        if (typeof window.showToast === 'function') window.showToast('Please enter your Full Name', 'Required Field', 'warning');
        else alert('Please enter your Full Name');
        nameInput?.focus();
        return;
    }
    if (!matric || matric === 'N/A' || matric.toLowerCase() === 'not set') {
        if (typeof window.showToast === 'function') window.showToast('Please enter your Matric Number to complete registration', 'Required Field', 'warning');
        else alert('Please enter your Matric Number');
        matricInput?.focus();
        return;
    }
    if (!faculty || faculty === 'N/A' || faculty.toLowerCase() === 'not set') {
        if (typeof window.showToast === 'function') window.showToast('Please enter your Faculty to complete registration', 'Required Field', 'warning');
        else alert('Please enter your Faculty');
        facultyInput?.focus();
        return;
    }
    if (!department || department === 'N/A' || department.toLowerCase() === 'not set') {
        if (typeof window.showToast === 'function') window.showToast('Please enter your Department to complete registration', 'Required Field', 'warning');
        else alert('Please enter your Department');
        deptInput?.focus();
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const token = user ? user.token : '';

    const btn = document.getElementById('profile-update-btn');
    const originalText = btn ? btn.innerHTML : 'Save Changes';
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span style="display:inline-flex; align-items:center; gap:0.5rem;"><i data-lucide="loader-2" style="width:16px;height:16px;animation:spin 1s linear infinite;"></i> Saving...</span>';
        if (window.lucide) lucide.createIcons();
    }

    try {
        const response = await apiFetch(`/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName: name,
                matricNumber: matric,
                faculty: faculty,
                department: department
            })
        });

        if (response.ok) {
            const updatedData = await response.json();
            
            // Update local studentProfile
            studentProfile.name = updatedData.fullName || name;
            studentProfile.matric = updatedData.matricNumber || matric;
            studentProfile.faculty = updatedData.faculty || faculty;
            studentProfile.department = updatedData.department || department;
            if (updatedData.profilePicture) studentProfile.profilePicture = updatedData.profilePicture;
            
            localStorage.setItem('cgpa_profile', JSON.stringify(studentProfile));

            // Update user in localStorage
            const newUser = {
                ...user,
                fullName: studentProfile.name,
                matricNumber: studentProfile.matric,
                faculty: studentProfile.faculty,
                department: studentProfile.department
            };
            localStorage.setItem('user', JSON.stringify(newUser));

            // Clear registration requirement flag and URL parameters
            sessionStorage.removeItem('complete_registration_required');
            if (window.history && window.history.replaceState) {
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
            }

            // Hide the completion banner
            const banner = document.getElementById('complete-reg-banner');
            if (banner) banner.style.display = 'none';

            loadProfile(); // Update header name and greeting
            
            if (typeof window.showToast === 'function') {
                window.showToast('Profile registered successfully! Welcome to your dashboard 🎓', 'Registration Complete! ✨', 'success');
            } else {
                alert('Profile registered successfully! ✨');
            }

            // Smoothly redirect to dashboard!
            if (typeof window.switchSection === 'function') {
                window.switchSection('section-dashboard');
            }

            // Sync mobile components if on mobile
            if (typeof window.updateMobileUIDebounced === 'function') {
                window.updateMobileUIDebounced();
            }
            if (typeof window.syncNavigationStates === 'function') {
                window.syncNavigationStates();
            }
        } else {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.message || 'Failed to update profile. Please try again.';
            if (typeof window.showToast === 'function') {
                window.showToast(errMsg, 'Update Failed', 'error');
            } else {
                alert(errMsg);
            }
        }
    } catch (err) {
        console.error('Error updating profile:', err);
        if (typeof window.showToast === 'function') {
            window.showToast('Network error while saving profile. Please check your connection.', 'Error', 'error');
        } else {
            alert('Error updating profile. Please try again.');
        }
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            if (window.lucide) lucide.createIcons();
        }
    }
}

// Edit Semester Modal Logic
function openEditSemesterModal(semId) {
    const sem = semesters.find(s => s.id === semId);
    if (!sem) return;

    const modal = document.getElementById('edit-semester-modal');
    if (!modal) return;

    document.getElementById('edit-semester-id').value = sem.id;
    const parts = (sem.name || '').split(' - ');
    const rawSession = parts.length > 1 ? parts[0].trim() : ((studentProfile && studentProfile.session) || '2024/2025');
    const properSession = formatToAcademicSession(rawSession);
    const semType = /Second|2nd/i.test(sem.name) ? 'Second Semester' : 'First Semester';

    document.getElementById('edit-semester-session').value = properSession;
    document.getElementById('edit-semester-type').value = semType;

    modal.style.display = 'block';
    modalOverlay.style.display = 'block';
}

function closeEditSemesterModal() {
    const modal = document.getElementById('edit-semester-modal');
    if (modal) modal.style.display = 'none';
    modalOverlay.style.display = 'none';
}

function saveEditedSemester() {
    const semId = document.getElementById('edit-semester-id').value;
    const sessionVal = document.getElementById('edit-semester-session').value.trim();
    const semType = document.getElementById('edit-semester-type').value;

    if (!sessionVal) {
        alert('Please enter an academic session (e.g. 2024/2025).');
        return;
    }

    const formattedSession = formatToAcademicSession(sessionVal);
    const sem = semesters.find(s => s.id === semId);
    if (sem) {
        sem.name = `${formattedSession} - ${semType}`;
        localStorage.setItem('cgpa_semesters', JSON.stringify(semesters));
        renderAll();
        if (typeof window.showMobileToast === 'function') {
            window.showMobileToast(`${sem.name} updated.`, 'Semester Updated! ✏️');
        }
    }
    closeEditSemesterModal();
}

window.openEditSemesterModal = openEditSemesterModal;
window.closeEditSemesterModal = closeEditSemesterModal;
window.saveEditedSemester = saveEditedSemester;

// University Modal Logic
function openUniModal() {
    document.getElementById('modal-uni-name').value = studentProfile.uni || '';
    document.getElementById('modal-session').value = formatToAcademicSession(studentProfile.session || '2024/2025');
    document.getElementById('uni-modal').style.display = 'block';
    modalOverlay.style.display = 'block';
}

function closeUniModal() {
    document.getElementById('uni-modal').style.display = 'none';
    modalOverlay.style.display = 'none';
}

async function saveUniSettings() {
    const uni = document.getElementById('modal-uni-name').value.trim();
    const session = document.getElementById('modal-session').value.trim();
    
    if (!uni || !session) {
        alert('Please fill in both the University and Session fields.');
        return;
    }

    const properSession = formatToAcademicSession(session);
    studentProfile.session = properSession;
    localStorage.setItem('cgpa_profile', JSON.stringify(studentProfile));
    
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';

    try {
        const response = await apiFetch(`/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                university: uni,
                academicSession: properSession
            })
        });

        if (response.ok) {
            alert('University settings updated successfully! ✨');
            await loadData();
            closeUniModal();
        } else {
            alert('Failed to save university settings.');
        }
    } catch (err) {
        console.error('Error saving settings:', err);
    }
}

// Camera Logic
function startCamera() {
    const modal = document.getElementById('camera-modal');
    modal.style.display = 'flex';
    lucide.createIcons();

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            const video = document.getElementById('camera-video');
            video.srcObject = stream;
        })
        .catch(() => {
            alert('Could not access camera. Please check your browser permissions.');
            stopCamera();
        });
}

function stopCamera() {
    const modal = document.getElementById('camera-modal');
    const video = document.getElementById('camera-video');
    modal.style.display = 'none';
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}

async function captureImage() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Mirror the captured image horizontally
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';

    try {
        const response = await apiFetch(`/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profilePicture: imageDataUrl
            })
        });

        if (response.ok) {
            await loadData();
            stopCamera();
        } else {
            alert('Failed to save photo');
        }
    } catch (err) {
        console.error('Error saving captured photo:', err);
    }
}

async function handleProfileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64Data = reader.result;

        const user = JSON.parse(localStorage.getItem('user'));
        const token = user ? user.token : '';

        try {
            const response = await apiFetch(`/users/profile`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profilePicture: base64Data
                })
            });

            if (response.ok) {
                await loadData();
            } else {
                alert('Failed to upload image');
            }
        } catch (err) {
            console.error('Error uploading profile picture:', err);
            alert('Server error uploading image.');
        }
    };
    reader.readAsDataURL(file);
}

function calculateGradeFromScore(score) {
    const s = parseFloat(score);
    if (s >= 70) return 'A';
    if (s >= 60) return 'B';
    if (s >= 50) return 'C';
    if (s >= 45) return 'D';
    if (s >= 40) return 'E';
    return 'F';
}

// PDF Export Logic
// Professional Academic Transcript PDF Exporter
function exportToPDF() {
    const btn = document.getElementById('export-pdf');
    const mobBtn = document.getElementById('mobile-action-export-pdf');
    const origBtnHTML = btn ? btn.innerHTML : '';
    const origMobHTML = mobBtn ? mobBtn.innerHTML : '';

    if (btn) {
        btn.innerHTML = `<i data-lucide="loader-2" class="animate-spin" style="width: 16px;"></i> <span>Generating PDF...</span>`;
        if (window.lucide) lucide.createIcons();
    }
    if (mobBtn) mobBtn.innerHTML = 'Generating...';

    const name = (studentProfile && studentProfile.name) || 'Student';
    const uni = (studentProfile && studentProfile.uni) || 'University';
    const dept = (studentProfile && studentProfile.department) || 'Academic Record';
    const session = (studentProfile && studentProfile.session) || '2025/2026';
    const scaleText = (typeof gradingScale !== 'undefined' ? gradingScale : 5) + '.0 Grading Scale';

    const cgpaVal = document.getElementById('cgpa-display')?.textContent || '0.00';
    const totalUnitsVal = document.getElementById('total-units-display')?.textContent || '0';
    const totalPointsVal = parseFloat(document.getElementById('total-points-display')?.textContent || '0').toFixed(1);
    const standingVal = document.getElementById('standing-display')?.textContent || 'Good Standing';

    const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    // Create Modal Overlay Container to display during compilation
    const overlay = document.createElement('div');
    overlay.id = 'pdf-transcript-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.background = 'rgba(15, 23, 42, 0.94)';
    overlay.style.backdropFilter = 'blur(12px)';
    overlay.style.zIndex = '999999';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'flex-start';
    overlay.style.overflowY = 'auto';
    overlay.style.padding = '40px 20px';

    const modalTitle = document.createElement('div');
    modalTitle.style.marginBottom = '20px';
    modalTitle.style.textAlign = 'center';
    modalTitle.style.color = '#ffffff';
    modalTitle.innerHTML = `
        <div style="font-size: 1.25rem; font-weight: 700; font-family: 'Outfit', sans-serif; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            Generating Academic Transcript PDF...
        </div>
        <div style="font-size: 0.85rem; color: #94a3b8;">Compiling your grades and progress report</div>
    `;

    const container = document.createElement('div');
    container.id = 'pdf-transcript-temp-container';
    container.style.width = '700px';
    container.style.margin = '0 auto';
    container.style.background = '#ffffff';
    container.style.color = '#0f172a';
    container.style.fontFamily = "'Outfit', -apple-system, BlinkMacSystemFont, Arial, sans-serif";
    container.style.padding = '36px';
    container.style.boxSizing = 'border-box';
    container.style.borderRadius = '12px';
    container.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.5)';

    container.innerHTML = `
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 24px;">
            <div>
                <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 4px 0; letter-spacing: -0.02em; font-family: 'Outfit', sans-serif;">OFFICIAL ACADEMIC TRANSCRIPT</h1>
                <p style="font-size: 13px; color: #64748b; margin: 0; font-weight: 500;">SpiceCGPA Pro • Academic Performance Report</p>
            </div>
            <div style="text-align: right;">
                <span style="display: inline-block; background: #ecfdf5; color: #059669; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 20px; border: 1px solid #a7f3d0; text-transform: uppercase; letter-spacing: 0.05em;">Verified Report</span>
                <p style="font-size: 11px; color: #94a3b8; margin: 6px 0 0 0;">Date: ${todayStr}</p>
            </div>
        </div>

        <!-- Student & Academic Metadata -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 28px;">
            <div>
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Student Name</span>
                <span style="font-size: 16px; font-weight: 800; color: #0f172a;">${name}</span>
            </div>
            <div>
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Institution</span>
                <span style="font-size: 16px; font-weight: 800; color: #0f172a;">${uni}</span>
            </div>
            <div>
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Department</span>
                <span style="font-size: 14px; font-weight: 600; color: #334155;">${dept}</span>
            </div>
            <div>
                <span style="font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em; display: block; margin-bottom: 2px;">Session & Scale</span>
                <span style="font-size: 14px; font-weight: 600; color: #334155;">${session} • ${scaleText}</span>
            </div>
        </div>

        <!-- CGPA & Summary Metrics -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px;">
            <div style="background: #0f172a; color: #ffffff; padding: 16px; border-radius: 12px; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; opacity: 0.8; font-weight: 700; letter-spacing: 0.05em;">Cumulative CGPA</div>
                <div style="font-size: 24px; font-weight: 800; color: #34d399; margin-top: 2px;">${cgpaVal}</div>
            </div>
            <div style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">Academic Standing</div>
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${standingVal}</div>
            </div>
            <div style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">Total Units</div>
                <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 2px;">${totalUnitsVal} <span style="font-size: 12px; font-weight: 600;">Units</span></div>
            </div>
            <div style="background: #f1f5f9; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; text-align: center;">
                <div style="font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.05em;">Total Grade Points</div>
                <div style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 2px;">${totalPointsVal} <span style="font-size: 12px; font-weight: 600;">Pts</span></div>
            </div>
        </div>

        <!-- Semesters & Courses Breakdown Table -->
        ${(typeof semesters === 'undefined' || semesters.length === 0) ? `
            <div style="padding: 40px; text-align: center; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; color: #64748b; font-size: 14px;">
                No academic semesters recorded.
            </div>
        ` : semesters.map(sem => {
            const semGPA = calculateGPA(sem.courses);
            const semUnits = sem.courses.reduce((sum, c) => sum + parseInt(c.units || 0), 0);
            return `
                <div style="margin-bottom: 24px; page-break-inside: avoid;">
                    <div style="display: flex; justify-content: space-between; align-items: center; background: #0f172a; color: #ffffff; padding: 10px 16px; border-top-left-radius: 10px; border-top-right-radius: 10px;">
                        <span style="font-size: 14px; font-weight: 700; font-family: 'Outfit', sans-serif;">${formatSemesterName(sem.name)}</span>
                        <div style="font-size: 12px; font-weight: 600; color: #cbd5e1;">
                            <span style="margin-right: 12px;">Units: <strong style="color: #ffffff;">${semUnits}</strong></span>
                            GPA: <strong style="color: #34d399; font-size: 13px;">${semGPA}</strong>
                        </div>
                    </div>

                    <table style="width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-top: none; font-size: 12px;">
                        <thead>
                            <tr style="background: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: left; font-size: 11px; text-transform: uppercase;">
                                <th style="padding: 10px 14px; font-weight: 700; width: 20%;">Course Code</th>
                                <th style="padding: 10px 14px; font-weight: 700;">Course Title</th>
                                <th style="padding: 10px 14px; font-weight: 700; text-align: center; width: 14%;">Units</th>
                                <th style="padding: 10px 14px; font-weight: 700; text-align: center; width: 16%;">Grade</th>
                                <th style="padding: 10px 14px; font-weight: 700; text-align: right; width: 16%;">Points</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sem.courses.length === 0 ? `
                                <tr>
                                    <td colspan="5" style="padding: 14px; text-align: center; color: #94a3b8; font-style: italic;">No courses added for this semester.</td>
                                </tr>
                            ` : sem.courses.map(course => {
                                const pts = (parseFloat(course.units || 0) * parseFloat(course.grade || 0)).toFixed(1);
                                return `
                                    <tr style="border-bottom: 1px solid #f1f5f9;">
                                        <td style="padding: 10px 14px; font-weight: 700; color: #0f172a; font-family: monospace; font-size: 13px;">${course.code}</td>
                                        <td style="padding: 10px 14px; color: #334155; font-weight: 500;">${course.title}</td>
                                        <td style="padding: 10px 14px; text-align: center; color: #475569; font-weight: 600;">${course.units} U</td>
                                        <td style="padding: 10px 14px; text-align: center; font-weight: 700; color: #059669;">${getGradeLetter(course.grade)} (${course.grade})</td>
                                        <td style="padding: 10px 14px; text-align: right; font-weight: 700; color: #0f172a;">${pts}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('')}

        <!-- Footer -->
        <div style="margin-top: 36px; border-top: 1px solid #e2e8f0; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #94a3b8;">
            <div>Generated via SpiceCGPA Pro • Official Student Transcript Sheet</div>
            <div>Confidential Academic Record</div>
        </div>
    `;

    overlay.appendChild(modalTitle);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const opt = {
        margin: [10, 10, 10, 10],
        filename: `${name.replace(/\s+/g, '_')}_Academic_Transcript.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            logging: false,
            letterRendering: true,
            backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    setTimeout(() => {
        html2pdf().set(opt).from(container).save().then(() => {
            if (overlay.parentElement) overlay.remove();
            if (btn) btn.innerHTML = origBtnHTML;
            if (mobBtn) mobBtn.innerHTML = `<div class="action-icon gold"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></div><span>Export PDF</span>`;
            if (window.lucide) lucide.createIcons();
        }).catch(err => {
            console.error('PDF export failed:', err);
            if (overlay.parentElement) overlay.remove();
            alert('Failed to export PDF. Please try again.');
            if (btn) btn.innerHTML = origBtnHTML;
            if (mobBtn) mobBtn.innerHTML = `<div class="action-icon gold"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></div><span>Export PDF</span>`;
            if (window.lucide) lucide.createIcons();
        });
    }, 200);
}

// Academic Planner Logic
function saveTask() {
    const desc = document.getElementById('modal-task-desc').value.trim();
    const date = document.getElementById('modal-task-date').value;
    const priority = document.getElementById('modal-task-priority').value;
    const type = document.getElementById('modal-task-type').value;

    if (!desc) {
        alert('Please enter a task description.');
        return;
    }

    const newTask = {
        id: Date.now(),
        desc,
        date: date || 'No deadline',
        priority,
        type,
        completed: false
    };

    tasks.push(newTask);
    localStorage.setItem('cgpa_tasks', JSON.stringify(tasks));
    document.getElementById('planner-modal').style.display = 'none';
    modalOverlay.style.display = 'none';
    document.getElementById('modal-task-desc').value = '';
    renderPlanner();
}

function renderPlanner() {
    const container = document.getElementById('planner-list');
    if (tasks.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: var(--text-secondary);">
                <i data-lucide="calendar" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No upcoming tasks. Click "Add New Task" to stay organized!</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };

    container.innerHTML = `
        <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;">
            ${tasks.map(task => `
                <div class="glass-card animate-fade-in" style="display: flex; align-items: center; justify-content: space-between; padding: 1.25rem; border-left: 4px solid ${priorityColors[task.priority] || 'var(--border)'}; opacity: ${task.completed ? '0.6' : '1'}">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id})" style="width: 20px; height: 20px; cursor: pointer;">
                        <div>
                            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <span class="badge" style="background: ${priorityColors[task.priority]}; color: white; font-size: 0.65rem; text-transform: uppercase; padding: 0.1rem 0.4rem; border-radius: 4px;">${task.priority}</span>
                                <span class="badge" style="background: var(--secondary); color: white; font-size: 0.65rem; text-transform: uppercase; padding: 0.1rem 0.4rem; border-radius: 4px;">${task.type}</span>
                            </div>
                            <p style="font-weight: 600; text-decoration: ${task.completed ? 'line-through' : 'none'}">${task.desc}</p>
                            <p style="font-size: 0.75rem; color: var(--text-secondary);">Due: ${task.date}</p>
                        </div>
                    </div>
                    <button onclick="deleteTask(${task.id})" class="btn" style="color: var(--danger); padding: 0.5rem;"><i data-lucide="trash-2"></i></button>
                </div>
            `).join('')}
        </div>
    `;
    lucide.createIcons();
}

function toggleTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index !== -1) {
        tasks[index].completed = !tasks[index].completed;
        localStorage.setItem('cgpa_tasks', JSON.stringify(tasks));
        renderPlanner();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    localStorage.setItem('cgpa_tasks', JSON.stringify(tasks));
    renderPlanner();
}

// Course Resources Logic
function saveResource() {
    const title = document.getElementById('modal-res-title').value.trim();
    const url = document.getElementById('modal-res-url').value.trim();
    const category = document.getElementById('modal-res-category').value;

    if (!title || !url) {
        alert('Please fill in both fields.');
        return;
    }

    const newResource = { id: Date.now(), title, url, category };
    resources.push(newResource);
    localStorage.setItem('cgpa_resources', JSON.stringify(resources));
    document.getElementById('resource-modal').style.display = 'none';
    modalOverlay.style.display = 'none';
    document.getElementById('modal-res-title').value = '';
    document.getElementById('modal-res-url').value = '';
    renderResources();
}

function renderResources() {
    const container = document.getElementById('resources-grid');
    if (resources.length === 0) {
        container.innerHTML = `
            <div class="glass card" style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-secondary);">
                <i data-lucide="folder-kanban" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>Your resource library is empty. Start adding handouts or portal links.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    const catIcons = { portal: 'globe', handout: 'file-text', past_questions: 'history', video: 'play-circle', other: 'link' };

    container.innerHTML = resources.map(res => `
        <div class="glass card animate-fade-in" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(99, 102, 241, 0.1); display: flex; align-items: center; justify-content: center; color: var(--secondary);">
                    <i data-lucide="${catIcons[res.category] || 'link'}"></i>
                </div>
                <div>
                    <h4 class="font-heading" style="font-size: 1.1rem; margin-bottom: 0.15rem;">${res.title}</h4>
                    <div style="display: flex; gap: 0.75rem; align-items: center;">
                        <span style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700;">${res.category.replace('_', ' ')}</span>
                        <a href="${res.url}" target="_blank" style="font-size: 0.75rem; color: var(--primary); text-decoration: none; font-weight: 600;">Visit Link</a>
                    </div>
                </div>
            </div>
            <button onclick="deleteResource(${res.id})" class="btn" style="color: var(--danger); padding: 0.5rem;"><i data-lucide="trash-2"></i></button>
        </div>
    `).join('');
    lucide.createIcons();
}

function deleteResource(id) {
    resources = resources.filter(r => r.id !== id);
    localStorage.setItem('cgpa_resources', JSON.stringify(resources));
    renderResources();
}

// Semester Archives Logic
function renderArchives() {
    const container = document.getElementById('archives-container');
    if (!container) return;
    
    // Draw Progress Chart
    const ctx = document.getElementById('archiveProgressChart');
    if (ctx) {
        if (archiveChart) archiveChart.destroy();
        
        const labels = semesters.map(s => s.name);
        const data = semesters.map(sem => {
            let units = 0;
            let points = 0;
            sem.courses.forEach(c => {
                let gp = parseFloat(c.grade);
                if (gradingScale === 4 && gp > 0) gp = Math.max(0, gp - 1);
                units += parseInt(c.units);
                points += parseInt(c.units) * gp;
            });
            return units > 0 ? (points / units).toFixed(2) : 0;
        });

        archiveChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `GPA Progression (${gradingScale}.0 Scale)`,
                    data: data,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#6366f1',
                    pointRadius: 5,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        min: 0, 
                        max: gradingScale,
                        grid: { color: 'rgba(148, 163, 184, 0.1)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: true, labels: { color: '#94a3b8', font: { family: 'Outfit' } } }
                }
            }
        });
    }

    if (semesters.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 4rem; color: var(--text-secondary);">
                <i data-lucide="archive" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p>No archived semesters found yet.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = `
        <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem;">
            ${semesters.map(sem => {
                let totalUnits = 0;
                let totalPoints = 0;
                sem.courses.forEach(c => {
                    let gp = parseFloat(c.grade);
                    if (gradingScale === 4 && gp > 0) gp = Math.max(0, gp - 1);
                    totalUnits += parseInt(c.units);
                    totalPoints += parseInt(c.units) * gp;
                });
                const gpa = totalUnits > 0 ? (totalPoints / totalUnits).toFixed(2) : "0.00";
                
                return `
                    <div class="glass-card animate-fade-in" style="padding: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 class="font-heading">${sem.name}</h3>
                            <div class="badge" style="background: var(--secondary); color: white; padding: 0.4rem 0.8rem; border-radius: 8px; font-weight: 800;">GPA: ${gpa}</div>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                            ${sem.courses.map(c => {
                                let gp = parseFloat(c.grade);
                                if (gradingScale === 4 && gp > 0) gp = Math.max(0, gp - 1);
                                return `
                                    <div style="font-size: 0.875rem; border-left: 2px solid var(--border); padding-left: 0.75rem;">
                                        <p style="font-weight: 600;">${c.code}: ${c.title}</p>
                                        <p style="color: var(--text-secondary);">${c.units} Units • Grade: ${getGradeLetter(gp)} (${gp})</p>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
    lucide.createIcons();
}

// Data Management
function exportCSV() {
    let csv = 'Semester,Course Code,Course Title,Units,Grade\n';
    semesters.forEach(sem => {
        sem.courses.forEach(c => {
            csv += `"${sem.name}","${c.code}","${c.title}",${c.units},"${getGradeLetter(c.grade)}"\n`;
        });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'academic_record.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Image Export Logic
async function exportToImage() {
    const btn = document.getElementById('export-image');
    const mobBtn = document.getElementById('mobile-action-save-image');
    const originalContent = btn ? btn.innerHTML : '';
    const originalMobContent = mobBtn ? mobBtn.innerHTML : '';

    if (btn) btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i>';
    if (mobBtn) mobBtn.innerHTML = 'Saving...';
    if (window.lucide) lucide.createIcons();

    try {
        const element = document.querySelector('.main-content');
        
        // Hide sections explicitly if they are display: none
        const sections = element.querySelectorAll('.app-section');
        const hiddenSections = [];
        sections.forEach(sec => {
            if (sec.style.display === 'none') {
                sec.style.visibility = 'hidden';
                sec.style.height = '0';
                sec.style.overflow = 'hidden';
                hiddenSections.push(sec);
            }
        });

        const isMobile = window.innerWidth < 768;
        const scaleVal = isMobile ? 1.2 : 2;

        const canvas = await html2canvas(element, {
            useCORS: true,
            scale: scaleVal,
            backgroundColor: getComputedStyle(document.body).backgroundColor,
            windowWidth: 1200, // Force a desktop-like layout width
            logging: false,
            onclone: (clonedDoc) => {
                // Add exporting class to cloned body so styling overrides apply inside the cloned environment
                clonedDoc.body.classList.add('exporting');

                // Ensure hidden sections don't take layout space in the clone
                const clonedSections = clonedDoc.querySelectorAll('.app-section');
                clonedSections.forEach(sec => {
                    if (sec.style.display === 'none') {
                        sec.style.visibility = 'hidden';
                        sec.style.height = '0';
                        sec.style.overflow = 'hidden';
                    }
                });

                // Ignore mobile-only navigation elements in screenshot
                const mobHeader = clonedDoc.querySelector('.mobile-top-header');
                const mobNav = clonedDoc.querySelector('.mobile-bottom-nav');
                const mobFab = clonedDoc.querySelector('.mobile-fab');
                if (mobHeader) mobHeader.style.display = 'none';
                if (mobNav) mobNav.style.display = 'none';
                if (mobFab) mobFab.style.display = 'none';

                const welcome = clonedDoc.getElementById('dashboard-welcome');
                if (welcome) {
                    welcome.style.whiteSpace = 'nowrap';
                }
            }
        });

        // Restore hidden sections in active DOM
        hiddenSections.forEach(sec => {
            sec.style.visibility = '';
            sec.style.height = '';
            sec.style.overflow = '';
        });

        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `CGPA_Dashboard_${new Date().toISOString().slice(0,10)}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Image export failed:', error);
        alert('Failed to export image. Please try again.');
    } finally {
        if (btn) btn.innerHTML = originalContent;
        if (mobBtn) mobBtn.innerHTML = `<div class="action-icon blue"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg></div><span>Save Image</span>`;
        if (window.lucide) lucide.createIcons();
    }
}

// Admin Analytics Logic
async function fetchAdminAnalytics() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) return;

    const usersListContainer = document.getElementById('admin-users-list');
    const picturesGallery = document.getElementById('admin-pictures-gallery');
    const analyticsStatus = document.getElementById('analytics-status');

    // Show loading state
    if (usersListContainer) usersListContainer.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:center; gap:0.75rem; padding:2rem; color:var(--text-secondary);">
            <div style="width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin-anim 0.8s linear infinite;"></div>
            <span>Loading users...</span>
        </div>`;
    if (picturesGallery) picturesGallery.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:1rem;grid-column:1/-1;">Loading...</p>`;
    if (analyticsStatus) analyticsStatus.textContent = 'Fetching live data...';

    try {
        const response = await apiFetch(`/analytics`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();

            // Update stat cards
            const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            setEl('admin-total-users', data.totalUsers ?? 0);
            setEl('admin-total-pics', data.usersWithProfilePic ?? 0);
            setEl('admin-total-courses', data.totalCourses ?? 0);
            setEl('admin-total-results', data.totalResults ?? 0);
            setEl('admin-active-users', data.activeUsers ?? 0);
            setEl('admin-total-unis', data.totalUniversities ?? 0);
            setEl('admin-total-units', data.totalUnits ?? 0);
            setEl('admin-average-gpa', data.averageGPA ?? '0.00');

            const now = new Date();
            if (analyticsStatus) analyticsStatus.textContent = `Last updated: ${now.toLocaleTimeString()} · ${data.totalUsers ?? 0} registered users`;

            if (data.users && data.users.length > 0) {
                // Build user cards
                usersListContainer.innerHTML = data.users.map(u => {
                    const fmt = (dateStr) => {
                        if (!dateStr) return 'Never';
                        const d = new Date(dateStr);
                        if (isNaN(d.getTime())) return 'N/A';
                        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                             + ' at ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });
                    };

                    const initials = ((u.fullName || 'U').split(' ').map(w => w[0]).join('').substring(0, 2) || 'U').toUpperCase();
                    const avatarHTML = u.profilePicture
                        ? `<img src="${u.profilePicture}" alt="${initials}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid rgba(16,185,129,0.3);">`
                        : `<div style="width:44px;height:44px;border-radius:50%;background:rgba(16,185,129,0.08);border:2px solid rgba(16,185,129,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;color:var(--primary);flex-shrink:0;">${initials}</div>`;

                    const hasPic = u.profilePicture ? '📷' : '';
                    const isActive = u.lastLogin && (Date.now() - new Date(u.lastLogin).getTime()) < 7 * 24 * 60 * 60 * 1000;

                    return `
                        <div style="display:flex;flex-direction:column;padding:1rem 1.15rem;background:rgba(13,20,35,0.5);border-radius:0.85rem;border:1px solid var(--border);gap:0.45rem;transition:border-color 0.2s;" onmouseover="this.style.borderColor='rgba(16,185,129,0.3)'" onmouseout="this.style.borderColor='var(--border)'">
                            <div style="display:flex;align-items:center;justify-content:space-between;gap:0.75rem;">
                                <div style="display:flex;align-items:center;gap:0.75rem;min-width:0;flex:1;">
                                    ${avatarHTML}
                                    <div style="min-width:0;flex:1;">
                                        <div style="display:flex;align-items:center;gap:0.4rem;">
                                            <h4 style="font-weight:700;font-size:0.9rem;color:var(--text-primary);margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.fullName || 'Unknown User'}</h4>
                                            ${isActive ? '<span style="font-size:0.6rem;background:rgba(16,185,129,0.15);color:var(--primary);padding:0.1rem 0.35rem;border-radius:99px;font-weight:700;white-space:nowrap;">ACTIVE</span>' : ''}
                                            ${hasPic}
                                        </div>
                                        <p style="font-size:0.72rem;color:var(--text-secondary);margin:0.1rem 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.email || ''}</p>
                                    </div>
                                </div>
                                <div style="flex-shrink:0;">
                                    ${u.matricNumber ? `<span style="font-family:monospace;font-size:0.65rem;background:rgba(16,185,129,0.1);color:var(--primary);padding:0.15rem 0.4rem;border-radius:0.25rem;font-weight:700;">${u.matricNumber}</span>` : ''}
                                </div>
                            </div>
                            ${(u.university || u.department) ? `
                            <div style="font-size:0.72rem;color:var(--text-secondary);padding-top:0.4rem;border-top:1px solid rgba(255,255,255,0.04);display:flex;flex-wrap:wrap;gap:0.4rem;">
                                ${u.university ? `<span style="background:rgba(255,255,255,0.04);padding:0.1rem 0.4rem;border-radius:0.25rem;">🏫 ${u.university}</span>` : ''}
                                ${u.department ? `<span style="background:rgba(255,255,255,0.04);padding:0.1rem 0.4rem;border-radius:0.25rem;">📚 ${u.department}</span>` : ''}
                            </div>` : ''}
                            <div style="display:flex;justify-content:space-between;font-size:0.68rem;color:#64748b;padding-top:0.3rem;border-top:1px solid rgba(255,255,255,0.04);">
                                <span>Joined: <strong style="color:var(--text-secondary);">${fmt(u.createdAt)}</strong></span>
                                <span>Last seen: <strong style="color:${isActive ? 'var(--primary)' : 'var(--text-secondary)'};">${fmt(u.lastLogin)}</strong></span>
                            </div>
                        </div>`;
                }).join('');

                if (window.lucide) lucide.createIcons();

                // Pictures gallery
                const withPics = data.users.filter(u => u.profilePicture && u.profilePicture !== '');
                if (withPics.length > 0) {
                    picturesGallery.innerHTML = withPics.map(u => `
                        <div style="aspect-ratio:1;border-radius:0.5rem;overflow:hidden;border:2px solid var(--border);background:#000;cursor:pointer;transition:border-color 0.2s;"
                             title="${(u.fullName || '')} — ${(u.email || '')}"
                             onmouseover="this.style.borderColor='rgba(16,185,129,0.4)'" onmouseout="this.style.borderColor='var(--border)'">
                            <img src="${u.profilePicture}" alt="${u.fullName || 'User'}" style="width:100%;height:100%;object-fit:cover;">
                        </div>`).join('');
                } else {
                    picturesGallery.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:1.5rem;grid-column:1/-1;font-size:0.85rem;">No profile pictures uploaded yet.</p>';
                }

            } else {
                usersListContainer.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:2rem;">No registered users found.</p>';
                picturesGallery.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:1.5rem;grid-column:1/-1;">No pictures yet.</p>';
            }

        } else {
            const errData = await response.json().catch(() => ({}));
            const msg = errData.message || `HTTP ${response.status}`;
            console.error('Analytics failed:', msg);
            if (analyticsStatus) analyticsStatus.textContent = '⚠️ Failed to load analytics';
            if (usersListContainer) usersListContainer.innerHTML = `<p style="color:var(--danger);text-align:center;padding:2rem;font-size:0.85rem;">⚠️ ${msg}<br><small style="color:var(--text-secondary);margin-top:0.5rem;display:block;">Try logging out and back in.</small></p>`;
            if (picturesGallery) picturesGallery.innerHTML = `<p style="color:var(--danger);text-align:center;padding:1rem;grid-column:1/-1;">—</p>`;
        }
    } catch (error) {
        console.error('Analytics fetch error:', error);
        if (analyticsStatus) analyticsStatus.textContent = '⚠️ Network error';
        if (usersListContainer) usersListContainer.innerHTML = `<p style="color:var(--danger);text-align:center;padding:2rem;font-size:0.85rem;">Network error. Check your connection.<br><small style="color:var(--text-secondary);margin-top:0.5rem;display:block;">${error.message}</small></p>`;
        if (picturesGallery) picturesGallery.innerHTML = `<p style="color:var(--danger);text-align:center;padding:1rem;grid-column:1/-1;">—</p>`;
    }
}

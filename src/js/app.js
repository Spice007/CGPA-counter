const getApiBase = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
        return 'http://localhost:5000/api';
    }
    return 'https://cgpa-counter-production.up.railway.app/api';
};
const API_BASE = getApiBase();


let semesters = [];
let studentProfile = JSON.parse(localStorage.getItem('cgpa_profile')) || { 
    name: '', 
    uni: '',
    session: '2023/2024',
    matric: '',
    faculty: '',
    department: '',
    profilePicture: ''
};
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
    lucide.createIcons();
    initChart();
    setupEventListeners();
    setupNavigation();
    loadData(); // Synchronize state with backend
});

// Load and Synchronize state with MongoDB Backend
async function loadData() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) {
        window.location.href = 'login.html';
        return;
    }
    const token = user.token;
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // 1. Fetch User Profile
        const profileRes = await fetch(`${API_BASE}/users/profile`, { headers });
        
        if (profileRes.status === 401) {
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }

        if (profileRes.ok) {
            const profileData = await profileRes.json();
            const localProfile = JSON.parse(localStorage.getItem('cgpa_profile')) || {};

            studentProfile = {
                name: profileData.fullName || '',
                uni: profileData.university || '',
                session: profileData.academicSession || localProfile.session || '2023/2024',
                matric: profileData.matricNumber || '',
                faculty: profileData.faculty || '',
                department: profileData.department || '',
                profilePicture: profileData.profilePicture || ''
            };
            
            // Persist the synced configuration
            localStorage.setItem('cgpa_profile', JSON.stringify(studentProfile));
        }

        // 2. Fetch Saved Courses from Database
        const coursesRes = await fetch(`${API_BASE}/courses`, { headers });
        if (coursesRes.ok) {
            const coursesData = await coursesRes.json();
            
            // Reconstruct semesters array from backend courses grouped by session and semester
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
                
                // Map letter grade back to numeric grade point for local calculations
                const gradePointMap = { 'A': 5, 'B': 4, 'C': 3, 'D': 2, 'E': 1, 'F': 0 };
                const numericGrade = c.gradePoint !== undefined ? c.gradePoint : (gradePointMap[c.grade.toUpperCase()] || 0);

                grouped[key].courses.push({
                    id: c._id,
                    title: c.title,
                    code: c.code || c.title,
                    units: c.unit,
                    grade: numericGrade
                });
            });
            // Preserve local empty semesters that haven't been saved to DB yet
            const emptyLocalSemesters = semesters.filter(s => s.courses.length === 0 && s.id.toString().startsWith('temp_'));
            
            semesters = Object.values(grouped);
            
            emptyLocalSemesters.forEach(emptySem => {
                if (!semesters.find(s => s.name === emptySem.name)) {
                    semesters.push(emptySem);
                }
            });
            
            semesters.sort((a, b) => {
                const yearA = parseInt(a.name.split('/')[0]) || 0;
                const yearB = parseInt(b.name.split('/')[0]) || 0;
                if (yearA !== yearB) return yearA - yearB;
                const isFirstA = a.name.includes('First') || a.name.includes('1st') ? 0 : 1;
                const isFirstB = b.name.includes('First') || b.name.includes('1st') ? 0 : 1;
                return isFirstA - isFirstB;
            });
        }
        
        // 3. Check if user is a known admin by email
        const ADMIN_EMAILS = ['gideonlastgids@gmail.com'];
        const isAdmin = user && ADMIN_EMAILS.includes(user.email);
        const navItemAdmin = document.getElementById('nav-item-admin');
        if (navItemAdmin) navItemAdmin.style.display = isAdmin ? 'block' : 'none';
        const mobNavItemAdmin = document.getElementById('mobnav-admin');
        if (mobNavItemAdmin) mobNavItemAdmin.style.display = isAdmin ? 'block' : 'none';
        
        renderAll();
        loadProfile();
    } catch (err) {
        console.error('Error synchronizing with the database server:', err);
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.app-section');
    const profileTrigger = document.getElementById('profile-trigger');

    function switchSection(targetId) {
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

    // Attach listeners to sidebar links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.id.replace('nav-', 'section-');
            switchSection(targetId);
        });
    });

    // Profile Preview trigger (University Modal Only, no section redirection)
    // Kept for opening uni-modal which is registered in setupEventListeners

    // Default to dashboard on load
    switchSection('section-dashboard');
}

function setupEventListeners() {
    document.getElementById('add-semester-btn').addEventListener('click', () => {
        const semesterCount = semesters.length;
        const semInLevel = (semesterCount % 2) + 1;
        
        const yearsToAdd = Math.floor(semesterCount / 2);
        let currentSession = studentProfile.session || '2023/2024';
        const parts = currentSession.split('/');
        if (parts.length === 2) {
            const start = parseInt(parts[0]) + yearsToAdd;
            const end = parseInt(parts[1]) + yearsToAdd;
            if (!isNaN(start) && !isNaN(end)) currentSession = `${start}/${end}`;
        }
        
        const newSemester = {
            id: `temp_${Date.now()}`,
            name: `${currentSession} - ${semInLevel === 1 ? 'First' : 'Second'}`,
            courses: []
        };
        semesters.push(newSemester);
        renderAll();
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
    document.getElementById('export-pdf').addEventListener('click', exportToPDF);
    document.getElementById('export-image').addEventListener('click', exportToImage);

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
    semesters.forEach(sem => {
        const courseYear = parseInt(sem.name.split('/')[0]);
        const baseYear = parseInt((studentProfile.session || '2023/2024').split('/')[0]);
        let level = 100;
        if (!isNaN(courseYear) && !isNaN(baseYear) && courseYear >= baseYear) {
            level = (courseYear - baseYear + 1) * 100;
        }
        
        if (!levelsMap[level]) {
            levelsMap[level] = { name: `${level} Level`, totalUnits: 0, totalPoints: 0 };
        }
        
        sem.courses.forEach(c => {
            levelsMap[level].totalUnits += parseInt(c.units);
            levelsMap[level].totalPoints += parseInt(c.units) * parseFloat(c.grade);
        });
    });

    const levels = Object.values(levelsMap).map(l => {
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
    semestersContainer.innerHTML = '';
    semesters.forEach((sem, index) => {
        const semGPA = calculateGPA(sem.courses);
        const card = document.createElement('div');
        card.className = 'glass card animate-fade-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="semester-card-header">
                <h3 class="font-heading">${sem.name}</h3>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <span class="gpa-pill">GPA: ${semGPA}</span>
                    <button onclick="openCourseModal('${sem.id}')" class="btn glass-card" style="padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); color: var(--text-primary);">
                        <i data-lucide="plus-circle" style="width: 18px;"></i>
                    </button>
                    <button onclick="deleteSemester('${sem.id}')" class="btn glass-card" style="padding: 0.5rem; background: var(--bg-card); border: 1px solid var(--border); color: var(--warning);">
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
    const ctx = canvas.getContext('2d');

    if (cgpaChart) {
        cgpaChart.destroy();
    }

    // Create a beautiful glowing green gradient under the curve
    const gradient = ctx.createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    const chartData = semesters.map(s => calculateGPA(s.courses));
    const chartLabels = semesters.map(s => {
        const courseYear = parseInt(s.name.split('/')[0]);
        const baseYear = parseInt((studentProfile.session || '2023/2024').split('/')[0]);
        let level = 100;
        if (!isNaN(courseYear) && !isNaN(baseYear) && courseYear >= baseYear) {
            level = (courseYear - baseYear + 1) * 100;
        }
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
}

function updateChart() {
    if (!cgpaChart) {
        initChart();
        return;
    }
    
    const canvas = document.getElementById('cgpaChart');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
        cgpaChart.data.datasets[0].backgroundColor = gradient;
    }

    const chartLabels = semesters.map(s => {
        const courseYear = parseInt(s.name.split('/')[0]);
        const baseYear = parseInt((studentProfile.session || '2023/2024').split('/')[0]);
        let level = 100;
        if (!isNaN(courseYear) && !isNaN(baseYear) && courseYear >= baseYear) {
            level = (courseYear - baseYear + 1) * 100;
        }
        const sem = s.name.includes('Second') || s.name.includes('2nd') ? '2nd' : '1st';
        return `${level}L - ${sem} Sem`;
    });

    const chartData = semesters.map(s => calculateGPA(s.courses));
    
    cgpaChart.data.labels = chartLabels.length > 0 ? chartLabels : ['100L - 1st Sem'];
    cgpaChart.data.datasets[0].data = chartData.length > 0 ? chartData : [0.0];
    cgpaChart.options.scales.y.max = gradingScale;
    cgpaChart.update();
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
        saveBtn.disabled = true;
        saveBtn.innerText = 'Saving...';
    }

    // Close the modal immediately so it "leaves"
    closeModal();

    let session = studentProfile.session || '2023/2024';
    let semester = 'First';

    if (sem.name.includes('Semester 2') || sem.name.includes('Second')) {
        semester = 'Second';
    }

    // Extract session if present in the card title
    const parts = sem.name.split(' - ');
    if (parts.length > 1 && parts[0].includes('/')) {
        session = parts[0];
    }

    // Convert numeric value ("5", "4", etc.) to letter grade ("A", "B", etc.)
    const gradeMap = { "5": "A", "4": "B", "3": "C", "2": "D", "1": "E", "0": "F" };
    const gradeLetter = gradeMap[gradeVal] || "A";

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';
    
    try {
        const response = await fetch(`${API_BASE}/courses`, {
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
            // Trigger calculation snapshot
            await fetch(`${API_BASE}/results/calculate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session, semester })
            });

            await loadData(); // Sync backend state
        } else {
            const errData = await response.json();
            alert('Failed to save course: ' + (errData.message || 'Unknown error'));
        }
    } catch (err) {
        console.error('Error saving course to MongoDB:', err);
        alert('Server error saving course.');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerText = originalText;
        }
    }
}

async function deleteSemester(id) {
    if (confirm('Delete this semester? Note: This deletes courses under it on the server.')) {
        const sem = semesters.find(s => s.id === id);
        if (!sem) return;

        if (sem.id.toString().startsWith('temp_') && sem.courses.length === 0) {
            semesters = semesters.filter(s => s.id !== id);
            renderAll();
            return;
        }

        const user = JSON.parse(localStorage.getItem('user'));
        const token = user ? user.token : '';

        try {
            // Delete all courses matching this session and semester
            let session = studentProfile.session || '2023/2024';
            let semester = 'First';
            if (sem.name.includes('Semester 2') || sem.name.includes('Second')) semester = 'Second';
            const parts = sem.name.split(' - ');
            if (parts.length > 1 && parts[0].includes('/')) session = parts[0];

            for (const c of sem.courses) {
                await fetch(`${API_BASE}/courses/${c.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }

            await loadData();
        } catch (err) {
            console.error('Error deleting semester:', err);
        }
    }
}

async function deleteCourse(semId, courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;

    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';

    try {
        const response = await fetch(`${API_BASE}/courses/${courseId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            await loadData(); // Refresh courses from backend
        } else {
            let errorMsg = 'Failed to delete course';
            try {
                const errData = await response.json();
                errorMsg += ': ' + (errData.message || errData.error || response.statusText);
            } catch (e) {
                try {
                    errorMsg += ': ' + await response.text();
                } catch (e2) {}
            }
            alert(errorMsg);
        }
    } catch (err) {
        console.error('Error deleting course:', err);
        alert('Network error deleting course. Check your internet connection.');
    }
}

// Profile Logic
function loadProfile() {
    if (document.getElementById('student-session')) {
        document.getElementById('student-session').innerText = studentProfile.session || '2023/2024';
    }
    if (document.getElementById('student-uni')) {
        document.getElementById('student-uni').innerText = studentProfile.uni || 'Your University';
    }
    
    // Update sidebar avatar
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarAvatar) {
        if (sidebarAvatar.id === 'sidebar-avatar') { // Double-check element
            if (studentProfile.profilePicture) {
                sidebarAvatar.innerHTML = `<img src="${studentProfile.profilePicture}" style="width:100%;height:100%;object-fit:cover;" alt="Profile">`;
            } else {
                sidebarAvatar.innerHTML = '<i data-lucide="user"></i>';
                lucide.createIcons();
            }
        }
    }

    // Update Dashboard Header Prominently
    const dashWelcome = document.getElementById('dashboard-welcome');
    const dashUni = document.getElementById('dashboard-uni-info');
    if (dashWelcome) {
        const firstName = (studentProfile.name || '').split(' ')[0] || 'Student';
        dashWelcome.innerHTML = `Welcome back, ${firstName} 👋`;
    }
    if (dashUni) {
        const uniPart = studentProfile.uni ? studentProfile.uni : 'Set your university';
        const sessionPart = studentProfile.session ? `${studentProfile.session} Session` : 'Set your session';
        dashUni.innerHTML = `<span style="color: #10b981; font-weight: 600;">${uniPart}</span><span style="color: #64748b;"> · ${sessionPart}</span>`;
    }
}

function loadProfileEditForm() {
    document.getElementById('profile-edit-name').value = studentProfile.name;
    document.getElementById('profile-edit-matric').value = studentProfile.matric;
    document.getElementById('profile-edit-faculty').value = studentProfile.faculty;
    document.getElementById('profile-edit-department').value = studentProfile.department;

    // Update large profile avatar in edit form
    const avatarLarge = document.getElementById('profile-avatar-large');
    if (avatarLarge) {
        if (studentProfile.profilePicture) {
            avatarLarge.innerHTML = `<img src="${studentProfile.profilePicture}" style="width:100%;height:100%;object-fit:cover;" alt="Profile">`;
        } else {
            avatarLarge.innerHTML = '<i data-lucide="user" style="width:48px;height:48px;"></i>';
            lucide.createIcons();
        }
    }
}

async function updateProfile() {
    const name = document.getElementById('profile-edit-name').value || 'Set Name';
    const matric = document.getElementById('profile-edit-matric').value || 'Not Set';
    const faculty = document.getElementById('profile-edit-faculty').value || 'Not Set';
    const department = document.getElementById('profile-edit-department').value || 'Not Set';
    
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';

    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
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
            alert('Profile updated successfully! ✨');
            await loadData();
        } else {
            alert('Failed to update profile');
        }
    } catch (err) {
        console.error('Error updating profile:', err);
    }
}

// University Modal Logic
function openUniModal() {
    document.getElementById('modal-uni-name').value = studentProfile.uni || '';
    document.getElementById('modal-session').value = studentProfile.session || '';
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
    
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user ? user.token : '';

    try {
        const response = await fetch(`${API_BASE}/users/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                university: uni,
                academicSession: session
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
        const response = await fetch(`${API_BASE}/users/profile`, {
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
            const response = await fetch(`${API_BASE}/users/profile`, {
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
function exportToPDF() {
    const element = document.querySelector('.main-content');
    const isMobile = window.innerWidth < 768;
    const scaleVal = isMobile ? 1.2 : 2;

    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'SpiceCGPA_Report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: scaleVal,
            useCORS: true,
            logging: false,
            letterRendering: true,
            windowWidth: 1200,
            backgroundColor: getComputedStyle(document.body).backgroundColor,
            onclone: (clonedDoc) => {
                // Add exporting class to cloned body so print overrides apply to clone ONLY
                clonedDoc.body.classList.add('exporting');

                // Ensure hidden sections don't take layout space in the clone
                const sections = clonedDoc.querySelectorAll('.app-section');
                sections.forEach(sec => {
                    if (sec.style.display === 'none') {
                        sec.style.visibility = 'hidden';
                        sec.style.height = '0';
                        sec.style.overflow = 'hidden';
                    }
                });

                // Explicitly hide mobile navigation elements in clone
                const mobHeader = clonedDoc.querySelector('.mobile-top-header');
                const mobNav = clonedDoc.querySelector('.mobile-bottom-nav');
                const mobFab = clonedDoc.querySelector('.mobile-fab');
                if (mobHeader) mobHeader.style.display = 'none';
                if (mobNav) mobNav.style.display = 'none';
                if (mobFab) mobFab.style.display = 'none';
            }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Show visual loading feedback on mobile button if triggered
    const mobBtn = document.getElementById('mobile-action-export-pdf');
    const originalMobContent = mobBtn ? mobBtn.innerHTML : '';
    if (mobBtn) mobBtn.innerHTML = 'Exporting...';

    html2pdf().set(opt).from(element).save().then(() => {
        if (mobBtn) mobBtn.innerHTML = `<div class="action-icon gold"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></div><span>Export PDF</span>`;
    }).catch(err => {
        console.error('PDF export failed:', err);
        alert('Failed to export PDF. Please try again.');
        if (mobBtn) mobBtn.innerHTML = `<div class="action-icon gold"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></div><span>Export PDF</span>`;
    });
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
        const response = await fetch(`${API_BASE}/analytics`, {
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

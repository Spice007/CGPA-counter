/* SpiceCGPA Pro - Optimized Mobile Experience Javascript Interactivity */

let mobileChartInstance = null;
let activeChartType = 'cgpa'; // 'cgpa' or 'gpa'
let updateMobileTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    initMobile();
});

function initMobile() {
    console.log('📱 Optimized Mobile Script Initialized');
    
    setupDrawer();
    setupBottomNavigation();
    setupBotnavActions();
    setupQuickActions();
    setupSettingsGroup();
    setupCarouselSwipeListeners();
    
    // Sync active nav states on page changes via document clicks (zero-CPU compared to MutationObserver)
    document.addEventListener('click', () => {
        setTimeout(syncNavigationStates, 100);
    });
    
    // Hook into app.js renderAll to keep mobile dashboard in sync
    hookCoreRender();
    
    // Initial render
    setTimeout(updateMobileUIDebounced, 300);
}

/* 1. Hook core rendering functions from app.js */
function hookCoreRender() {
    if (typeof window.renderAll === 'function') {
        const originalRenderAll = window.renderAll;
        window.renderAll = function() {
            originalRenderAll();
            updateMobileUIDebounced();
        };
        console.log('🔄 Hooked into core renderAll()');
    } else {
        setTimeout(hookCoreRender, 100);
    }
}

/* 2. Debounced Mobile UI Updates */
function updateMobileUIDebounced() {
    if (updateMobileTimeout) clearTimeout(updateMobileTimeout);
    updateMobileTimeout = setTimeout(() => {
        updateMobileUI();
    }, 50);
}

function updateMobileUI() {
    if (window.innerWidth >= 768) return; // Only update on mobile
    
    updateWelcomeCard();
    updateKpiCarousel();
    updateLevelBreakdown();
    updateAccordionSemesters();
    updateAnalyticsSection();
    updateMobileChart();
}

/* 3. Welcome Card Greeting & Summary */
function updateWelcomeCard() {
    const greetingEl = document.getElementById('mobile-welcome-greeting');
    const nameEl = document.getElementById('mobile-student-name');
    const deptEl = document.getElementById('mobile-student-dept');
    const sessionEl = document.getElementById('mobile-student-session');
    
    const drawerName = document.getElementById('drawer-student-name');
    const drawerUni = document.getElementById('drawer-student-uni');
    const drawerAvatar = document.getElementById('drawer-avatar');
    const welcomeAvatar = document.getElementById('mobile-welcome-avatar');

    if (!studentProfile) return;
    
    // Greeting based on time
    const hour = new Date().getHours();
    let greet = '👋 Good Morning';
    if (hour >= 12 && hour < 17) greet = '👋 Good Afternoon';
    else if (hour >= 17) greet = '👋 Good Evening';
    
    if (greetingEl) greetingEl.textContent = greet;
    
    const mobSavedUser = JSON.parse(localStorage.getItem('user')) || {};
    const rawMobName = studentProfile.name || mobSavedUser.fullName || mobSavedUser.name || (mobSavedUser.email ? mobSavedUser.email.split('@')[0] : 'Student');
    const profileName = rawMobName.charAt(0).toUpperCase() + rawMobName.slice(1);
    if (nameEl) nameEl.textContent = profileName;
    if (drawerName) drawerName.textContent = profileName;
    
    const profileUni = studentProfile.uni || 'Your University';
    const profileUsername = studentProfile.username || mobSavedUser.username || '';
    if (drawerUni) {
        drawerUni.textContent = profileUsername ? `@${profileUsername}` : profileUni;
        if (profileUsername) drawerUni.style.color = '#38bdf8';
    }
    
    if (deptEl) deptEl.textContent = studentProfile.department || 'Department';
    const currentMobSession = (studentProfile.session && studentProfile.session !== '2023/2024' && studentProfile.session !== '2024/2025') ? studentProfile.session : '2026/2027';
    if (sessionEl) sessionEl.textContent = currentMobSession + ' Session';
    
    const initials = profileName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'S';
    
    if (studentProfile.profilePicture) {
        const imgHtml = `<img src="${studentProfile.profilePicture}" alt="Profile">`;
        if (drawerAvatar) drawerAvatar.innerHTML = imgHtml;
        if (welcomeAvatar) welcomeAvatar.innerHTML = imgHtml;
        
        // Sticky header avatar
        const avatarContainer = document.getElementById('mobile-profile-trigger');
        if (avatarContainer) {
            avatarContainer.innerHTML = `<img src="${studentProfile.profilePicture}" style="width:32px; height:32px; border-radius:50%; object-fit:cover; border: 1.5px solid var(--primary);">`;
        }
    } else {
        if (drawerAvatar) drawerAvatar.innerHTML = initials;
        if (welcomeAvatar) welcomeAvatar.innerHTML = initials;
    }
}

/* 4. KPI Carousel Values & Glow Indicators */
function updateKpiCarousel() {
    const cgpaVal = document.getElementById('cgpa-display')?.textContent || '0.00';
    const totalUnits = document.getElementById('total-units-display')?.textContent || '0';
    const totalPoints = document.getElementById('total-points-display')?.textContent || '0';
    const standing = document.getElementById('standing-display')?.textContent || 'Pass/Fail';

    const cgpaEl = document.getElementById('mobile-cgpa-val');
    const unitsEl = document.getElementById('mobile-units-val');
    const pointsEl = document.getElementById('mobile-points-val');
    const standingBadge = document.getElementById('mobile-standing-val');
    const standingCardVal = document.getElementById('mobile-standing-card-val');

    if (cgpaEl) cgpaEl.textContent = cgpaVal;
    if (unitsEl) unitsEl.textContent = totalUnits;
    if (pointsEl) pointsEl.textContent = parseFloat(totalPoints).toFixed(1);
    
    if (standingBadge) {
        standingBadge.textContent = standing;
        standingBadge.className = 'mobile-kpi-badge ' + getStandingColorClass(standing);
        if (cgpaEl) cgpaEl.className = 'mobile-kpi-value ' + getStandingColorClass(standing);
    }
    if (standingCardVal) standingCardVal.textContent = standing;

    // Update Academic Standing Card
    const highlightStanding = document.getElementById('mobile-highlight-standing');
    const highlightCgpa = document.getElementById('mobile-highlight-cgpa');
    const highlightProgress = document.getElementById('mobile-highlight-progress');
    
    if (highlightStanding) highlightStanding.textContent = standing;
    if (highlightCgpa) highlightCgpa.textContent = cgpaVal;
    
    if (highlightProgress) {
        const scaleVal = typeof gradingScale !== 'undefined' ? gradingScale : 5;
        const percentage = Math.min(100, Math.max(0, (parseFloat(cgpaVal) / scaleVal) * 100));
        highlightProgress.style.width = `${percentage}%`;
    }
}

function getStandingColorClass(standingText) {
    if (standingText.includes('First') || standingText.includes('Excellent')) return 'green';
    if (standingText.includes('Second') && standingText.includes('Upper') || standingText.includes('Very Good')) return 'purple';
    if (standingText.includes('Second') && standingText.includes('Lower') || standingText.includes('Good')) return 'gold';
    return 'blue';
}

/* 5. Level Breakdown Stacked Bars */
function updateLevelBreakdown() {
    const mobileLevelContainer = document.getElementById('mobile-level-performance-container');
    const levelRows = document.querySelectorAll('#level-performance-container .level-breakdown-row');
    
    if (mobileLevelContainer) {
        if (levelRows.length > 0) {
            mobileLevelContainer.innerHTML = Array.from(levelRows).map(row => {
                const name = row.querySelector('.level-info-title span')?.textContent || '';
                const percentage = row.querySelector('.level-progress-bar')?.style?.width || '0%';
                const gpa = row.querySelector('.level-stats-wrap span')?.textContent || '0.00';
                return `
                    <div class="mobile-level-row">
                        <div class="mobile-level-name">${name}</div>
                        <div class="mobile-level-bar-wrap">
                            <div class="mobile-level-bar-fill" style="width: ${percentage}"></div>
                        </div>
                        <div class="mobile-level-val">${gpa}</div>
                    </div>
                `;
            }).join('');
        } else {
            mobileLevelContainer.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 1rem;">No breakdown data. Add semesters first.</p>`;
        }
    }
}

/* 6. Accordion Semesters Container with Inline SVGs (No Lucide Scanning overhead) */
function updateAccordionSemesters() {
    const container = document.getElementById('mobile-semesters-accordion');
    if (!container) return;
    
    if (typeof semesters === 'undefined' || semesters.length === 0) {
        container.innerHTML = `<div class="glass" style="padding: 2rem; text-align: center; color: var(--text-secondary); font-size: 0.85rem; border-radius: 16px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 0.5rem; opacity: 0.5;"><path d="M20.9 18.59a1 1 0 0 1-1 1H4.1a1 1 0 0 1-1-1V5.4a1 1 0 0 1 1-1h15.8a1 1 0 0 1 1 1v13.19Z"/><path d="M3 9h18"/><path d="M9 21v-3"/></svg>
            <p>No semesters added yet. Click "+ Add Semester" to start.</p>
        </div>`;
        return;
    }

    const activeAccordions = Array.from(container.querySelectorAll('.mobile-accordion-item.active')).map(item => item.dataset.semId);

    container.innerHTML = semesters.map((sem, idx) => {
        const semGPA = calculateGPA(sem.courses);
        const totalUnits = sem.courses.reduce((sum, c) => sum + parseInt(c.units || 0), 0);
        const semLevel = (typeof getSemesterLevel === 'function') ? getSemesterLevel(sem, idx, semesters) : 100;
        const displayLevel = String(semLevel).toUpperCase().endsWith('L') ? semLevel : `${semLevel}L`;
        const formattedTitle = (typeof formatSemesterName === 'function') ? formatSemesterName(sem.name) : (sem.name && !sem.name.toLowerCase().includes('semester') ? `${sem.name} Semester` : sem.name);
        
        const isExpanded = activeAccordions.includes(sem.id) || (activeAccordions.length === 0 && idx === semesters.length - 1);
        const activeClass = isExpanded ? 'active' : '';

        return `
            <div class="mobile-accordion-item glass ${activeClass}" data-sem-id="${sem.id}">
                <div class="mobile-accordion-header" onclick="toggleAccordion('${sem.id}')">
                    <div class="mobile-accordion-title-wrap">
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                            <span onclick="event.stopPropagation(); if (typeof openEditSemesterModal === 'function') openEditSemesterModal('${sem.id}');" title="Click to edit level & semester" style="background: rgba(99, 102, 241, 0.15); color: #818cf8; font-size: 0.68rem; font-weight: 700; padding: 0.1rem 0.45rem; border-radius: 99px; border: 1px solid rgba(99, 102, 241, 0.25); cursor: pointer;">${displayLevel}</span>
                            <h3 style="margin: 0;">${formattedTitle}</h3>
                        </div>
                        <div class="mobile-accordion-meta">
                            <span>${sem.courses.length} Courses</span>
                            <span>•</span>
                            <span>${totalUnits} Credit Units</span>
                        </div>
                    </div>
                    <div class="mobile-accordion-header-right" style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="mobile-accordion-gpa">GPA: ${semGPA}</span>
                        <button onclick="event.stopPropagation(); if (typeof openEditSemesterModal === 'function') openEditSemesterModal('${sem.id}');" title="Edit Semester Details" style="background: rgba(255,255,255,0.06); border: 1px solid var(--border); border-radius: 6px; color: var(--text-secondary); padding: 0.3rem 0.45rem; display: flex; align-items: center; cursor: pointer;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                        </button>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mobile-accordion-chevron"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                </div>
                
                <div class="mobile-accordion-content">
                    <div class="mobile-course-list">
                        ${sem.courses.length === 0 ? '<p style="color: var(--text-secondary); font-size: 0.8rem; text-align: center; padding: 1rem 0;">No courses added to this semester.</p>' : ''}
                        
                        ${sem.courses.map(course => `
                            <div class="mobile-course-row">
                                <div class="mobile-course-info">
                                    <span class="mobile-course-code">${course.code}</span>
                                    <span class="mobile-course-title">${course.title}</span>
                                </div>
                                <div class="mobile-course-right">
                                    <span class="mobile-course-units">${course.units} U</span>
                                    <span class="mobile-course-grade">${getGradeLetter(course.grade)}</span>
                                    <button onclick="event.stopPropagation(); deleteCourse('${sem.id}', '${course.id}')" class="mobile-course-delete-btn" title="Delete Course">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="mobile-accordion-actions">
                        <button onclick="event.stopPropagation(); openCourseModal('${sem.id}')" class="mobile-acc-action-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg> Add Course
                        </button>
                        <button onclick="event.stopPropagation(); deleteSemester('${sem.id}')" class="mobile-acc-action-btn text-danger">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg> Delete Semester
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

window.toggleAccordion = function(semId) {
    const items = document.querySelectorAll('.mobile-accordion-item');
    items.forEach(item => {
        if (item.dataset.semId === semId) {
            item.classList.toggle('active');
        }
    });
};

/* 7. Quick Analytics Cards Section */
function updateAnalyticsSection() {
    if (typeof semesters === 'undefined' || semesters.length === 0) return;
    
    let highestGPA = 0;
    let bestSemName = 'N/A';
    let totalCoursesCount = 0;
    
    semesters.forEach(sem => {
        const semGPA = parseFloat(calculateGPA(sem.courses));
        if (semGPA > highestGPA) {
            highestGPA = semGPA;
            const formatted = (typeof formatSemesterName === 'function') ? formatSemesterName(sem.name) : sem.name;
            bestSemName = formatted.split(' - ')[1] || formatted;
        }
        totalCoursesCount += sem.courses.length;
    });

    const currentCGPA = parseFloat(document.getElementById('cgpa-display')?.textContent || '0.00');
    const scaleVal = typeof gradingScale !== 'undefined' ? gradingScale : 5;
    const totalUnits = semesters.reduce((sum, sem) => sum + sem.courses.reduce((s, c) => s + parseInt(c.units || 0), 0), 0);
    
    let projectedCGPA = currentCGPA;
    if (totalUnits > 0) {
        const currentPoints = currentCGPA * totalUnits;
        const projectedPoints = currentPoints + (15 * scaleVal);
        projectedCGPA = projectedPoints / (totalUnits + 15);
    } else {
        projectedCGPA = scaleVal;
    }

    const highestGpaEl = document.getElementById('mobile-analytics-highest-gpa');
    const bestSemEl = document.getElementById('mobile-analytics-best-semester');
    const totalCoursesEl = document.getElementById('mobile-analytics-total-courses');
    const projectedCgpaEl = document.getElementById('mobile-analytics-projected-cgpa');

    if (highestGpaEl) highestGpaEl.textContent = highestGPA.toFixed(2);
    if (bestSemEl) bestSemEl.textContent = bestSemName;
    if (totalCoursesEl) totalCoursesEl.textContent = totalCoursesCount;
    if (projectedCgpaEl) projectedCgpaEl.textContent = projectedCGPA.toFixed(2);
}

/* 8. Quick Actions Triggers */
function setupQuickActions() {
    const addCourseBtn = document.getElementById('mobile-action-add-course');
    if (addCourseBtn) addCourseBtn.addEventListener('click', handleAddCourseQuickAction);
    
    const addSemBtn = document.getElementById('mobile-action-add-semester');
    if (addSemBtn) addSemBtn.addEventListener('click', handleAddSemesterAction);

    const addSemTextBtn = document.getElementById('mobile-add-semester-text-btn');
    if (addSemTextBtn) addSemTextBtn.addEventListener('click', handleAddSemesterAction);

    const mobFab = document.getElementById('mobile-fab');
    if (mobFab) mobFab.addEventListener('click', handleAddSemesterAction);
    
    const exportPdfBtn = document.getElementById('mobile-action-export-pdf');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', () => {
            const btn = document.getElementById('export-pdf');
            if (btn) btn.click();
        });
    }
    
    const mobSaveImage = document.getElementById('mobile-action-save-image');
    if (mobSaveImage) {
        mobSaveImage.addEventListener('click', () => {
            const btn = document.getElementById('export-image');
            if (btn) {
                btn.click();
            } else if (typeof exportToImage === 'function') {
                exportToImage();
            }
        });
    }
}

function handleAddSemesterAction() {
    if (window.isRegistrationIncomplete && window.isRegistrationIncomplete()) {
        if (typeof window.showToast === 'function') {
            window.showToast('Please fill in your Matric Number, Faculty, and Department and save changes first.', 'Registration Required 🎓', 'warning');
        }
        return;
    }
    const btn = document.getElementById('add-semester-btn');
    if (btn) btn.click();
}

function handleAddCourseQuickAction() {
    if (window.isRegistrationIncomplete && window.isRegistrationIncomplete()) {
        if (typeof window.showToast === 'function') {
            window.showToast('Please fill in your Matric Number, Faculty, and Department and save changes first.', 'Registration Required 🎓', 'warning');
        }
        return;
    }
    if (typeof semesters === 'undefined' || semesters.length === 0) {
        alert('Please add a semester first.');
    } else {
        openCourseModal(semesters[semesters.length - 1].id);
    }
}

/* 9. Mobile Sticky Top Header / Navigation Drawer Toggle */
function setupDrawer() {
    const drawer = document.getElementById('mobile-drawer');
    const overlay = document.getElementById('mobile-drawer-overlay');
    const openBtn = document.getElementById('mobile-menu-trigger');
    const closeBtn = document.getElementById('mobile-drawer-close');
    
    const openDrawer = () => {
        drawer.classList.add('active');
        overlay.classList.add('active');
    };
    
    const closeDrawer = () => {
        drawer.classList.remove('active');
        overlay.classList.remove('active');
    };
    
    if (openBtn) openBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (overlay) overlay.addEventListener('click', closeDrawer);
    
    document.querySelectorAll('.drawer-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                closeDrawer();
                return; // Allow standard page navigation (e.g. help.html)
            }
            e.preventDefault();
            closeDrawer();
            
            const id = link.id;
            if (id === 'mobnav-logout') {
                const logoutBtn = document.getElementById('logout-btn');
                if (logoutBtn) logoutBtn.click();
                return;
            }

            // Enforce profile completion for Google users before accessing other sections
            if (window.isRegistrationIncomplete && window.isRegistrationIncomplete()) {
                if (id !== 'mobnav-profile') {
                    if (typeof window.showToast === 'function') {
                        window.showToast('Please fill in your Matric Number, Faculty, and Department and save changes before accessing other sections.', 'Registration Required 🎓', 'warning');
                    }
                    return;
                }
            }

            if (id === 'mobnav-profile') {
                const navProfile = document.getElementById('nav-profile');
                if (navProfile) navProfile.click();
                return;
            }
            
            const sectionMap = {
                'mobnav-dashboard': 'nav-dashboard',
                'mobnav-courses': 'nav-courses',
                'mobnav-planner': 'nav-planner',
                'mobnav-resources': 'nav-resources',
                'mobnav-archives': 'nav-archives',
                'mobnav-admin': 'nav-admin',
                'mobnav-settings': 'nav-settings'
            };
            
            const dest = sectionMap[id];
            if (dest) {
                const targetBtn = document.getElementById(dest);
                if (targetBtn) targetBtn.click();
            }
        });
    });

    const mobProfTrigger = document.getElementById('mobile-profile-trigger');
    if (mobProfTrigger) {
        mobProfTrigger.addEventListener('click', () => {
            const navProfile = document.getElementById('nav-profile');
            if (navProfile) navProfile.click();
        });
    }
}

/* 10. Bottom Navigation Routings */
function setupBottomNavigation() {
    const isAdmin = () => {
        const user = JSON.parse(localStorage.getItem('user'));
        const ADMIN_EMAILS = ['gideonlastgids@gmail.com'];
        return user && ADMIN_EMAILS.includes(user.email);
    };

    document.querySelectorAll('.botnav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.classList.contains('add-btn') || link.id === 'botnav-add') {
                e.preventDefault();
                if (typeof window.toggleBotnavActionsSheet === 'function') {
                    window.toggleBotnavActionsSheet();
                }
                return;
            }

            // Close actions sheet when user navigates
            if (typeof window.closeBotnavActionsSheet === 'function') {
                window.closeBotnavActionsSheet();
            }
            
            e.preventDefault();
            const id = link.id;

            // Enforce profile completion before allowing bottom navigation
            if (window.isRegistrationIncomplete && window.isRegistrationIncomplete()) {
                if (id !== 'botnav-settings') {
                    if (typeof window.showToast === 'function') {
                        window.showToast('Please fill in your Matric Number, Faculty, and Department and save changes before accessing the dashboard.', 'Registration Required 🎓', 'warning');
                    }
                    return;
                }
            }
            
            if (id === 'botnav-dashboard') {
                document.getElementById('nav-dashboard').click();
            } else if (id === 'botnav-courses') {
                document.getElementById('nav-courses').click();
            } else if (id === 'botnav-settings') {
                if (window.isRegistrationIncomplete && window.isRegistrationIncomplete()) {
                    document.getElementById('nav-profile').click();
                } else {
                    document.getElementById('nav-settings').click();
                }
            } else if (id === 'botnav-analytics') {
                if (isAdmin()) {
                    const adminLink = document.getElementById('nav-admin');
                    if (adminLink) adminLink.click();
                } else {
                    document.getElementById('nav-dashboard').click();
                    setTimeout(() => {
                        const chartCard = document.querySelector('.mobile-chart-card');
                        if (chartCard) {
                            chartCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }, 200);
                }
            }
        });
    });
}
 
/* 10b. Center Plus Action Sheet (Speed-Dial for Add Course, Add Semester, Save PDF) */
function setupBotnavActions() {
    const sheet = document.getElementById('botnav-actions-sheet');
    const overlay = document.getElementById('botnav-actions-overlay');
    const addBtn = document.getElementById('botnav-add');
    const closeBtn = document.getElementById('botnav-actions-close');

    const courseBtn = document.getElementById('botnav-action-add-course');
    const semesterBtn = document.getElementById('botnav-action-add-semester');
    const pdfBtn = document.getElementById('botnav-action-save-pdf');

    window.openBotnavActionsSheet = () => {
        if (sheet) sheet.classList.add('active');
        if (overlay) overlay.classList.add('active');
        if (addBtn) addBtn.classList.add('is-open');
        if (window.lucide) lucide.createIcons();
    };

    window.closeBotnavActionsSheet = () => {
        if (sheet) sheet.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
        if (addBtn) addBtn.classList.remove('is-open');
    };

    window.toggleBotnavActionsSheet = () => {
        if (sheet && sheet.classList.contains('active')) {
            window.closeBotnavActionsSheet();
        } else {
            window.openBotnavActionsSheet();
        }
    };

    if (overlay) overlay.addEventListener('click', window.closeBotnavActionsSheet);
    if (closeBtn) closeBtn.addEventListener('click', window.closeBotnavActionsSheet);

    if (courseBtn) {
        courseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.closeBotnavActionsSheet();
            handleAddCourseQuickAction();
        });
    }

    if (semesterBtn) {
        semesterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.closeBotnavActionsSheet();
            handleAddSemesterAction();
        });
    }

    if (pdfBtn) {
        pdfBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.closeBotnavActionsSheet();
            const btn = document.getElementById('export-pdf') || document.getElementById('mobile-action-export-pdf');
            if (btn) {
                btn.click();
            } else if (typeof window.exportToPDF === 'function') {
                window.exportToPDF();
            }
        });
    }
}

/* 11. Grouped Settings Interaction */
function setupSettingsGroup() {
    document.getElementById('mob-set-account').addEventListener('click', () => {
        document.getElementById('nav-profile').click();
    });

    const mobSetUni = document.getElementById('mob-set-university');
    if (mobSetUni) {
        mobSetUni.addEventListener('click', () => {
            if (typeof openUniModal === 'function') openUniModal();
        });
    }

    document.getElementById('mob-set-appearance').addEventListener('click', () => {
        document.getElementById('theme-toggle').click();
        const icon = document.querySelector('#mob-set-appearance .mobile-settings-icon i');
        if (icon) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
            if (window.lucide) lucide.createIcons();
        }
    });

    document.getElementById('mob-set-grading').addEventListener('click', () => {
        const select = document.getElementById('settings-scale-select');
        if (select) {
            select.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => {
                select.focus();
            }, 300);
        }
    });

    document.getElementById('mob-set-notifications').addEventListener('click', () => {
        alert('🔔 Mobile Notifications configured successfully!');
    });

    document.getElementById('mob-set-backup').addEventListener('click', () => {
        document.getElementById('settings-export-btn').click();
    });

    const mobSetResetPw = document.getElementById('mob-set-reset-password');
    if (mobSetResetPw) {
        mobSetResetPw.addEventListener('click', () => {
            if (typeof window.openResetPwModal === 'function') {
                window.openResetPwModal();
            }
        });
    }

    document.getElementById('mob-set-advanced').addEventListener('click', () => {
        if (confirm('⚠️ Warning: Are you sure you want to clear your local cache? This will reset local customizations, but your records are saved in the database.')) {
            localStorage.removeItem('cgpa_tasks');
            localStorage.removeItem('cgpa_resources');
            alert('Settings reset successfully. Reloading...');
            window.location.reload();
        }
    });
}

/* 12. Navigation Syncing (Triggered on document clicks) */
function syncNavigationStates() {
    const activeSection = Array.from(document.querySelectorAll('.app-section'))
        .find(sec => sec.style.display === 'block');
        
    if (!activeSection) return;
    const targetName = activeSection.id.replace('section-', '');

    document.querySelectorAll('.botnav-link').forEach(link => {
        if (link.id === 'botnav-add' || link.classList.contains('add-btn')) return;
        let isActive = link.id === `botnav-${targetName}`;
        if (targetName === 'admin' && link.id === 'botnav-analytics') {
            isActive = true;
        }
        if (targetName === 'profile' && link.id === 'botnav-settings') {
            isActive = true;
        }
        link.classList.toggle('active', isActive);
    });

    document.querySelectorAll('.drawer-link').forEach(link => {
        let isActive = link.id === `mobnav-${targetName}`;
        if (targetName === 'profile' && link.id === 'mobnav-profile') {
            isActive = true;
        }
        link.classList.toggle('active', isActive);
    });
}
window.syncNavigationStates = syncNavigationStates;
window.updateMobileUIDebounced = updateMobileUIDebounced;

/* 13. Horizontal Swipes / Page Dots binding for carousels */
function setupCarouselSwipeListeners() {
    const kpiCarousel = document.getElementById('mobile-kpi-carousel');
    const kpiDots = document.querySelectorAll('#mobile-kpi-dots .dot');
    
    if (kpiCarousel && kpiDots.length > 0) {
        kpiCarousel.addEventListener('scroll', () => {
            const index = Math.round(kpiCarousel.scrollLeft / kpiCarousel.clientWidth);
            kpiDots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === index);
            });
        });
    }

    const analCarousel = document.getElementById('mobile-analytics-carousel');
    const analDots = document.querySelectorAll('#mobile-analytics-dots .dot');
    
    if (analCarousel && analDots.length > 0) {
        analCarousel.addEventListener('scroll', () => {
            const index = Math.round(analCarousel.scrollLeft / (analCarousel.clientWidth / 2));
            analDots.forEach((dot, idx) => {
                dot.classList.toggle('active', idx === Math.floor(index / 2));
            });
        });
    }

    const toggleCgpaBtn = document.getElementById('mobile-toggle-cgpa');
    const toggleGpaBtn = document.getElementById('mobile-toggle-gpa');

    if (toggleCgpaBtn && toggleGpaBtn) {
        toggleCgpaBtn.addEventListener('click', () => {
            toggleCgpaBtn.classList.add('active');
            toggleGpaBtn.classList.remove('active');
            activeChartType = 'cgpa';
            updateMobileChart();
        });

        toggleGpaBtn.addEventListener('click', () => {
            toggleGpaBtn.classList.add('active');
            toggleCgpaBtn.classList.remove('active');
            activeChartType = 'gpa';
            updateMobileChart();
        });
    }
}

/* 14. Mobile Performance Chart Line Rendering (Optimized Object Reuse) */
function updateMobileChart() {
    const canvas = document.getElementById('mobileCgpaChart');
    if (!canvas || window.innerWidth >= 768) return;
    
    if (typeof semesters === 'undefined' || semesters.length === 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Outfit';
            ctx.textAlign = 'center';
            ctx.fillText('Please add semesters to view performance trend', canvas.width / 2, canvas.height / 2);
        }
        return;
    }

    const chartLabels = semesters.map((s, idx) => {
        const level = (typeof getSemesterLevel === 'function') 
            ? getSemesterLevel(s, idx, semesters) 
            : 100;
        const sem = s.name.includes('Second') || s.name.includes('2nd') ? '2nd' : '1st';
        return `${level}L - ${sem}`;
    });

    // Prepare chart data (CGPA or GPA)
    let chartData = [];
    const scaleVal = typeof gradingScale !== 'undefined' ? gradingScale : 5;

    if (activeChartType === 'gpa') {
        chartData = semesters.map(s => calculateGPA(s.courses));
    } else {
        let runningUnits = 0;
        let runningPoints = 0;
        chartData = semesters.map(s => {
            s.courses.forEach(c => {
                const u = parseInt(c.units || 0);
                const g = parseFloat(c.grade || 0);
                runningUnits += u;
                runningPoints += u * g;
            });
            return runningUnits > 0 ? (runningPoints / runningUnits).toFixed(2) : "0.00";
        });
    }

    // Reuse existing chart instance if available
    if (mobileChartInstance) {
        mobileChartInstance.data.labels = chartLabels.length > 0 ? chartLabels : ['100L - 1st'];
        mobileChartInstance.data.datasets[0].data = chartData.length > 0 ? chartData : [0.0];
        mobileChartInstance.data.datasets[0].label = activeChartType === 'gpa' ? 'GPA' : 'CGPA';
        mobileChartInstance.options.scales.y.max = scaleVal;
        mobileChartInstance.update();
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 180);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    mobileChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels.length > 0 ? chartLabels : ['100L - 1st'],
            datasets: [{
                label: activeChartType === 'gpa' ? 'GPA' : 'CGPA',
                data: chartData.length > 0 ? chartData : [0.0],
                borderColor: '#10b981',
                borderWidth: 3,
                tension: 0.35,
                fill: true,
                backgroundColor: gradient,
                pointRadius: 4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#090d16',
                pointBorderWidth: 1.5,
                pointHoverRadius: 6,
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
                    max: scaleVal,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.04)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        font: {
                            family: "'Outfit', sans-serif",
                            weight: 600,
                            size: 10
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
                            size: 9
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

/* 12. Mobile Toast Notification System */
window.showMobileToast = window.showToast = function(message, title = 'Notification', type = 'success') {
    let container = document.getElementById('mobile-toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'mobile-toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'mobile-toast';

    const iconSvg = type === 'success' 
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    toast.innerHTML = `
        <div class="mobile-toast-icon">
            ${iconSvg}
        </div>
        <div class="mobile-toast-content">
            <h4 class="mobile-toast-title">${title}</h4>
            <p class="mobile-toast-message">${message}</p>
        </div>
        <button class="mobile-toast-close" onclick="this.parentElement.remove()">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
    });

    setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 350);
    }, 3500);
};


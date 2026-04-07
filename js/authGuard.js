/* =============================================
   authGuard.js — Route Protection
   Depends on: utils.js (loaded before this)

   NOTE: HTML pages already call requireUser()
   or requireMentor() inline before body renders.
   This file is a secondary safety net — it runs
   after DOMContentLoaded in case inline guard
   was skipped. Do NOT duplicate inline guards.
   ============================================= */

(function guardRoute() {
    const token       = getStorage('token');
    const role        = getStorage('role');
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Login page is always open
    if (currentPage === 'index.html') return;

    // Not authenticated at all
    if (!token || !role) {
        redirect('index.html');
        return;
    }

    // Mentor-only pages
    if (currentPage === 'dashboard.html' && role !== 'MENTOR') {
        redirect('index.html');
        return;
    }

    // User-only pages
    const userPages = ['home.html', 'analyzer.html', 'mentorprofile.html'];
    if (userPages.includes(currentPage) && role !== 'USER') {
        redirect('index.html');
    }
})();
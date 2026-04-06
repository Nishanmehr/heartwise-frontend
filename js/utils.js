/* =============================================
   utils.js — Shared Utilities
   Load this FIRST on every page
   ============================================= */

/**
 * Show a toast notification
 */
function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/**
 * localStorage helpers
 */
function getStorage(key) {
  return localStorage.getItem(key);
}
function setStorage(key, value) {
  localStorage.setItem(key, value);
}
function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('username');
  localStorage.removeItem('userId');
}

/**
 * Redirect helper
 */
function redirect(path) {
  window.location.replace(path);
}

/**
 * Update navbar avatar with user's initial
 */
function updateNavAvatar(name) {
  const el = document.getElementById('navAvatar');
  if (el) el.textContent = (name || 'U').charAt(0).toUpperCase();
}

/**
 * Hide/show <html> to prevent flash of wrong content
 */
function toggleDoc(visible) {
  document.documentElement.style.display = visible ? '' : 'none';
}

/**
 * Auth guards — call once per protected page
 */
function requireAuth() {
  const token = getStorage('token');
  const role  = getStorage('role');
  if (!token || !role) redirect('index.html');
}

function requireUser() {
  const token = getStorage('token');
  const role  = getStorage('role');
  if (!token || role !== 'USER') redirect('index.html');
}

function requireMentor() {
  const token = getStorage('token');
  const role  = getStorage('role');
  if (!token || role !== 'MENTOR') redirect('index.html');
}

/**
 * Logout — clear auth and go to login
 */
function logout() {
  clearAuth();
  redirect('index.html');
}
/* =============================================
   auth.js — Login + Register Logic
   Depends on: utils.js, api.js
   ============================================= */

/* ── Tab switching: User / Mentor ── */
function switchLogin(type) {
  document.getElementById('login-user').style.display   = type === 'user'   ? 'block' : 'none';
  document.getElementById('login-mentor').style.display = type === 'mentor' ? 'block' : 'none';
  document.getElementById('lt-user').classList.toggle('active',   type === 'user');
  document.getElementById('lt-mentor').classList.toggle('active', type === 'mentor');
}

/* ── Mode switching: Login / Register ── */
function switchMode(role, mode) {
  const loginEl    = document.getElementById(`${role}-login-form`);
  const registerEl = document.getElementById(`${role}-register-form`);
  const loginBtn   = document.getElementById(`${role}-mode-login`);
  const regBtn     = document.getElementById(`${role}-mode-register`);

  loginEl.style.display    = mode === 'login'    ? 'block' : 'none';
  registerEl.style.display = mode === 'register' ? 'block' : 'none';
  loginBtn.classList.toggle('active',    mode === 'login');
  regBtn.classList.toggle('active',      mode === 'register');
}

/* ── Save auth data and redirect ── */
function saveAuthAndRedirect(data, destination) {
  if (!data.token) { toast('Login failed — no token received ❌'); return; }
  setStorage('userId',   data.id);
  setStorage('username', data.name);
  setStorage('role',     data.role);
  setStorage('token',    data.token);
  updateNavAvatar(data.name);
  setTimeout(() => redirect(destination), 800);
}

/* ══════════════ USER LOGIN ══════════════ */
async function loginUser() {
  const email    = document.getElementById('userEmail').value.trim();
  const password = document.getElementById('userPass').value.trim();
  if (!email || !password) { toast('Please fill in all fields ⚠️'); return; }

  try {
    const data = await apiLoginUser(email, password);
    toast('Welcome back! 💞');
    saveAuthAndRedirect(data, 'home.html');
  } catch (err) {
    toast(err.message || 'Network error. Is the server running?');
  }
}

/* ══════════════ USER REGISTER ══════════════ */
async function registerUser() {
  const name     = document.getElementById('regUserName').value.trim();
  const email    = document.getElementById('regUserEmail').value.trim();
  const password = document.getElementById('regUserPass').value.trim();
  const confirm  = document.getElementById('regUserConfirm').value.trim();

  if (!name || !email || !password || !confirm) { toast('Please fill in all fields ⚠️'); return; }
  if (password !== confirm)                      { toast('Passwords do not match ⚠️'); return; }
  if (password.length < 6)                       { toast('Password must be at least 6 characters ⚠️'); return; }

  try {
    const data = await apiRegisterUser(name, email, password);
    toast('Account created! Welcome 💞');
    saveAuthAndRedirect(data, 'home.html');
  } catch (err) {
    toast(err.message || 'Registration failed ❌');
  }
}

/* ══════════════ MENTOR LOGIN ══════════════ */
async function loginMentor() {
  const email    = document.getElementById('mentorEmail').value.trim();
  const password = document.getElementById('mentorPass').value.trim();
  const mentorId = document.getElementById('mentorId').value.trim();

  if (!email || !password || !mentorId) { toast('Please fill in all fields ⚠️'); return; }

  try {
    const data = await apiLoginMentor(email, password);
    toast('Welcome, Mentor! 🌟');
    saveAuthAndRedirect(data, 'dashboard.html');
  } catch (err) {
    toast(err.message || 'Network error. Is the server running?');
  }
}

/* ══════════════ MENTOR REGISTER ══════════════ */
async function registerMentor() {
  const name       = document.getElementById('regMentorName').value.trim();
  const email      = document.getElementById('regMentorEmail').value.trim();
  const password   = document.getElementById('regMentorPass').value.trim();
  const confirm    = document.getElementById('regMentorConfirm').value.trim();
  const specialty  = document.getElementById('regMentorSpecialty').value.trim();
  const experience = parseInt(document.getElementById('regMentorExp').value.trim()) || 0;
  const price      = parseFloat(document.getElementById('regMentorPrice').value.trim()) || 500;

  if (!name || !email || !password || !confirm || !specialty) {
    toast('Please fill in all required fields ⚠️'); return;
  }
  if (password !== confirm) { toast('Passwords do not match ⚠️'); return; }
  if (password.length < 6) { toast('Password must be at least 6 characters ⚠️'); return; }

  try {
    const data = await apiRegisterMentor(name, email, password, specialty, experience, price);
    toast('Mentor account created! 🌟');
    saveAuthAndRedirect(data, 'dashboard.html');
  } catch (err) {
    toast(err.message || 'Registration failed ❌');
  }
}
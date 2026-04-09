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
  document.getElementById(`${role}-login-form`).style.display    = mode === 'login'    ? 'block' : 'none';
  document.getElementById(`${role}-register-form`).style.display = mode === 'register' ? 'block' : 'none';
  document.getElementById(`${role}-mode-login`).classList.toggle('active',    mode === 'login');
  document.getElementById(`${role}-mode-register`).classList.toggle('active', mode === 'register');
}

/* ── Preview profile picture ── */
function previewPic(input) {
  const preview = document.getElementById('picPreview');
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src     = e.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

/* ── Convert image file to base64 ── */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const firstName = document.getElementById('regMentorFirstName').value.trim();
  const lastName  = document.getElementById('regMentorLastName').value.trim();
  const email     = document.getElementById('regMentorEmail').value.trim();
  const password  = document.getElementById('regMentorPass').value.trim();
  const confirm   = document.getElementById('regMentorConfirm').value.trim();
  const dob       = document.getElementById('regMentorDob').value.trim();
  const gender    = document.getElementById('regMentorGender').value.trim();
  const specialty = document.getElementById('regMentorSpecialty').value.trim();
  const skills    = document.getElementById('regMentorSkills').value.trim();
  const languages = document.getElementById('regMentorLanguages').value.trim();
  const experience= parseInt(document.getElementById('regMentorExp').value.trim())   || 0;
  const price     = parseFloat(document.getElementById('regMentorPrice').value.trim()) || 500;
  const picFile   = document.getElementById('regMentorPic').files[0];

  // Validate required fields
  if (!firstName || !lastName)   { toast('First and last name are required ⚠️'); return; }
  if (!email)                    { toast('Email is required ⚠️'); return; }
  if (!password || password.length < 6) { toast('Password must be at least 6 characters ⚠️'); return; }
  if (password !== confirm)      { toast('Passwords do not match ⚠️'); return; }
  if (!dob)                      { toast('Date of birth is required ⚠️'); return; }
  if (!gender)                   { toast('Please select your gender ⚠️'); return; }
  if (!specialty)                { toast('Specialty is required ⚠️'); return; }
  if (!skills)                   { toast('Skills are required ⚠️'); return; }
  if (!languages)                { toast('Languages are required ⚠️'); return; }

  // Convert profile picture to base64 if provided
  let profilePicture = null;
  if (picFile) {
    try {
      profilePicture = await fileToBase64(picFile);
    } catch (_) {
      toast('Could not process profile picture ⚠️');
      return;
    }
  }

  try {
    const data = await apiRegisterMentor(
      firstName, lastName, email, password,
      dob, gender, specialty, skills, languages,
      experience, price, profilePicture
    );
    toast('Mentor account created! 🌟');
    saveAuthAndRedirect(data, 'dashboard.html');
  } catch (err) {
    toast(err.message || 'Registration failed ❌');
  }
}
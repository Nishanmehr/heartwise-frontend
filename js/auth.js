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
  setStorage('email',    data.email);
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

    // If email not verified — show OTP screen
    if (data.needsVerification) {
      showOtpScreen(data.email);
      toast('Please verify your email first 📧');
      return;
    }

    toast('Welcome back! 💞');
    saveAuthAndRedirect(data, 'home.html');
  } catch (err) {
    // Check if error response has needsVerification
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
    // Show OTP screen
    showOtpScreen(email);
    toast('OTP sent to ' + email + ' 📧');
  } catch (err) {
    toast(err.message || 'Registration failed ❌');
  }
}

/* ══════════════ SHOW OTP SCREEN ══════════════ */
function showOtpScreen(email) {
  // Hide all panels safely
  var userEl   = document.getElementById('login-user');
  var mentorEl = document.getElementById('login-mentor');
  var toggleEl = document.getElementById('login-toggle');
  var otpEl    = document.getElementById('otp-screen');
  var emailEl  = document.getElementById('otpEmailDisplay');

  if (userEl)   userEl.style.display   = 'none';
  if (mentorEl) mentorEl.style.display = 'none';
  if (toggleEl) toggleEl.style.display = 'none';
  if (otpEl)    otpEl.style.display    = 'block';
  if (emailEl)  emailEl.textContent    = email;

  // Store email for verification
  window._pendingOtpEmail = email;
}

/* ══════════════ VERIFY OTP ══════════════ */
async function verifyOtp() {
  const otp   = document.getElementById('otpInput').value.trim();
  const email = window._pendingOtpEmail;
  const role  = window._pendingOtpRole || 'user';

  if (!otp || otp.length !== 6) { toast('Please enter the 6-digit OTP ⚠️'); return; }

  // Mentor OTP
  if (role === 'mentor') { verifyMentorOtp(); return; }

  try {
    const data = await apiVerifyOtp(email, otp);
    toast('Email verified! Welcome 💞');
    saveAuthAndRedirect(data, 'home.html');
  } catch (err) {
    toast(err.message || 'Invalid OTP ❌');
  }
}

/* ══════════════ RESEND OTP ══════════════ */
async function resendOtp() {
  const email = window._pendingOtpEmail;
  try {
    await apiResendOtp(email);
    toast('OTP resent to ' + email + ' 📧');
  } catch (err) {
    toast(err.message || 'Failed to resend OTP ❌');
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

    if (data.needsVerification) {
      showMentorOtpScreen(data.email);
      toast('Please verify your email first 📧');
      return;
    }

    if (data.pendingApproval) {
      sessionStorage.setItem('pendingMentorEmail', data.email);
      sessionStorage.setItem('pendingMentorName',  data.name || '');
      toast('Application under review ⏳');
      setTimeout(() => { location.href = 'mentor-pending.html'; }, 1000);
      return;
    }

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

    // Show OTP screen for mentor
    if (data.needsVerification) {
      showMentorOtpScreen(email);
      toast('OTP sent to ' + email + ' 📧');
      return;
    }

    toast('Mentor account created! 🌟');
    saveAuthAndRedirect(data, 'dashboard.html');
  } catch (err) {
    toast(err.message || 'Registration failed ❌');
  }
}

/* ══════════════ MENTOR OTP SCREEN ══════════════ */
function showMentorOtpScreen(email) {
  var userEl   = document.getElementById('login-user');
  var mentorEl = document.getElementById('login-mentor');
  var toggleEl = document.getElementById('login-toggle');
  var otpEl    = document.getElementById('otp-screen');
  var emailEl  = document.getElementById('otpEmailDisplay');

  if (userEl)   userEl.style.display   = 'none';
  if (mentorEl) mentorEl.style.display = 'none';
  if (toggleEl) toggleEl.style.display = 'none';
  if (otpEl)    otpEl.style.display    = 'block';
  if (emailEl)  emailEl.textContent    = email;

  window._pendingOtpEmail  = email;
  window._pendingOtpRole   = 'mentor';
}

/* ══════════════ MENTOR VERIFY OTP ══════════════ */
async function verifyMentorOtp() {
  const otp   = document.getElementById('otpInput').value.trim();
  const email = window._pendingOtpEmail;
  if (!otp || otp.length !== 6) { toast('Please enter the 6-digit OTP ⚠️'); return; }

  try {
    const data = await apiFetch('/auth/mentor/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });

    // Redirect to pending approval page
    if (data.pendingApproval) {
      sessionStorage.setItem('pendingMentorEmail', email);
      sessionStorage.setItem('pendingMentorName',  data.name || '');
      toast('Email verified! ✅ Redirecting...');
      setTimeout(() => { location.href = 'mentor-pending.html'; }, 1000);
      return;
    }
  } catch (err) {
    toast(err.message || 'Invalid OTP ❌');
  }
}
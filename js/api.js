/* =============================================
   api.js — All Backend API Calls
   Depends on: utils.js
   ============================================= */

const BASE_URL = 'https://heartwise-backend-production.up.railway.app/api';
async function apiFetch(endpoint, options = {}) {
  const token = getStorage('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }

  // Safely parse JSON — some PUT/DELETE responses may have empty or non-JSON body
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return {}; // Return empty object for responses with no JSON body
}

/* ── AUTH ── */

async function apiLoginUser(email, password) {
  return apiFetch('/auth/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function apiVerifyOtp(email, otp) {
  return apiFetch('/auth/user/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
}

async function apiResendOtp(email) {
  return apiFetch('/auth/user/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

async function apiRegisterUser(name, email, password) {
  return apiFetch('/auth/user/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

async function apiLoginMentor(email, password) {
  return apiFetch('/auth/mentor/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function apiRegisterMentor(firstName, lastName, email, password, dob, gender, specialty, skills, languages, experience, price, profilePicture) {
  return apiFetch('/auth/mentor/register', {
    method: 'POST',
    body: JSON.stringify({ firstName, lastName, email, password, dob, gender, specialty, skills, languages, experience, price, profilePicture }),
  });
}

/* ── MENTORS ── */

async function apiGetMentors() {
  return apiFetch('/mentors');
}

async function apiGetMentor(id) {
  return apiFetch(`/mentors/${id}`);
}

async function apiUpdateMentor(id, data) {
  return apiFetch(`/mentors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/* ── SESSIONS ── */

async function apiBookSession(mentorId, type, slot) {
  const userId = getStorage('userId');
  return apiFetch('/sessions/book', {
    method: 'POST',
    headers: { 'X-User-Id': userId },
    body: JSON.stringify({ mentorId, type, slot }),
  });
}

async function apiGetMentorSessions(mentorId) {
  return apiFetch(`/sessions/mentor/${mentorId}`);
}

async function apiGetUserSessions(userId) {
  return apiFetch(`/sessions/user/${userId}`);
}

async function apiAcceptSession(sessionId) {
  return apiFetch(`/sessions/${sessionId}/accept`, { method: 'PUT' });
}

async function apiDeclineSession(sessionId) {
  return apiFetch(`/sessions/${sessionId}/decline`, { method: 'PUT' });
}

/* ── NOTIFICATIONS ── */

async function apiGetNotifications(userId) {
  return apiFetch(`/sessions/notifications/${userId}`);
}

async function apiMarkNotificationRead(notifId) {
  return apiFetch(`/sessions/notifications/${notifId}/read`, { method: 'PUT' });
}

/* ── AI ── */

async function apiGenerateLoveLetter(senderName, receiverName, reason, tone, extra) {
  return apiFetch('/ai/love-letter', {
    method: 'POST',
    body: JSON.stringify({ senderName, receiverName, reason, tone, extra }),
  });
}

/* ── ANALYZER ── */

async function apiSaveAnalyzerResult(score, result) {
  return apiFetch('/analyzer/result', {
    method: 'POST',
    body: JSON.stringify({ score, result }),
  });
}

/* ── AVAILABILITY ── */
async function apiGetAvailabilitySlots(mentorId) {
  return apiFetch('/availability/' + mentorId + '/slots');
}

async function apiSaveAvailability(mentorId, data) {
  return apiFetch('/availability/' + mentorId, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
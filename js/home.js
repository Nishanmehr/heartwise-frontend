/* =============================================
   home.js — User Home Page
   Depends on: utils.js, api.js
   ============================================= */

let notificationsOpen = false;

/* ── Render mentor cards ── */
function renderMentors(mentors) {
  const container = document.getElementById('mentorList');
  if (!container) return;
  container.innerHTML = '';

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:24px;">No mentors available right now.</p>';
    return;
  }

  mentors.forEach(m => {
    const name   = m.name      || 'Mentor';
    const letter = name.charAt(0).toUpperCase();
    const id     = m.id        || '';

    const card = document.createElement('div');
    card.className = 'mentor-card';
    card.innerHTML = `
      <div class="verified-badge">✓ Verified</div>
      <div class="mentor-avatar">${letter}</div>
      <div class="mentor-name">${name}</div>
      <div class="mentor-spec">${m.specialty || 'Relationship Expert'}</div>
      <div class="mentor-rating">★ ${m.rating || '5.0'}</div>
      <div class="mentor-price">${m.price || '₹500'} <em>/ 30 min</em></div>
      <div class="card-actions">
        <button class="btn-card"         onclick="location.href='mentorprofile.html?id=${id}'">Profile</button>
        <button class="btn-card primary" onclick="location.href='mentorprofile.html?id=${id}'">Book Now</button>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ── Render notifications dropdown ── */
function renderNotifications(notifs) {
  const list = document.getElementById('notif-list');
  if (!list) return;

  if (!notifs || notifs.length === 0) {
    list.innerHTML = '<div style="padding:16px;color:var(--muted);font-size:13px;text-align:center;">No notifications yet.</div>';
    return;
  }

  list.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markRead(${n.id}, this)">
      <div class="notif-icon">${n.type === 'ACCEPTED' ? '✅' : '❌'}</div>
      <div class="notif-msg">${n.message}</div>
    </div>
  `).join('');
}

/* ── Mark notification as read ── */
async function markRead(notifId, el) {
  try {
    await apiMarkNotificationRead(notifId);
    el.classList.remove('unread');
    refreshUnreadBadge();
  } catch (_) {}
}

/* ── Refresh unread badge count ── */
async function refreshUnreadBadge() {
  const userId = getStorage('userId');
  if (!userId) return;
  try {
    const notifs  = await apiGetNotifications(userId);
    const unread  = notifs.filter(n => !n.read).length;
    const badge   = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent    = unread;
      badge.style.display  = unread > 0 ? 'flex' : 'none';
    }
    renderNotifications(notifs);
  } catch (_) {}
}

/* ── Toggle notification dropdown ── */
function toggleNotifications() {
  const panel = document.getElementById('notif-panel');
  if (!panel) return;
  notificationsOpen = !notificationsOpen;
  panel.style.display = notificationsOpen ? 'block' : 'none';
  if (notificationsOpen) refreshUnreadBadge();
}

// Close panel when clicking outside
document.addEventListener('click', (e) => {
  const bell  = document.getElementById('notif-bell');
  const panel = document.getElementById('notif-panel');
  if (panel && bell && !bell.contains(e.target) && !panel.contains(e.target)) {
    panel.style.display = 'none';
    notificationsOpen   = false;
  }
});

/* ── Page init ── */
window.addEventListener('DOMContentLoaded', async () => {
  requireUser();

  const name = getStorage('username') || 'User';
  updateNavAvatar(name);

  const welcomeEl = document.getElementById('welcomeText');
  if (welcomeEl) welcomeEl.textContent = `Hello, ${name} 👋 How's your heart today?`;

  // Load mentors
  try {
    const mentors = await apiGetMentors();
    renderMentors(mentors);
  } catch (err) {
    const container = document.getElementById('mentorList');
    if (container) container.innerHTML =
      '<p style="color:var(--muted);text-align:center;padding:24px;">Could not load mentors. Please try again.</p>';
  }

  // Load notification unread count
  refreshUnreadBadge();
});
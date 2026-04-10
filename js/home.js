/* =============================================
   home.js — User Home Page
   Depends on: utils.js, api.js
   ============================================= */

let notificationsOpen = false;
let allMentors = []; // Store all mentors for filtering

/* ── Render mentor cards ── */
function renderMentors(mentors) {
  const container = document.getElementById('mentorList');
  if (!container) return;
  container.innerHTML = '';

  if (!mentors || mentors.length === 0) {
    container.innerHTML = '<p style="color:var(--muted);text-align:center;padding:24px;">No mentors found.</p>';
    return;
  }

  mentors.forEach(m => {
    const name   = m.name   || 'Mentor';
    const letter = name.charAt(0).toUpperCase();
    const id     = m.id     || '';
    const price  = m.price  || '₹500';
    const rating = m.rating || 0;

    const card = document.createElement('div');
    card.className = 'mentor-card';
    card.innerHTML = `
      <div class="verified-badge">✓ Verified</div>
      <div class="mentor-avatar">${letter}</div>
      <div class="mentor-name">${name}</div>
      <div class="mentor-spec">${m.specialty || 'Relationship Expert'}</div>
      <div class="mentor-rating">★ ${rating}</div>
      <div class="mentor-price">${price} <em>/ 30 min</em></div>
      <div class="card-actions">
        <button class="btn-card"         onclick="location.href='mentorprofile.html?id=${id}'">Profile</button>
        <button class="btn-card primary" onclick="location.href='mentorprofile.html?id=${id}'">Book Now</button>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ── Populate specialty dropdown ── */
function populateSpecialties(mentors) {
  const select = document.getElementById('filterSpecialty');
  if (!select) return;

  const specialties = [...new Set(
    mentors.map(m => m.specialty).filter(s => s && s !== 'null')
  )];

  specialties.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    select.appendChild(opt);
  });
}

/* ── Parse price string to number e.g. "₹500" → 500 ── */
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  return parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
}

/* ── Apply filters ── */
function applyFilters() {
  const specialty  = document.getElementById('filterSpecialty').value;
  const sortBy     = document.getElementById('filterSort').value;
  const maxPrice   = parseInt(document.getElementById('filterPrice').value) || 99999;
  const minRating  = parseFloat(document.getElementById('filterRating').value) || 0;

  // Update price label
  document.getElementById('priceLabel').textContent =
    maxPrice >= 99999 ? 'Any' : '₹' + maxPrice;

  let filtered = [...allMentors];

  // Filter by specialty
  if (specialty) {
    filtered = filtered.filter(m => m.specialty === specialty);
  }

  // Filter by max price
  filtered = filtered.filter(m => parsePrice(m.price) <= maxPrice);

  // Filter by min rating
  filtered = filtered.filter(m => (m.rating || 0) >= minRating);

  // Sort
  if (sortBy === 'rating-desc')  filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (sortBy === 'rating-asc')   filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  if (sortBy === 'price-asc')    filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
  if (sortBy === 'price-desc')   filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
  if (sortBy === 'exp-desc')     filtered.sort((a, b) => parseInt(b.experience) - parseInt(a.experience));
  if (sortBy === 'exp-asc')      filtered.sort((a, b) => parseInt(a.experience) - parseInt(b.experience));

  renderMentors(filtered);
}

/* ── Reset filters ── */
function resetFilters() {
  document.getElementById('filterSpecialty').value = '';
  document.getElementById('filterSort').value      = '';
  document.getElementById('filterPrice').value     = 99999;
  document.getElementById('filterRating').value    = 0;
  document.getElementById('priceLabel').textContent = 'Any';
  renderMentors(allMentors);
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
    const notifs = await apiGetNotifications(userId);
    const unread = notifs.filter(n => !n.read).length;
    const badge        = document.getElementById('notif-badge');
    const profileBadge = document.getElementById('profileNotifBadge');
    if (badge) {
      badge.textContent   = unread;
      badge.style.display = unread > 0 ? 'flex' : 'none';
      if (profileBadge) { profileBadge.textContent = unread; profileBadge.style.display = unread > 0 ? 'inline' : 'none'; }
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


/* ── Toggle profile dropdown ── */
function toggleProfile() {
  const dropdown = document.getElementById('profileDropdown');
  if (!dropdown) return;
  dropdown.classList.toggle('open');

  // Close notif panel if open
  const panel = document.getElementById('notif-panel');
  if (panel) { panel.style.display = 'none'; notificationsOpen = false; }
}

/* ── Fill profile dropdown with user data ── */
function fillProfileData() {
  const name  = getStorage('username') || 'User';
  const email = getStorage('email')    || '';
  const initial = name.charAt(0).toUpperCase();

  const navAvatar      = document.getElementById('navAvatar');
  const bigAvatar      = document.getElementById('profileBigAvatar');
  const profileName    = document.getElementById('profileName');
  const profileEmail   = document.getElementById('profileEmail');

  if (navAvatar)   navAvatar.textContent   = initial;
  if (bigAvatar)   bigAvatar.textContent   = initial;
  if (profileName) profileName.textContent = name;
  if (profileEmail)profileEmail.textContent= email || 'No email saved';
}

// Close panel when clicking outside
document.addEventListener('click', (e) => {
  const bell  = document.getElementById('notif-bell');
  const panel = document.getElementById('notif-panel');
  if (panel && bell && !bell.contains(e.target) && !panel.contains(e.target)) {
    panel.style.display = 'none';
    notificationsOpen   = false;
  }

  // Close profile dropdown when clicking outside
  const profileBtn      = document.getElementById('profileBtn');
  const profileDropdown = document.getElementById('profileDropdown');
  if (profileDropdown && profileBtn &&
      !profileBtn.contains(e.target) &&
      !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove('open');
  }
});

/* ── Page init ── */
window.addEventListener('DOMContentLoaded', async () => {
  requireUser();

  const name = getStorage('username') || 'User';
  updateNavAvatar(name);
  fillProfileData();

  const welcomeEl = document.getElementById('welcomeText');
  if (welcomeEl) welcomeEl.textContent = `Hello, ${name} 👋 How's your heart today?`;

  // Load mentors
  try {
    allMentors = await apiGetMentors();
    populateSpecialties(allMentors);
    renderMentors(allMentors);
  } catch (err) {
    const container = document.getElementById('mentorList');
    if (container) container.innerHTML =
      '<p style="color:var(--muted);text-align:center;padding:24px;">Could not load mentors. Please try again.</p>';
  }

  // Load notification unread count
  refreshUnreadBadge();
});
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
    const pic    = m.profilePicture;

    // Avatar — image if available, else initials
    const avatarHtml = pic
      ? `<img src="${pic}" alt="${name}" style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:3px solid #E8526A;">`
      : `<div class="mentor-avatar">${letter}</div>`;

    const card = document.createElement('div');
    card.className = 'mentor-card';
    card.innerHTML = `
      <div class="verified-badge">✓ Verified</div>
      ${avatarHtml}
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


/* ══════════════════════════════════════
   LOVE CALCULATOR
   ══════════════════════════════════════ */

/* ── Factor 1: Common Letters (30%) ── */
function commonLettersScore(n1, n2) {
  const set1 = new Set(n1.toLowerCase().replace(/\s/g,''));
  const set2 = new Set(n2.toLowerCase().replace(/\s/g,''));
  let common = 0;
  set1.forEach(c => { if (set2.has(c)) common++; });
  const maxUnique = Math.max(set1.size, set2.size);
  return maxUnique === 0 ? 0 : (common / maxUnique) * 100;
}

/* ── Factor 2: Numerology (30%) ── */
function numerologyValue(name) {
  let sum = 0;
  for (const c of name.toLowerCase().replace(/\s/g,'')) {
    const code = c.charCodeAt(0) - 96;
    if (code >= 1 && code <= 26) sum += code;
  }
  // Reduce to single digit
  while (sum > 9) {
    sum = String(sum).split('').reduce((a, d) => a + parseInt(d), 0);
  }
  return sum;
}
function numerologyScore(n1, n2) {
  const v1   = numerologyValue(n1);
  const v2   = numerologyValue(n2);
  const diff = Math.abs(v1 - v2);
  return (1 - diff / 9) * 100;
}

/* ── Factor 3: Name Length Compatibility (20%) ── */
function lengthScore(n1, n2) {
  const l1   = n1.replace(/\s/g,'').length;
  const l2   = n2.replace(/\s/g,'').length;
  const diff = Math.abs(l1 - l2);
  const maxL = Math.max(l1, l2);
  return maxL === 0 ? 100 : (1 - diff / maxL) * 100;
}

/* ── Factor 4: First Letter Compatibility (20%) ── */
function firstLetterScore(n1, n2) {
  const c1   = n1.trim()[0].toLowerCase().charCodeAt(0) - 97;
  const c2   = n2.trim()[0].toLowerCase().charCodeAt(0) - 97;
  const diff = Math.abs(c1 - c2);
  return (1 - diff / 25) * 100;
}

/* ── Main Calculator ── */
function calculateLove() {
  const name1 = document.getElementById('loveName1').value.trim();
  const name2 = document.getElementById('loveName2').value.trim();

  if (!name1 || !name2) { toast('Please enter both names 💕'); return; }

  // Calculate each factor
  const f1 = commonLettersScore(name1, name2);   // 30%
  const f2 = numerologyScore(name1, name2);       // 30%
  const f3 = lengthScore(name1, name2);           // 20%
  const f4 = firstLetterScore(name1, name2);      // 20%

  // Weighted total
  const score = Math.round((f1 * 0.30) + (f2 * 0.30) + (f3 * 0.20) + (f4 * 0.20));

  // Store breakdown for display
  window._loveBreakdown = {
    commonLetters: Math.round(f1),
    numerology:    Math.round(f2),
    nameLength:    Math.round(f3),
    firstLetter:   Math.round(f4),
    total:         score
  };

  const result = getLoveResult(score);

  // Show result
  document.getElementById('loveResult').style.display = 'block';
  document.getElementById('loveResultNames').textContent = `${name1} ❤️ ${name2}`;
  document.getElementById('lovePercent').textContent     = score + '%';
  document.getElementById('loveMessage').textContent     = result.message;
  document.getElementById('loveEmoji').textContent       = result.emoji;


  // Animate main meter
  const fill = document.getElementById('loveMeterFill');
  fill.style.width = '0%';
  fill.style.background = score >= 80
    ? 'linear-gradient(90deg,#E8526A,#ff4d6d)'
    : score >= 50
    ? 'linear-gradient(90deg,#C9922B,#f4a261)'
    : 'linear-gradient(90deg,#7B5EA7,#a78bca)';
  setTimeout(() => { fill.style.width = score + '%'; }, 100);
}

function getLoveResult(score) {
  if (score >= 90) return {
    message: "Soulmates! You were made for each other! 🥰",
    emoji: "💍👑💞"
  };
  if (score >= 75) return {
    message: "Deep love! This is something truly special! 💖",
    emoji: "💕🔥💕"
  };
  if (score >= 60) return {
    message: "Strong connection! You two have great chemistry! 💫",
    emoji: "😍✨💘"
  };
  if (score >= 45) return {
    message: "Good match! With effort, this can bloom beautifully! 🌸",
    emoji: "🌹😊💛"
  };
  if (score >= 30) return {
    message: "There's potential here! Give it time and care! 🌱",
    emoji: "🤞🌼💚"
  };
  return {
    message: "Opposites attract! Maybe a mentor can help? 😄",
    emoji: "🙈💬🤔"
  };
}

function resetLoveResult() {
  const resultEl = document.getElementById('loveResult');
  if (resultEl) resultEl.style.display = 'none';
}

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
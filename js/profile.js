/* =============================================
   profile.js — Mentor Profile Page
   Depends on: utils.js, api.js
   ============================================= */

let currentMentorId = null;

/* Render mentor data into the page */
function renderProfile(mentor) {
  const name    = mentor.name      || 'Mentor';
  const initial = name.charAt(0).toUpperCase();

  // Avatar
  document.getElementById('mentorAvatar').textContent = initial;

  // Basic info
  document.getElementById('mentorName').textContent      = name;
  document.getElementById('mentorSpecialty').textContent = mentor.specialty || 'Relationship Expert';
  document.getElementById('mentorRating').textContent    = mentor.rating
    ? `${mentor.rating} · Reviews`
    : 'New Mentor';

  // Stats
  document.getElementById('mentorExp').textContent      = mentor.experience  || '—';
  document.getElementById('mentorSessions').textContent = mentor.sessions    || 'New';
  document.getElementById('mentorPrice').textContent    = mentor.price       || '—';

  // Prices on booking tab
  document.getElementById('chatPrice').innerHTML =
    `${mentor.price || '—'}<span style="font-size:12px;color:var(--muted);font-weight:400"> / 30 min</span>`;
  document.getElementById('callPrice').innerHTML =
    `${mentor.price || '—'}<span style="font-size:12px;color:var(--muted);font-weight:400"> / 30 min</span>`;

  // Bio
  document.getElementById('mentorBio').textContent =
    mentor.bio ||
    `${name} is a verified relationship mentor on HeartWise, ready to help you navigate relationship challenges with clarity and compassion.`;

  // Specialty tags
  const tagsEl = document.getElementById('mentorTags');
  const tags   = mentor.tags || [mentor.specialty || 'Relationship Guidance'];
  tagsEl.innerHTML = tags
    .map(t => `<span class="trait good">${t}</span>`)
    .join('');

  // Meta info
  document.getElementById('mentorMeta').innerHTML =
    `🕐 Typically responds within <strong>2 hours</strong> · 🌍 Hindi &amp; English`;

  // Show the profile, hide loading
  document.getElementById('profile-loading').style.display = 'none';
  document.getElementById('profile-content').style.display = 'block';
}

/* Switch profile tabs */
function switchTab(el, tabId) {
  document.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  ['ptab-about', 'ptab-book', 'ptab-reviews'].forEach(id => {
    document.getElementById(id).style.display = id === tabId ? 'block' : 'none';
  });
}

/* Select session type */
function selSession(el) {
  document.querySelectorAll('.session-type').forEach(s => s.classList.remove('sel'));
  el.classList.add('sel');
}

/* Select a time slot */
function selSlot(el) {
  if (el.classList.contains('taken')) return;
  document.querySelectorAll('.slot:not(.taken)').forEach(s => s.classList.remove('sel'));
  el.classList.add('sel');
}

/* Confirm booking */
async function confirmBooking() {
  const sessionEl = document.querySelector('.session-type.sel');
  const slotEl    = document.querySelector('.slot.sel');

  if (!sessionEl) {
    toast('Please select a session type ⚠️');
    return;
  }
  if (!slotEl) {
    toast('Please pick a time slot ⚠️');
    return;
  }

  const type = sessionEl.querySelector('h5').textContent.trim();
  const slot = slotEl.textContent.trim();

  try {
    await apiBookSession(currentMentorId, type, slot);
    toast('Booking request sent! ✅ Awaiting mentor confirmation.');
  } catch (err) {
    toast(err.message || 'Booking failed ❌');
  }
}

/* Page init */
window.addEventListener('DOMContentLoaded', async () => {
  requireUser();

  const name = getStorage('username');
  if (name) updateNavAvatar(name);

  // Read mentor ID from URL: mentorprofile.html?id=3
  const params = new URLSearchParams(window.location.search);
  const id     = params.get('id');

  if (!id) {
    // No ID in URL — show error
    document.getElementById('profile-loading').style.display = 'none';
    document.getElementById('profile-error').style.display   = 'block';
    return;
  }

  currentMentorId = parseInt(id);

  try {
    const mentor = await apiGetMentor(currentMentorId);
    renderProfile(mentor);
  } catch (err) {
    document.getElementById('profile-loading').style.display = 'none';
    document.getElementById('profile-error').style.display   = 'block';
  }
});
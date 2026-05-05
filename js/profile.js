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
  // Avatar — show profile picture if available
  const avatarEl = document.getElementById('mentorAvatar');
  if (mentor.profilePicture) {
    avatarEl.innerHTML = '';
    avatarEl.style.background = 'none';
    avatarEl.style.padding = '0';
    const img = document.createElement('img');
    img.src = mentor.profilePicture;
    img.alt = name;
    img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover;';
    avatarEl.appendChild(img);
  } else {
    avatarEl.textContent = initial;
  }

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

  // Load dynamic slots
  loadMentorSlots(mentor.id);
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
  const slotEl = document.querySelector('.dslot.sel');
  if (!sessionEl) {
    toast('Please select a session type ⚠️');
    return;
  }
  if (!slotEl) {
    toast('Please pick a time slot ⚠️');
    return;
  }

  const type = sessionEl.querySelector('h5').textContent.trim();
 const slot = window.selectedSlotText;
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


/* ══ Load mentor availability slots ══ */
async function loadMentorSlots(mentorId) {
  var BASE = 'https://heartwise-backend-7y6y.onrender.com/api';
  var grid = document.getElementById('dynamicSlotGrid') || document.querySelector('.slot-grid');
  if (!grid) return;

  // Add styles
  if (!document.getElementById('dslot-style')) {
    var s = document.createElement('style');
    s.id  = 'dslot-style';
    s.textContent =
      '.dslot{padding:10px 16px;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;border:1.5px solid;transition:all .2s;text-align:center;}' +
      '.dslot.avail{background:rgba(74,222,128,.1);color:#166534;border-color:rgba(74,222,128,.4);}' +
      '.dslot.avail:hover{background:rgba(74,222,128,.2);}' +
      '.dslot.booked{background:rgba(232,82,106,.1);color:#E8526A;border-color:rgba(232,82,106,.4);cursor:not-allowed;opacity:.8;}' +
      '.dslot.sel{background:linear-gradient(135deg,#7B5EA7,#5A3E85)!important;color:#fff!important;border-color:#7B5EA7!important;box-shadow:0 4px 12px rgba(123,94,167,.4);}';
    document.head.appendChild(s);
  }

  try {
    var res   = await fetch(BASE + '/availability/' + mentorId + '/slots');
    var slots = await res.json();
    var res2  = await fetch(BASE + '/sessions/mentor/' + mentorId);
    var sess  = await res2.json();
    var booked = (sess || [])
      .filter(function(s) { return s.status === 'ACCEPTED' || s.status === 'PENDING'; })
      .map(function(s) { return s.slot || ''; });

    grid.innerHTML = '';

    if (!slots || slots.length === 0) {
      grid.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:8px;">No slots available today. Check back later!</p>';
      return;
    }

    slots.forEach(function(slot) {
      var isBooked = booked.some(function(b) { return b && b.includes(slot.label); });

      // Format: "Today 1:00 PM - 1:30 PM"
      var startFmt  = fmtTime(slot.time);
      var endFmt    = addMins(slot.time, parseInt((slot.duration||'30').toString()));
      var dayPart   = slot.label ? slot.label.split(' ')[0] : 'Today';
      var niceLabel = dayPart + ' ' + startFmt + ' - ' + endFmt;

      var div = document.createElement('div');
      div.className = 'dslot ' + (isBooked ? 'booked' : 'avail');
      div.textContent = (isBooked ? '🔴 ' : '🟢 ') + niceLabel;
      div.dataset.slot = niceLabel;

      if (!isBooked) {
        div.addEventListener('click', function() {
          document.querySelectorAll('.dslot.sel').forEach(function(el) {
            el.classList.remove('sel'); el.classList.add('avail');
          });
          div.classList.remove('avail');
          div.classList.add('sel');
          window.selectedSlotText = niceLabel;
        });
      }
      grid.appendChild(div);
    });
  } catch(e) {
    console.log('Slots error:', e);
    grid.innerHTML = '<p style="color:var(--muted);font-size:13px;padding:8px;">Could not load slots.</p>';
  }
}

function fmtTime(t) {
  if (!t) return '';
  var p = t.split(':'), h = parseInt(p[0]), m = parseInt(p[1]||0);
  var ap = h >= 12 ? 'PM' : 'AM', h12 = h%12===0?12:h%12;
  return h12 + ':' + String(m).padStart(2,'0') + ' ' + ap;
}

function addMins(t, mins) {
  if (!t) return '';
  var p = t.split(':'), total = parseInt(p[0])*60 + parseInt(p[1]||0) + mins;
  var h = Math.floor(total/60), m = total%60;
  var ap = h >= 12 ? 'PM' : 'AM', h12 = h%12===0?12:h%12;
  return h12 + ':' + String(m).padStart(2,'0') + ' ' + ap;
}
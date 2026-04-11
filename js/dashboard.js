/* =============================================
   dashboard.js — Mentor Dashboard
   Depends on: utils.js, api.js
   ============================================= */

let totalRejections = 0;
let allSessions     = [];

/* ── Update metrics row ── */
function updateMetrics(sessions) {
  const total    = sessions.length;
  const pending  = sessions.filter(s => s.status === 'PENDING').length;
  const accepted = sessions.filter(s => s.status === 'ACCEPTED').length;
  totalRejections = sessions.filter(s => s.status === 'DECLINED').length;

  const el = id => document.getElementById(id);
  if (el('metricTotal'))   el('metricTotal').textContent   = total;
  if (el('metricPending')) el('metricPending').textContent = pending;
  if (el('metricAccepted'))el('metricAccepted').textContent= accepted;

  updateRejectionUI();
}

/* ── Update rejection warning bar ── */
function updateRejectionUI() {
  const remaining = 10 - totalRejections;
  const el = id => document.getElementById(id);

  if (el('metricRejLeft')) el('metricRejLeft').textContent = `${remaining}/10`;
  if (el('warnFill'))      el('warnFill').style.width      = (totalRejections / 10 * 100) + '%';
  if (el('warnText'))      el('warnText').textContent      = `Rejection limit: ${totalRejections} of 10 used`;
  if (el('metricRejWarn')) el('metricRejWarn').textContent =
    totalRejections === 0 ? 'No rejections used' : `⚠ ${totalRejections} rejection${totalRejections > 1 ? 's' : ''} used`;
}

/* ── Render pending request cards ── */
function renderRequests(sessions) {
  const section   = document.querySelector('.requests-section');
  const loadingEl = document.getElementById('req-loading');
  if (loadingEl) loadingEl.remove();

  // Remove old dynamic cards
  section.querySelectorAll('.req-card').forEach(c => c.remove());

  const pending      = sessions.filter(s => s.status === 'PENDING');
  const avatarColors = [
    'linear-gradient(135deg,#E8526A,#C03A55)',
    'linear-gradient(135deg,#7B5EA7,#5A3E85)',
    'linear-gradient(135deg,#3D7A6A,#235A4D)',
    'linear-gradient(135deg,#C9922B,#A0701A)',
  ];

  if (pending.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--muted);font-size:14px;padding:20px 0;';
    empty.textContent   = 'No pending session requests right now. 🎉';
    section.appendChild(empty);
    return;
  }

  pending.forEach((s, i) => {
    const cardId = `req-${s.id}`;
    const color  = avatarColors[i % avatarColors.length];
    const letter = (s.userName || 'U').charAt(0).toUpperCase();
    const isCall = (s.sessionType || '').toLowerCase().includes('call');

    const card = document.createElement('div');
    card.className = 'req-card';
    card.id        = cardId;
    card.innerHTML = `
      <div class="req-avatar" style="background:${color};">${letter}</div>
      <div class="req-info">
        <h5>${s.userName || 'User'}</h5>
        <p>${s.sessionType || 'Session request'}</p>
        <span class="slot-tag">📅 ${s.slot || '—'}</span>
      </div>
      <span class="req-type ${isCall ? 'call' : 'chat'}">${isCall ? 'Call' : 'Chat'}</span>
      <div class="req-actions">
        <button class="btn-accept" onclick="acceptReq(${s.id}, '${cardId}', '${s.userName || 'User'}')">Accept</button>
        <button class="btn-reject" onclick="rejectReq(${s.id}, '${cardId}')">Decline</button>
      </div>
    `;
    section.appendChild(card);
  });
}

/* ── Render accepted sessions list ── */
function renderAccepted(sessions) {
  const list = document.getElementById('acceptedList');
  if (!list) return;

  const accepted     = sessions.filter(s => s.status === 'ACCEPTED');
  const avatarColors = [
    'linear-gradient(135deg,#E8526A,#C03A55)',
    'linear-gradient(135deg,#7B5EA7,#5A3E85)',
    'linear-gradient(135deg,#3D7A6A,#235A4D)',
  ];

  if (accepted.length === 0) {
    list.innerHTML = '<div style="color:var(--muted);font-size:14px;padding:12px 0;">No accepted sessions yet.</div>';
    return;
  }

  list.innerHTML = accepted.map((s, i) => `
    <div class="up-item">
      <div class="up-user-av" style="background:${avatarColors[i % avatarColors.length]};">
        ${(s.userName || 'U').charAt(0).toUpperCase()}
      </div>
      <div class="up-info">
        <h6>${s.userName || 'User'}</h6>
        <p>${s.sessionType || 'Session'} · ${s.slot || '—'}</p>
      </div>
      <span style="font-size:12px;color:var(--sage);font-weight:600;">✓ Confirmed</span>
    </div>
  `).join('');
}

/* ── Accept a session ── */
async function acceptReq(sessionId, cardId, name) {
  const el = document.getElementById(cardId);
  if (!el) return;
  const id = parseInt(sessionId);
  try {
    await apiAcceptSession(id);

    el.style.background  = '#EDF5F2';
    el.style.borderColor = '#3D7A6A';
    el.querySelector('.req-actions').innerHTML =
      '<span style="color:var(--sage);font-size:13px;font-weight:600;">✓ Accepted</span>';

    // Update local session status and refresh metrics + accepted list
    const s = allSessions.find(x => parseInt(x.id) === id);
    if (s) s.status = 'ACCEPTED';
    updateMetrics(allSessions);
    renderAccepted(allSessions);

    toast(`${name}'s session confirmed! ✅`);
  } catch (err) {
    toast(err.message || 'Action failed ❌');
  }
}

/* ── Decline a session ── */
async function rejectReq(sessionId, cardId) {
  const el = document.getElementById(cardId);
  if (!el) return;
  const id = parseInt(sessionId);
  try {
    await apiDeclineSession(id);

    el.style.opacity       = '0.5';
    el.style.pointerEvents = 'none';
    el.querySelector('.req-actions').innerHTML =
      '<span style="color:#C0392B;font-size:13px;font-weight:600;">✗ Declined</span>';

    // Update local state
    const s = allSessions.find(x => parseInt(x.id) === id);
    if (s) s.status = 'DECLINED';
    totalRejections++;
    updateRejectionUI();
    updateMetrics(allSessions);

    if (totalRejections >= 10) {
      toast('⛔ Account blocked! 10 rejections reached.');
      const badge = document.querySelector('.status-badge');
      if (badge) {
        badge.textContent      = '⛔ Blocked';
        badge.style.background = '#FDECEA';
        badge.style.color      = '#C0392B';
      }
    } else {
      toast(`Session declined. ${10 - totalRejections} rejection${10 - totalRejections === 1 ? '' : 's'} remaining.`);
    }
  } catch (err) {
    toast(err.message || 'Action failed ❌');
  }
}


/* ── Page init ── */
window.addEventListener('DOMContentLoaded', async () => {
  requireMentor();

  const name = getStorage('username') || 'Mentor';
  updateNavAvatar(name);

  const welcomeEl = document.getElementById('dashWelcome');
  if (welcomeEl) welcomeEl.textContent = `Welcome, ${name} 👋`;

  const dateEl = document.getElementById('dashDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const mentorId = getStorage('userId');
  if (!mentorId) return;

  try {
    allSessions = await apiGetMentorSessions(mentorId);
    updateMetrics(allSessions);
    renderRequests(allSessions);
    renderAccepted(allSessions);
    fillProfileDropdown(allSessions);
  } catch (err) {
    console.error('Failed to load sessions:', err);
    document.getElementById('req-loading').textContent = 'Could not load requests. Is the server running?';
    toast('Could not load session requests ⚠️');
    fillProfileDropdown(null);
  }

});
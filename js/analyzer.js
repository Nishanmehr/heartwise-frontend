/* =============================================
   analyzer.js — Relationship Analyzer Logic
   ============================================= */

/* =============================================
   analyzer.js — Red/Green Flag Analyzer Logic
   Depends on: utils.js, api.js
   ============================================= */

let curQ   = 1;
let score  = 0;
const totalQ = 5;

/* Select an option */
function selectOpt(el, val) {
  el.closest('.ques-card').querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  el.dataset.val = val;
  document.getElementById('analyzer-next').style.display = 'block';
}

/* Move to next question */
function analyzerNext() {
  const card = document.getElementById('q' + curQ);
  const sel  = card.querySelector('.selected');
  if (!sel) return;

  score += parseInt(sel.dataset.val);
  card.style.display = 'none';
  curQ++;

  if (curQ <= totalQ) {
    document.getElementById('q' + curQ).style.display      = 'block';
    document.getElementById('prog-fill').style.width       = (curQ / totalQ * 100) + '%';
    document.getElementById('step-label').textContent      = `Question ${curQ} of ${totalQ}`;
    document.getElementById('analyzer-next').style.display = 'none';
  } else {
    showResult();
  }
}

/* Show result */
function showResult() {
  document.getElementById('analyzer-questions').style.display = 'none';
  document.getElementById('analyzer-result').style.display    = 'block';

  const isGreen = score >= 2;

  document.getElementById('flag-emoji').textContent = isGreen ? '💚' : '🚩';

  const lbl = document.getElementById('flag-label');
  lbl.textContent = isGreen ? 'Green Flag Partner' : 'Red Flag Alert';
  lbl.className   = 'flag-label ' + (isGreen ? 'green' : 'red');

  const bar = document.getElementById('flag-bar');
  const pct = isGreen
      ? Math.min(90, 60 + score * 10)
      : Math.max(10, 40 + score * 10);
  bar.style.background = isGreen ? '#3D7A6A' : '#D63B3B';
  setTimeout(() => { bar.style.width = Math.abs(pct) + '%'; }, 100);

  document.getElementById('flag-traits').innerHTML = isGreen
      ? '<span class="trait good">Respects Boundaries</span><span class="trait good">Emotionally Safe</span><span class="trait good">Supportive</span><span class="trait good">Good Communicator</span>'
      : '<span class="trait bad">Boundary Issues</span><span class="trait bad">Manipulation</span><span class="trait bad">Isolation Tactics</span><span class="trait bad">Emotional Unavailability</span>';

  document.getElementById('flag-suggest').textContent = isGreen
      ? 'Your partner shows healthy relationship behaviors! That said, every relationship has room to grow. A mentor session can help you both reach your full potential together. 💚'
      : "Our analysis suggests some concerning patterns in your partner's behavior. You deserve a relationship where you feel safe and respected. Please consider speaking with one of our verified mentors — you're not alone. 💞";

  // Save result to backend
  apiSaveAnalyzerResult(score, isGreen ? 'GREEN' : 'RED').catch(() => {
    // Non-critical: silently ignore if backend not ready
  });
}

/* Reset analyzer */
function resetAnalyzer() {
  curQ = 1;
  score = 0;

  document.getElementById('analyzer-questions').style.display = 'block';
  document.getElementById('analyzer-result').style.display    = 'none';
  document.getElementById('prog-fill').style.width            = '20%';
  document.getElementById('step-label').textContent           = 'Question 1 of 5';
  document.getElementById('analyzer-next').style.display      = 'none';

  for (let i = 1; i <= totalQ; i++) {
    const c = document.getElementById('q' + i);
    c.style.display = i === 1 ? 'block' : 'none';
    c.querySelectorAll('.option').forEach(o => o.classList.remove('selected'));
  }
}
async function loadMentors() {
  try {
    const mentors = await apiGetMentors();

    const container = document.getElementById("mentorList");
    container.innerHTML = "";

   mentors.forEach(m => {

  const name = m.name || "Mentor";
  const firstLetter = name.charAt(0).toUpperCase();
  const specialty = m.specialty || "Relationship Expert";

  const card = `
    <div class="mentor-card">     give me final working code copy to paste 
      <div class="verified-badge">✓ Verified</div>
      <div class="mentor-avatar">${firstLetter}</div>
      <div class="mentor-name">${name}</div>
      <div class="mentor-spec">${specialty}</div>
      <div class="mentor-price">₹500 <em>/ 30 min</em></div>

      <div class="card-actions">
        <button class="btn-card">Profile</button>
        <button class="btn-card primary">Book Now</button>
      </div>
    </div>
  `;

  container.innerHTML += card;
});

  } catch (err) {
    console.error(err);
  }
}

loadMentors();
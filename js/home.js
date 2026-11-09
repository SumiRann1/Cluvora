async function render_home_grids() {
  const scitech_container = document.getElementById('home-scitech-grid');
  const cultural_container = document.getElementById('home-cultural-grid');
  const welfare_container = document.getElementById('home-welfare-grid');
  if (!scitech_container && !cultural_container && !welfare_container) return;

  try {
    const { all_clubs, all_councils } = await get_CoSA_data();

    const scitech = all_clubs.filter(c => c.parent_council === "Sci-Tech Council");
    const culturals = all_clubs.filter(c => c.parent_council === "Cultural Council" || c.parent_council === "Media and Publication Body");
    const welfare = all_clubs.filter(c => c.parent_council === "Student Welfare and Governance" || c.parent_council === "Sports Council");

    if (scitech_container) scitech_container.innerHTML = render_club_logos(scitech);
    if (cultural_container) cultural_container.innerHTML = render_club_logos(culturals);
    if (welfare_container) welfare_container.innerHTML = render_club_logos(welfare);

    document.getElementById('our-family')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.club-logo-btn');
      if (!btn) return;
      const target = [...all_clubs, ...all_councils].find(c => (c.club_id || c.id) === btn.dataset.id);
      if (target) render_info_card(target);
    });

  } catch (error) {
    console.error("Failed to load home entities:", error);
  }
}

function render_club_logos(items) {
  return items.map(c => `
    <button type="button" class="club-logo-btn" data-id="${c.club_id || c.id}" title="View details: ${escape_html(c.name)}">
      <img src="./..${c.logo_url || '/assets/logos/cosa-crest.svg'}" alt="${escape_html(c.name)} logo" width="64" height="64" loading="lazy">
    </button>
  `).join('');
}

function render_info_card(item) {
  const modal = document.getElementById('club-modal');
  if (!modal) return;

  const logo = `./..${item.logo_url}`;
  const lead = item.leads?.[0] || (item.head_por ? { name: item.head_por } : null);
  const web_url = item.social_links?.website || item.source_url;

  modal.innerHTML = `
    <div class="modal-card-inner">
      <button type="button" class="modal-close-btn" onclick="this.closest('dialog').close()">&times;</button>
      
      <div class="modal-header">
        <img src="${logo}" alt="${escape_html(item.name)} logo" width="72" height="72">
        <div class="modal-title-area">
          <h2>${escape_html(item.name)}</h2>
          ${item.tagline ? `<p class="tagline"><em>${escape_html(item.tagline)}</em></p>` : ''}
          <span class="modal-badge">${escape_html(item.category || item.parent_council || 'Student Body')}</span>
        </div>
      </div>

      <p class="modal-description">${escape_html(item.description || 'No description available.')}</p>

      ${item.achievements?.length ? `
        <div class="modal-section-block">
          <strong>Recent Honour:</strong>
          <p>${escape_html(item.achievements.join(', '))}</p>
        </div>` : ''}

      ${item.flagship_events?.length ? `
        <div class="modal-section-block">
          <strong>Flagship Initiatives:</strong>
          <p>${escape_html(item.flagship_events.join(', '))}</p>
        </div>` : ''}

      ${lead ? `
        <div class="modal-section-block">
          <strong>${lead.email ? 'Student Coordinator' : 'Executive Head'}:</strong>
          <p>${lead.name ? `${escape_html(lead.name)} ` : ''}${lead.email ? `(<a href="mailto:${lead.email}" style="color: var(--color-crimson-light);">${escape_html(lead.email)}</a>)` : ''}</p>
        </div>` : ''}

      ${item.tags?.length ? `
        <ul class="modal-tags">
          ${item.tags.map(t => `<li><small>${escape_html(t)}</small></li>`).join('')}
        </ul>` : ''}

      <div class="modal-actions">
        ${web_url ? `<a href="${web_url}" target="_blank" rel="noopener noreferrer" class="btn-primary">Official Portal &rarr;</a>` : ''}
        ${item.social_links?.github ? `<a href="${item.social_links.github}" target="_blank" rel="noopener noreferrer" class="btn-secondary">GitHub</a>` : ''}
        ${item.social_links?.linkedin ? `<a href="${item.social_links.linkedin}" target="_blank" rel="noopener noreferrer" class="btn-secondary">LinkedIn</a>` : ''}
        ${item.category === "Science & Technology" && item.club_id ? `<a href="./../Tech Clubs/tech_clubs.html#${item.club_id}" class="btn-secondary">Detailed Tech Card &rarr;</a>` : ''}
      </div>
    </div>
  `;

  modal.onclick = (e) => {
    const r = modal.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      modal.close();
    }
  };
  modal.showModal();
}

document.addEventListener('DOMContentLoaded', render_home_grids);

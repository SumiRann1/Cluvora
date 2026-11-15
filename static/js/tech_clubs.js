let tech_clubs = [];

async function render_tech_clubs_page() {
  const container = document.getElementById('tech-teams-list');
  if (!container) return;

  try {
    const { all_clubs } = await get_CoSA_data();

    tech_clubs = all_clubs.filter(club => club.category === "Science & Technology");

    render_cards(tech_clubs);
    search_filter();

    container.addEventListener('click', (e) => {
      const card = e.target.closest('.club-card');
      if (!card) return;
      const clubId = card.dataset.clubId || card.id;
      const club = tech_clubs.find(c => (c.club_id || c.id) === clubId);
      if (club) open_club_modal(club);
    });

    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.club-card');
        if (card) {
          e.preventDefault();
          const clubId = card.dataset.clubId || card.id;
          const club = tech_clubs.find(c => (c.club_id || c.id) === clubId);
          if (club) open_club_modal(club);
        }
      }
    });

  } catch (error) {
    console.error("Failed to load tech clubs data:", error);
    container.innerHTML = `
      <div class="loading-state error-state">
        <p style="color: var(--primary); font-weight: 700;">Failed to fetch club data</p>
        <p style="font-size: 0.9rem; margin-top: 8px;">If testing locally via file://, run a local server: <code>python3 -m http.server 8000</code></p>
      </div>
    `;
  }
}

function render_cards(clubs_2_render) {
  const container = document.getElementById('tech-teams-list');
  if (!container) return;

  if (clubs_2_render.length === 0) {
    container.innerHTML = `
      <div class="loading-state empty-state">
        <h3>No clubs found matching your search.</h3>
        <p>Try searching for keywords like "Python", "Robotics", "CTF", or "Algorithms".</p>
      </div>
    `;
    return;
  }

  container.innerHTML = clubs_2_render.map(club => {
    const rawLogo = club.logo_url || '/assets/logos/iitbh-logo.jpg';
    const logoPath = rawLogo.startsWith('.') ? rawLogo : `./..${rawLogo}`;
    const shortDesc = get_short_info(club);

    return `
      <article class="club-card" id="${escape_html(club.club_id || '')}" data-club-id="${escape_html(club.club_id || '')}" role="button" tabindex="0" aria-label="View details for ${escape_html(club.name)}">
        <header class="club-header">
          <div class="club-logo">
            <img src="${logoPath}" alt="${escape_html(club.name)} Logo" width="64" height="64" style="width: 64px; height: 64px; object-fit: contain;" onerror="this.onerror=null;this.src='/assets/logos/cosa-crest.svg';">
          </div>
          <div>
            <h2 class="club-title">${escape_html(club.name)}</h2>
            ${club.tagline ? `<p class="club-tagline"><em>${escape_html(club.tagline)}</em></p>` : ''}
          </div>
        </header>

        <p class="club-desc">${escape_html(shortDesc)}</p>

        <div class="club-card-hint">
          <span>Click to view details &amp; events &rarr;</span>
        </div>
      </article>
    `;
  }).join('');
}

function search_filter() {
  const main = document.querySelector('main');
  const container = document.getElementById('tech-teams-list');
  if (!main || !container || document.getElementById('club-search-input')) return;

  const searchWrapper = document.createElement('div');
  searchWrapper.id = 'search-filter-wrapper';
  searchWrapper.className = 'search-wrapper wrap';
  searchWrapper.innerHTML = `
    <div>
      <input type="text" id="club-search-input" class="search-input" placeholder="🔍 Search clubs by name, keywords, or domain..." />
    </div>
  `;
  main.insertBefore(searchWrapper, container);

  const searchInput = document.getElementById('club-search-input');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      render_cards(tech_clubs);
      return;
    }

    const filtered = tech_clubs.filter(club => {
      const matchName = (club.name || '').toLowerCase().includes(query);
      const matchDesc = (club.description || '').toLowerCase().includes(query);
      const matchTagline = (club.tagline || '').toLowerCase().includes(query);
      const matchTags = (club.tags || []).some(tag => tag.toLowerCase().includes(query));
      return matchName || matchDesc || matchTagline || matchTags;
    });

    render_cards(filtered);
  });
}

document.addEventListener('DOMContentLoaded', render_tech_clubs_page);

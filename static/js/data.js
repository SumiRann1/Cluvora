let all_clubs = [];
let all_councils = [];
let cosa_data = null;
let data_fetched = null;

async function get_CoSA_data() {
  if (cosa_data) {
    return { all_clubs, all_councils, cosa_data };
  }

  if (!data_fetched) {
    data_fetched = fetch('/iit_bhilai_cosa_data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        cosa_data = data;
        all_clubs = data.clubs || [];
        all_councils = data.councils || [];
        return { all_clubs, all_councils, cosa_data };
      });
  }
  return data_fetched;
}

function escape_html(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function get_short_info(club) {
  if (club.short_description) return club.short_description;
  const desc = club.description || '';
  if (!desc) return '';
  const firstSentence = desc.split(/(?<=[.?!])\s+/)[0];
  return firstSentence.length <= 180 ? firstSentence : (desc.slice(0, 137).trim() + '...');
}

async function open_club_modal(club) {
  let dialog = document.getElementById('club-details-dialog');
  if (!dialog) {
    dialog = document.createElement('dialog');
    dialog.id = 'club-details-dialog';
    dialog.className = 'club-modal-dialog';
    document.body.appendChild(dialog);
  }

  const rawLogo = club.logo_url || '/assets/logos/cosa-crest.svg';
  const logoPath = rawLogo.startsWith('.') ? rawLogo : `./..${rawLogo}`;
  const webUrl = club.social_links?.website || club.source_url;

  const tagsList = club.tags || [club.category || 'Student Body'];
  const tagsHTML = tagsList.map(tag => `<span class="modal-tag-pill">${escape_html(tag)}</span>`).join('');

  const flagshipHTML = (club.flagship_events && club.flagship_events.length > 0)
    ? `<div class="modal-block">
        <h4 class="modal-block-title">Flagship Initiatives</h4>
        <ul class="modal-bullet-list">
          ${club.flagship_events.map(ev => `<li>${escape_html(ev)}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const projectsHTML = (club.key_projects && club.key_projects.length > 0)
    ? `<div class="modal-block">
        <h4 class="modal-block-title">Key Projects &amp; Activities</h4>
        <ul class="modal-bullet-list">
          ${club.key_projects.map(p => `<li>${escape_html(p)}</li>`).join('')}
        </ul>
      </div>`
    : '';

  const leadsHTML = (club.leads && club.leads.length > 0)
    ? `<div class="modal-block">
        <h4 class="modal-block-title">Student Leadership</h4>
        <div class="modal-leads-grid">
          ${club.leads.map(lead => `
            <div class="modal-lead-card">
              <strong>${escape_html(lead.name || '')}</strong>
              ${lead.por_role ? `<span>${escape_html(lead.por_role)}</span>` : ''}
              ${lead.email ? `<a href="mailto:${lead.email}">${escape_html(lead.email)}</a>` : ''}
            </div>
          `).join('')}
        </div>
      </div>`
    : '';

  const links = [];
  if (webUrl) {
    links.push(`<a href="${webUrl}" target="_blank" rel="noopener noreferrer" class="modal-btn modal-btn-primary">Official Portal &rarr;</a>`);
  }
  if (club.social_links?.github) {
    links.push(`<a href="${club.social_links.github}" target="_blank" rel="noopener noreferrer" class="modal-btn modal-btn-secondary">GitHub</a>`);
  }
  if (club.social_links?.linkedin) {
    links.push(`<a href="${club.social_links.linkedin}" target="_blank" rel="noopener noreferrer" class="modal-btn modal-btn-secondary">LinkedIn</a>`);
  }
  if (club.social_links?.instagram) {
    links.push(`<a href="${club.social_links.instagram}" target="_blank" rel="noopener noreferrer" class="modal-btn modal-btn-secondary">Instagram</a>`);
  }
  if (club.leads?.[0]?.email && !webUrl) {
    links.push(`<a href="mailto:${club.leads[0].email}" class="modal-btn modal-btn-primary">Contact Lead</a>`);
  }

  const councilBadge = club.parent_council ? `<span class="modal-badge council-badge">${escape_html(club.parent_council)}</span>` : '';
  const categoryBadge = club.category ? `<span class="modal-badge category-badge">${escape_html(club.category)}</span>` : '';
  const statusBadge = club.status ? `<span class="modal-badge status-badge">${escape_html(club.status)}</span>` : '';

  dialog.innerHTML = `
    <div class="modal-inner">
      <button type="button" class="modal-close-btn" aria-label="Close dialog" onclick="this.closest('dialog').close()">&times;</button>
      
      <div class="modal-header">
        <div class="modal-logo-wrapper">
          <img src="${logoPath}" alt="${escape_html(club.name)} Logo" class="modal-logo" onerror="this.onerror=null;this.src='/assets/logos/cosa-crest.svg';">
        </div>
        <div class="modal-header-info">
          <div class="modal-badges-row">
            ${councilBadge}
            ${categoryBadge}
            ${statusBadge}
          </div>
          <h2 class="modal-title">${escape_html(club.name)}</h2>
          ${club.tagline ? `<p class="modal-tagline"><em>${escape_html(club.tagline)}</em></p>` : ''}
        </div>
      </div>

      <div class="modal-body">
        <div class="modal-block">
          <h4 class="modal-block-title">About the Community</h4>
          <p class="modal-full-desc">${escape_html(club.description || 'No description available.')}</p>
        </div>

        <div class="modal-block">
          <h4 class="modal-block-title">Domains &amp; Focus Areas</h4>
          <div class="modal-tags-wrap">${tagsHTML}</div>
        </div>

        ${flagshipHTML}
        ${projectsHTML}
        ${leadsHTML}

        ${links.length > 0 ? `
          <div class="modal-block">
            <h4 class="modal-block-title">Connect &amp; Socials</h4>
            <div class="modal-actions-row">${links.join('')}</div>
          </div>
        ` : ''}

        <div class="modal-block modal-announcements-block">
          <div class="modal-announcements-head">
            <h4 class="modal-block-title">📢 Upcoming Events &amp; Announcements</h4>
            <a href="/announcements#latest-broadcasts" class="modal-announcements-link">Browse more announcements &rarr;</a>
          </div>
          <div id="modal-announcements-container" class="modal-announcements-container">
            <div class="modal-announcements-loading">
              <span class="loading-spinner" aria-hidden="true"></span>
              <p>Fetching announcements and upcoming events...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  dialog.onclick = (e) => {
    const rect = dialog.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      dialog.close();
    }
  };

  dialog.showModal();

  load_club_announcements(club);
}

async function load_club_announcements(club) {
  const container = document.getElementById('modal-announcements-container');
  if (!container) return;

  try {
    const res = await fetch('/api/announcements?club=' + encodeURIComponent(club.name));
    const data = await res.json();
    let announcements = (data && data.announcements) ? data.announcements : [];

    if (announcements.length === 0) {
      const allRes = await fetch('/api/announcements');
      const allData = await allRes.json();
      if (allData && allData.announcements) {
        announcements = allData.announcements.filter(a => matches_club_announcement(a.club_name, club));
      }
    }

    if (announcements.length === 0) {
      container.innerHTML = `
        <div class="modal-announcements-empty">
          <p>No active announcements or scheduled events for ${escape_html(club.name)} right now.</p>
          <a href="/announcements#latest-broadcasts" class="modal-announcement-cta">Browse more announcements &rarr;</a>
        </div>
      `;
      return;
    }

    const itemsHTML = announcements.map(a => {
      const pinnedBadge = a.is_pinned ? `<span class="announcement-pin-badge">📌 Pinned</span>` : '';
      const categoryBadge = a.category ? `<span class="announcement-cat-badge">${escape_html(a.category)}</span>` : '';
      const dateRow = a.event_date ? `<div class="announcement-event-date">🗓️ <strong>Event Date:</strong> ${escape_html(a.event_date)}</div>` : '';
      const linkBtn = a.link ? `<a href="${a.link}" target="_blank" rel="noopener noreferrer" class="announcement-event-link">Details / Register &rarr;</a>` : '';
      const authorText = a.author_name ? `<span class="announcement-author">Posted by ${escape_html(a.author_name)}</span>` : '';

      return `
        <div class="modal-announcement-item ${a.is_pinned ? 'is-pinned' : ''}">
          <div class="modal-announcement-item-top">
            <div class="modal-announcement-badges">
              ${pinnedBadge}
              ${categoryBadge}
            </div>
            ${authorText}
          </div>
          <h5 class="modal-announcement-title">${escape_html(a.title)}</h5>
          <p class="modal-announcement-content">${escape_html(a.content)}</p>
          ${dateRow}
          ${linkBtn ? `<div class="modal-announcement-foot">${linkBtn}</div>` : ''}
        </div>
      `;
    }).join('');

    const moreBtnHTML = `
      <div class="modal-announcements-more">
        <a href="/announcements#latest-broadcasts" class="modal-announcement-cta">Browse more announcements &rarr;</a>
      </div>
    `;

    container.innerHTML = itemsHTML + moreBtnHTML;

  } catch (err) {
    console.error('Failed to load club announcements:', err);
    container.innerHTML = `
      <div class="modal-announcements-empty">
        <p>Could not load announcements at this time.</p>
      </div>
    `;
  }
}

function matches_club_announcement(announcementClub, club) {
  const normA = (announcementClub || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normName = (club.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normId = (club.club_id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  
  return Boolean(normA && (
    normName.includes(normA) ||
    normA.includes(normName) ||
    normId.includes(normA) ||
    normA.includes(normId)
  ));
}

function init_theme_toggle() {
  const btn = document.getElementById("theme-toggle");
  const label = document.getElementById("theme-label");
  const icon = document.getElementById("theme-icon");
  if (!btn) return;

  function update_theme(theme) {
    const is_dark = theme === "dark";
    document.documentElement.setAttribute("data-theme", theme);
    btn.setAttribute("aria-pressed", is_dark);
    btn.setAttribute("aria-label", is_dark ? "Switch to light theme" : "Switch to dark theme");
    if (label) label.textContent = is_dark ? "Light mode" : "Dark mode";
    if (icon) icon.textContent = is_dark ? "☼" : "◐";
  }

  update_theme(document.documentElement.getAttribute("data-theme") || "light");

  btn.addEventListener("click", () => {
    const next_theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next_theme); } catch (e) { }
    update_theme(next_theme);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init_theme_toggle);
  } else {
    init_theme_toggle();
  }
}

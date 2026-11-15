let all_announcements = [];
let current_category = 'all';
let search_query = '';

function format_time_ago(date_str) {
  if (!date_str) return '';
  const date = new Date(date_str.endsWith('Z') ? date_str : date_str + 'Z');
  const now = new Date();
  const diff_sec = Math.floor((now - date) / 1000);

  if (isNaN(diff_sec) || diff_sec < 0) return 'Just now';
  if (diff_sec < 60) return 'Just now';
  if (diff_sec < 3600) return `${Math.floor(diff_sec / 60)}m ago`;
  if (diff_sec < 86400) return `${Math.floor(diff_sec / 3600)}h ago`;
  if (diff_sec < 604800) return `${Math.floor(diff_sec / 86400)}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function show_toast(message, type = 'success') {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast-msg show ${type}`;

  setTimeout(() => {
    toast.className = 'toast-msg';
  }, 3500);
}

async function load_announcements() {
  const container = document.getElementById('announcements-feed');
  if (!container) return;

  try {
    const res = await fetch('/announcements', {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const data = await res.json();
    all_announcements = data.announcements || [];

    update_stats();
    render_announcements();
    if (window.location.hash === '#latest-broadcasts') {
      const target = document.getElementById('latest-broadcasts');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  } catch (err) {
    console.error('Error fetching announcements:', err);
    container.innerHTML = `
      <div class="empty-feed">
        <h3>Could not load announcements</h3>
        <p>There was an error connecting to the server database. Please ensure the Flask backend is running.</p>
        <button class="btn-secondary" onclick="load_announcements()">Try Again</button>
      </div>
    `;
  }
}

function update_stats() {
  const count_el = document.getElementById('stat-total-count');
  const clubs_count_el = document.getElementById('stat-clubs-count');
  const feed_count_el = document.getElementById('feed-count-display');

  const total = all_announcements.length;
  const unique_clubs = new Set(all_announcements.map(a => a.club_name.toLowerCase().trim())).size;

  if (count_el) count_el.textContent = total;
  if (clubs_count_el) clubs_count_el.textContent = unique_clubs;
  if (feed_count_el) feed_count_el.textContent = `${total} announcement${total === 1 ? '' : 's'}`;
}

function render_announcements() {
  const container = document.getElementById('announcements-feed');
  if (!container) return;

  let filtered = all_announcements;

  if (current_category !== 'all') {
    filtered = filtered.filter(a => (a.category || '').toLowerCase() === current_category.toLowerCase());
  }

  if (search_query) {
    const q = search_query.toLowerCase().trim();
    filtered = filtered.filter(a =>
      (a.title || '').toLowerCase().includes(q) ||
      (a.content || '').toLowerCase().includes(q) ||
      (a.club_name || '').toLowerCase().includes(q) ||
      (a.category || '').toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-feed">
        <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">📢</span>
        <h3>No announcements found</h3>
        <p>${search_query || current_category !== 'all'
          ? 'No announcements match your search or filter criteria. Try clearing your filters or search terms.'
          : 'No announcements have been posted yet. Be the first club to share an update!'}</p>
        <button class="post-btn-cta" onclick="open_post_modal()">+ Post New Announcement</button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => {
    const is_pinned = Boolean(item.is_pinned);
    const cat_class = escape_html(item.category || 'General');
    const avatar_letter = (item.club_name || 'C').charAt(0).toUpperCase();

    const link_html = item.link
      ? `<a href="${escape_html(item.link)}" target="_blank" rel="noopener noreferrer" class="card-link-btn">
           Learn More / Register <span>↗</span>
         </a>`
      : '';

    const date_html = item.event_date
      ? `<span class="detail-pill">📅 <strong>Event / Deadline:</strong> ${escape_html(item.event_date)}</span>`
      : '';

    const author_html = item.author_name
      ? `<span class="detail-pill">👤 <strong>By:</strong> ${escape_html(item.author_name)}</span>`
      : '';

    return `
      <article class="announcement-card ${is_pinned ? 'is-pinned' : ''}" data-id="${item.id}">
        <div class="card-top">
          <div class="club-meta">
            <div class="club-avatar">${avatar_letter}</div>
            <div class="club-title-group">
              <span class="club-name">${escape_html(item.club_name)}</span>
              <span class="post-time">${format_time_ago(item.created_at)}</span>
            </div>
          </div>

          <div class="badges-group">
            ${is_pinned ? `<span class="pinned-badge">📌 Pinned</span>` : ''}
            <span class="cat-badge ${cat_class}">${escape_html(item.category || 'General')}</span>
          </div>
        </div>

        <h3 class="announcement-title">${escape_html(item.title)}</h3>
        <p class="announcement-desc">${escape_html(item.content)}</p>

        ${(date_html || author_html) ? `<div class="card-details-pills">${date_html}${author_html}</div>` : ''}

        <div class="card-footer">
          ${link_html}
          <div class="card-actions-right">
            <button class="delete-card-btn" title="Delete announcement" onclick="handle_delete_announcement(${item.id})">
              🗑️
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function open_post_modal() {
  const modal = document.getElementById('announcement-modal');
  const feedback = document.getElementById('form-feedback');
  if (feedback) feedback.style.display = 'none';
  if (window.reset_coordinator_auth) {
    window.reset_coordinator_auth();
  }
  if (modal) {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    const first_input = document.getElementById('club-select');
    if (first_input) first_input.focus();
  }
}

function close_post_modal() {
  const modal = document.getElementById('announcement-modal');
  if (modal) {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  }
}

async function handle_announcement_submit(e) {
  e.preventDefault();
  const form = document.getElementById('post-announcement-form');
  const submit_btn = document.getElementById('submit-announcement-btn');
  const feedback = document.getElementById('form-feedback');

  const club_select = document.getElementById('club-select') ? document.getElementById('club-select').value : '';
  const custom_club = document.getElementById('custom-club') ? document.getElementById('custom-club').value.trim() : '';
  const verified_badge = document.getElementById('verified-club-display') ? document.getElementById('verified-club-display').textContent.trim() : '';
  const club_name = (club_select === 'custom' ? custom_club : club_select) || custom_club || (verified_badge && verified_badge !== 'Club Name' ? verified_badge : '');
  const passcode = document.getElementById('verified-passcode-hidden') ? document.getElementById('verified-passcode-hidden').value : '';

  const title = document.getElementById('announcement-title-input').value.trim();
  const category = document.getElementById('announcement-category-select').value;
  const content = document.getElementById('announcement-content-input').value.trim();
  const event_date = document.getElementById('announcement-date-input').value.trim();
  const link = document.getElementById('announcement-link-input').value.trim();
  const author_role = document.getElementById('announcement-author-role') ? document.getElementById('announcement-author-role').value : '';
  const author_name_input = document.getElementById('announcement-author-input') ? document.getElementById('announcement-author-input').value.trim() : '';
  const is_pinned = document.getElementById('announcement-pinned-check').checked ? 1 : 0;

  if (!club_name || !title || !content || !author_role || !author_name_input) {
    feedback.textContent = 'Please fill out all required fields (Club name, Title, Details, Role, and Name).';
    feedback.className = 'form-feedback error';
    feedback.style.display = 'block';
    return;
  }

  const author_name = `${author_name_input} (${author_role})`;

  submit_btn.disabled = true;
  submit_btn.textContent = 'Publishing...';
  feedback.style.display = 'none';

  try {
    const resp = await fetch('/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        club_name: club_name,
        title: title,
        category: category,
        content: content,
        event_date: event_date,
        link: link,
        author_name: author_name,
        is_pinned: is_pinned,
        passcode: passcode
      })
    });

    const result = await resp.json();

    if (!resp.ok || !result.success) {
      throw new Error(result.error || 'Failed to post announcement.');
    }

    form.reset();
    if (window.reset_coordinator_auth) {
      window.reset_coordinator_auth();
    }
    close_post_modal();
    show_toast('🎉 Announcement published successfully!', 'success');
    await load_announcements();

  } catch (err) {
    console.error('Submission error:', err);
    feedback.textContent = err.message || 'Error creating announcement. Please try again.';
    feedback.className = 'form-feedback error';
    feedback.style.display = 'block';
  } finally {
    submit_btn.disabled = false;
    submit_btn.textContent = 'Publish Announcement';
  }
}

async function handle_delete_announcement(id) {
  if (!confirm('Are you sure you want to remove this announcement?')) return;

  try {
    const resp = await fetch(`/announcements/${id}`, {
      method: 'DELETE'
    });
    const result = await resp.json();
    if (!resp.ok || !result.success) {
      throw new Error(result.error || 'Failed to delete announcement.');
    }

    show_toast('Announcement removed.', 'success');
    await load_announcements();
  } catch (err) {
    console.error('Delete error:', err);
    show_toast('Failed to delete announcement.', 'error');
  }
}

window.open_post_modal = open_post_modal;
window.close_post_modal = close_post_modal;
window.handle_delete_announcement = handle_delete_announcement;
window.load_announcements = load_announcements;

document.addEventListener('DOMContentLoaded', () => {
  load_announcements();

  const search_input = document.getElementById('announcements-search');
  if (search_input) {
    search_input.addEventListener('input', (e) => {
      search_query = e.target.value;
      render_announcements();
    });
  }

  const pills = document.querySelectorAll('.category-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      current_category = pill.getAttribute('data-category') || 'all';
      render_announcements();
    });
  });

  const open_btns = document.querySelectorAll('[data-open-modal]');
  open_btns.forEach(btn => btn.addEventListener('click', open_post_modal));

  const close_btns = document.querySelectorAll('[data-close-modal]');
  close_btns.forEach(btn => btn.addEventListener('click', close_post_modal));

  const modal = document.getElementById('announcement-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close_post_modal();
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      close_post_modal();
    }
  });

  const form = document.getElementById('post-announcement-form');
  if (form) {
    form.addEventListener('submit', handle_announcement_submit);
  }

  const club_select = document.getElementById('club-select');
  const custom_club_wrap = document.getElementById('custom-club-wrap');
  if (club_select && custom_club_wrap) {
    club_select.addEventListener('change', () => {
      if (club_select.value === 'custom') {
        custom_club_wrap.style.display = 'block';
        document.getElementById('custom-club').focus();
      } else {
        custom_club_wrap.style.display = 'none';
        document.getElementById('custom-club').value = '';
      }
    });
  }
});

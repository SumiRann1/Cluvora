// Societies and Campus Life Bodies: Client-side Search and Expand/Collapse for Python pre-rendered cards

document.addEventListener('DOMContentLoaded', () => {
  init_search();
  init_expand_handlers();
});

function init_search() {
  const searchInput = document.getElementById('club-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.club-grid .club-card');

    cards.forEach(card => {
      if (!query) {
        card.style.display = '';
        return;
      }
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(query) ? '' : 'none';
    });
  });
}

function init_expand_handlers() {
  const container = document.getElementById('soc-teams-list');
  if (!container) return;

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('.club-expand-btn');
    if (!btn) return;

    const card = btn.closest('.club-card');
    if (!card) return;

    const wrapper = card.querySelector('.club-details-wrapper');
    const url = btn.dataset.url;

    if (wrapper && !wrapper.querySelector('.club-details-content')) {
      const textSpan = btn.querySelector('.expand-btn-text');
      if (textSpan) textSpan.textContent = 'Loading...';

      if (url) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const html = await res.text();
            wrapper.innerHTML = html;
          }
        } catch (err) {
          console.error('Failed to load society details:', err);
        }
      }
    }

    const isExpanded = card.classList.toggle('is-expanded');
    btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    const textSpan = btn.querySelector('.expand-btn-text');
    const arrowSpan = btn.querySelector('.expand-arrow');
    if (textSpan) textSpan.textContent = isExpanded ? 'Show less' : 'View full details';
    if (arrowSpan) arrowSpan.innerHTML = isExpanded ? '&uarr;' : '&darr;';
  });
}

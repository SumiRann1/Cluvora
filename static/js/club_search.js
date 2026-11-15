// Progressive Enhancement: Lightweight text search for pre-rendered club cards
document.addEventListener('DOMContentLoaded', () => {
  const search_input = document.getElementById('club-search-input');
  if (!search_input) return;

  search_input.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cards = document.querySelectorAll('.club-grid .club-card');

    cards.forEach((card) => {
      if (!query) {
        card.style.display = '';
        return;
      }
      const is_match = card.textContent.toLowerCase().includes(query);
      card.style.display = is_match ? '' : 'none';
    });
  });
});

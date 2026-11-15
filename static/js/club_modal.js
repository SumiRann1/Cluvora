// Club Profile Dialog & Deep Linking Controller
document.addEventListener('DOMContentLoaded', () => {
  init_card_triggers();
  init_dialog_close_handlers();
  init_share_buttons();
  check_hash_deep_link();
  window.addEventListener('hashchange', check_hash_deep_link);
});

function open_club_modal(dialog_id) {
  const dialog = document.getElementById(dialog_id);
  if (!dialog || typeof dialog.showModal !== 'function') return;

  dialog.showModal();
  const club_id = dialog_id.replace(/^modal-/, '');
  history.replaceState(null, null, '#' + club_id);
}

function close_club_modal(dialog) {
  if (!dialog) return;
  dialog.close();
  // Clear hash without reloading
  history.replaceState(null, null, window.location.pathname + window.location.search);
}

function init_card_triggers() {
  document.addEventListener('click', (e) => {
    // If click originated from a link or element marked data-no-modal, let it navigate normally
    if (e.target.closest('[data-no-modal="true"]') || e.target.closest('a')) {
      return;
    }

    const card = e.target.closest('.club-card');
    if (card && card.dataset.modalTarget) {
      open_club_modal(card.dataset.modalTarget);
    }
  });

  // Keyboard accessibility: Enter or Space triggers card modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = document.activeElement && document.activeElement.closest('.club-card');
      if (card && card.dataset.modalTarget && !document.activeElement.closest('[data-no-modal="true"]')) {
        e.preventDefault();
        open_club_modal(card.dataset.modalTarget);
      }
    }
  });
}

function init_dialog_close_handlers() {
  // Close buttons inside dialog
  document.addEventListener('click', (e) => {
    const close_btn = e.target.closest('.dialog-close-btn, .dialog-footer-close');
    if (close_btn) {
      const dialog = close_btn.closest('dialog');
      close_club_modal(dialog);
      return;
    }

    // Clicking on backdrop (outside the inner wrap) closes the dialog
    if (e.target.tagName === 'DIALOG' && e.target.classList.contains('club-profile-dialog')) {
      close_club_modal(e.target);
    }
  });

  // Listen to native cancel/close on dialogs (e.g. Escape key)
  document.querySelectorAll('.club-profile-dialog').forEach((dialog) => {
    dialog.addEventListener('close', () => {
      history.replaceState(null, null, window.location.pathname + window.location.search);
    });
  });
}

function init_share_buttons() {
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.dialog-share-btn');
    if (!btn) return;

    const club_id = btn.dataset.shareId;
    if (!club_id) return;

    const share_url = window.location.origin + window.location.pathname + '#' + club_id;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(share_url);
        const orig_label = btn.innerHTML;
        btn.innerHTML = '<span>✓</span> Copied!';
        setTimeout(() => {
          btn.innerHTML = orig_label;
        }, 2000);
      } else {
        prompt('Copy this link:', share_url);
      }
    } catch (err) {
      prompt('Copy this link:', share_url);
    }
  });
}

function check_hash_deep_link() {
  const hash = window.location.hash.replace(/^#/, '').trim();
  if (!hash) return;

  const target_dialog = document.getElementById('modal-' + hash);
  if (target_dialog && typeof target_dialog.showModal === 'function' && !target_dialog.open) {
    target_dialog.showModal();
  }
}

window.open_club_modal = open_club_modal;
window.close_club_modal = close_club_modal;

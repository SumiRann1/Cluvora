let verified_club = '';
let verified_passcode = '';

function init_coordinator_auth() {
  const club_select = document.getElementById('club-select');
  const custom_club_wrap = document.getElementById('custom-club-wrap');
  const custom_club_input = document.getElementById('custom-club');
  const passcode_wrap = document.getElementById('passcode-field-wrap');
  const passcode_input = document.getElementById('coordinator-passcode');
  const toggle_passcode_btn = document.getElementById('toggle-passcode-btn');
  const verify_btn = document.getElementById('verify-passcode-btn');
  const auth_feedback = document.getElementById('auth-feedback');
  const auth_step = document.getElementById('coordinator-auth-step');
  const post_form = document.getElementById('post-announcement-form');
  const verified_display = document.getElementById('verified-club-display');
  const change_club_btn = document.getElementById('change-club-btn');
  const hidden_passcode = document.getElementById('verified-passcode-hidden');

  if (!club_select || !auth_step || !post_form) return;

  function reset_auth_modal() {
    verified_club = '';
    verified_passcode = '';
    if (hidden_passcode) hidden_passcode.value = '';
    if (passcode_input) passcode_input.value = '';
    if (auth_feedback) {
      auth_feedback.style.display = 'none';
      auth_feedback.textContent = '';
      auth_feedback.className = 'form-feedback';
    }
    if (passcode_wrap) passcode_wrap.style.display = 'none';
    if (custom_club_wrap) custom_club_wrap.style.display = 'none';
    auth_step.style.display = 'flex';
    post_form.style.display = 'none';
    if (club_select) club_select.value = '';
    if (custom_club_input) custom_club_input.value = '';
  }

  window.reset_coordinator_auth = reset_auth_modal;

  const open_btns = document.querySelectorAll('[data-open-modal]');
  open_btns.forEach(btn => btn.addEventListener('click', () => {
    reset_auth_modal();
  }));

  club_select.addEventListener('change', () => {
    const val = club_select.value;
    if (val === 'custom') {
      if (custom_club_wrap) {
        custom_club_wrap.style.display = 'block';
        if (custom_club_input) custom_club_input.focus();
      }
      if (passcode_wrap) passcode_wrap.style.display = 'block';
    } else if (val) {
      if (custom_club_wrap) custom_club_wrap.style.display = 'none';
      if (passcode_wrap) {
        passcode_wrap.style.display = 'block';
        if (passcode_input) passcode_input.focus();
      }
    } else {
      if (passcode_wrap) passcode_wrap.style.display = 'none';
    }
    if (auth_feedback) auth_feedback.style.display = 'none';
  });

  if (custom_club_input) {
    custom_club_input.addEventListener('input', () => {
      if (custom_club_input.value.trim() && passcode_wrap) {
        passcode_wrap.style.display = 'block';
      }
    });
  }

  if (toggle_passcode_btn && passcode_input) {
    toggle_passcode_btn.addEventListener('click', () => {
      const is_pwd = passcode_input.type === 'password';
      passcode_input.type = is_pwd ? 'text' : 'password';
      toggle_passcode_btn.textContent = is_pwd ? 'Hide' : 'Show';
    });
  }

  async function perform_verification() {
    const custom_val = custom_club_input ? custom_club_input.value.trim() : '';
    const selected_val = club_select.value;
    const target_club = (selected_val === 'custom' ? custom_val : selected_val) || custom_val;
    const passcode = passcode_input ? passcode_input.value.trim() : '';

    if (!target_club) {
      show_feedback('Please select or specify a club or society.', 'error');
      return;
    }

    if (!passcode) {
      show_feedback('Please enter the coordinator passcode.', 'error');
      if (passcode_input) passcode_input.focus();
      return;
    }

    if (verify_btn) {
      verify_btn.disabled = true;
      verify_btn.textContent = 'Verifying...';
    }

    try {
      const resp = await fetch('/verify-coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_name: target_club,
          passcode: passcode
        })
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        show_feedback(data.error || 'Incorrect passcode. Please try again.', 'error');
        if (verify_btn) {
          verify_btn.disabled = false;
          verify_btn.textContent = 'Verify Passcode →';
        }
        return;
      }

      verified_club = target_club;
      verified_passcode = passcode;
      if (hidden_passcode) hidden_passcode.value = passcode;

      show_feedback('Passcode verified successfully!', 'success');

      setTimeout(() => {
        auth_step.style.display = 'none';
        post_form.style.display = 'flex';
        if (verified_display) verified_display.textContent = verified_club;
        if (data.category) {
          const cat_select = document.getElementById('announcement-category-select');
          if (cat_select) {
            const has_opt = Array.from(cat_select.options).some(o => o.value === data.category);
            if (has_opt) cat_select.value = data.category;
          }
        }
        const title_input = document.getElementById('announcement-title-input');
        if (title_input) title_input.focus();
      }, 400);

    } catch (err) {
      show_feedback('Failed to connect to verification service.', 'error');
    } finally {
      if (verify_btn) {
        verify_btn.disabled = false;
        verify_btn.textContent = 'Verify Passcode →';
      }
    }
  }

  function show_feedback(msg, type) {
    if (!auth_feedback) return;
    auth_feedback.textContent = msg;
    auth_feedback.className = 'form-feedback ' + type;
    auth_feedback.style.display = 'block';
  }

  if (verify_btn) {
    verify_btn.addEventListener('click', perform_verification);
  }

  if (passcode_input) {
    passcode_input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        perform_verification();
      }
    });
  }

  if (change_club_btn) {
    change_club_btn.addEventListener('click', () => {
      verified_club = '';
      verified_passcode = '';
      if (hidden_passcode) hidden_passcode.value = '';
      auth_step.style.display = 'flex';
      post_form.style.display = 'none';
      if (passcode_input) {
        passcode_input.value = '';
        passcode_input.focus();
      }
      if (auth_feedback) auth_feedback.style.display = 'none';
    });
  }
}

document.addEventListener('DOMContentLoaded', init_coordinator_auth);

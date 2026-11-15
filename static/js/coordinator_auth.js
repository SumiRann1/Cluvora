let verifiedClub = '';
let verifiedPasscode = '';

function initCoordinatorAuth() {
  const clubSelect = document.getElementById('club-select');
  const customClubWrap = document.getElementById('custom-club-wrap');
  const customClubInput = document.getElementById('custom-club');
  const passcodeWrap = document.getElementById('passcode-field-wrap');
  const passcodeInput = document.getElementById('coordinator-passcode');
  const togglePasscodeBtn = document.getElementById('toggle-passcode-btn');
  const verifyBtn = document.getElementById('verify-passcode-btn');
  const authFeedback = document.getElementById('auth-feedback');
  const authStep = document.getElementById('coordinator-auth-step');
  const postForm = document.getElementById('post-announcement-form');
  const verifiedDisplay = document.getElementById('verified-club-display');
  const changeClubBtn = document.getElementById('change-club-btn');
  const hiddenPasscode = document.getElementById('verified-passcode-hidden');

  if (!clubSelect || !authStep || !postForm) return;

  function resetAuthModal() {
    verifiedClub = '';
    verifiedPasscode = '';
    if (hiddenPasscode) hiddenPasscode.value = '';
    if (passcodeInput) passcodeInput.value = '';
    if (authFeedback) {
      authFeedback.style.display = 'none';
      authFeedback.textContent = '';
      authFeedback.className = 'form-feedback';
    }
    if (passcodeWrap) passcodeWrap.style.display = 'none';
    if (customClubWrap) customClubWrap.style.display = 'none';
    authStep.style.display = 'flex';
    postForm.style.display = 'none';
    if (clubSelect) clubSelect.value = '';
    if (customClubInput) customClubInput.value = '';
  }

  window.resetCoordinatorAuth = resetAuthModal;

  const openBtns = document.querySelectorAll('[data-open-modal]');
  openBtns.forEach(btn => btn.addEventListener('click', () => {
    resetAuthModal();
  }));

  clubSelect.addEventListener('change', () => {
    const val = clubSelect.value;
    if (val === 'custom') {
      if (customClubWrap) {
        customClubWrap.style.display = 'block';
        if (customClubInput) customClubInput.focus();
      }
      if (passcodeWrap) passcodeWrap.style.display = 'block';
    } else if (val) {
      if (customClubWrap) customClubWrap.style.display = 'none';
      if (passcodeWrap) {
        passcodeWrap.style.display = 'block';
        if (passcodeInput) passcodeInput.focus();
      }
    } else {
      if (passcodeWrap) passcodeWrap.style.display = 'none';
    }
    if (authFeedback) authFeedback.style.display = 'none';
  });

  if (customClubInput) {
    customClubInput.addEventListener('input', () => {
      if (customClubInput.value.trim() && passcodeWrap) {
        passcodeWrap.style.display = 'block';
      }
    });
  }

  if (togglePasscodeBtn && passcodeInput) {
    togglePasscodeBtn.addEventListener('click', () => {
      const isPwd = passcodeInput.type === 'password';
      passcodeInput.type = isPwd ? 'text' : 'password';
      togglePasscodeBtn.textContent = isPwd ? 'Hide' : 'Show';
    });
  }

  async function performVerification() {
    const customVal = customClubInput ? customClubInput.value.trim() : '';
    const selectedVal = clubSelect.value;
    const targetClub = (selectedVal === 'custom' ? customVal : selectedVal) || customVal;
    const passcode = passcodeInput ? passcodeInput.value.trim() : '';

    if (!targetClub) {
      showFeedback('Please select or specify a club or society.', 'error');
      return;
    }

    if (!passcode) {
      showFeedback('Please enter the coordinator passcode.', 'error');
      if (passcodeInput) passcodeInput.focus();
      return;
    }

    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Verifying...';
    }

    try {
      const res = await fetch('/verify-coordinator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          club_name: targetClub,
          passcode: passcode
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        showFeedback(data.error || 'Incorrect passcode. Please try again.', 'error');
        if (verifyBtn) {
          verifyBtn.disabled = false;
          verifyBtn.textContent = 'Verify Passcode →';
        }
        return;
      }

      verifiedClub = targetClub;
      verifiedPasscode = passcode;
      if (hiddenPasscode) hiddenPasscode.value = passcode;

      showFeedback('Passcode verified successfully!', 'success');

      setTimeout(() => {
        authStep.style.display = 'none';
        postForm.style.display = 'flex';
        if (verifiedDisplay) verifiedDisplay.textContent = verifiedClub;
        if (data.category) {
          const catSelect = document.getElementById('announcement-category-select');
          if (catSelect) {
            const hasOption = Array.from(catSelect.options).some(o => o.value === data.category);
            if (hasOption) catSelect.value = data.category;
          }
        }
        const titleInput = document.getElementById('announcement-title-input');
        if (titleInput) titleInput.focus();
      }, 400);

    } catch (err) {
      showFeedback('Failed to connect to verification service.', 'error');
    } finally {
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verify Passcode →';
      }
    }
  }

  function showFeedback(msg, type) {
    if (!authFeedback) return;
    authFeedback.textContent = msg;
    authFeedback.className = 'form-feedback ' + type;
    authFeedback.style.display = 'block';
  }

  if (verifyBtn) {
    verifyBtn.addEventListener('click', performVerification);
  }

  if (passcodeInput) {
    passcodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performVerification();
      }
    });
  }

  if (changeClubBtn) {
    changeClubBtn.addEventListener('click', () => {
      verifiedClub = '';
      verifiedPasscode = '';
      if (hiddenPasscode) hiddenPasscode.value = '';
      authStep.style.display = 'flex';
      postForm.style.display = 'none';
      if (passcodeInput) {
        passcodeInput.value = '';
        passcodeInput.focus();
      }
      if (authFeedback) authFeedback.style.display = 'none';
    });
  }
}

document.addEventListener('DOMContentLoaded', initCoordinatorAuth);

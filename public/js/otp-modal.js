/* =========================================================
   DIGITAL KAAM 2.0 — 3D MANDATORY OTP VERIFICATION ENGINE
   ========================================================= */

const OTPManager = {
  activeSession: null,
  timerInterval: null,
  isVerifying: false,

  async requestAndOpen({ phone, purpose = 'registration', onVerified }) {
    if (!AntiGarbageValidator.isValidPhone(phone)) {
      toast('Kripya valid 10-digit mobile number daalein.', 'err');
      return;
    }

    try {
      this.closeModal();
      const res = await apiFetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, purpose })
      });

      this.activeSession = {
        phone,
        purpose,
        token: res.sessionToken,
        onVerified
      };

      this.renderModal(res.testOtp || res.simulated_otp);
      toast(res.message || 'OTP successfully sent!', 'ok');
    } catch (e) {
      toast(e.message, 'err');
    }
  },

  renderModal(testOtp = null) {
    this.closeModal();

    const backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop-3d';
    backdrop.id = 'otpModalBackdrop';
    backdrop.style.zIndex = '10005';

    const testOtpBadge = testOtp 
      ? `<div style="background:rgba(245,158,11,0.15); border:1px dashed #fbbf24; color:#fbbf24; padding:8px 12px; border-radius:10px; font-size:13px; margin:10px 0; text-align:center; cursor:pointer;" onclick="OTPManager.fillOtp('${testOtp}')" title="Click to Auto Fill">
           🔑 Demo OTP: <b style="letter-spacing:2px; font-size:15px; color:#fff;">${testOtp}</b> <span style="font-size:11px; opacity:0.8; display:block; margin-top:2px;">(Click karke instant fill karein)</span>
         </div>`
      : '';

    backdrop.innerHTML = `
      <div class="sheet-3d" style="max-width: 420px; text-align:center; padding: 24px;">
        <div class="sheet-handle"></div>
        <div style="font-size:38px; margin-bottom:6px;">📲</div>
        <h3 style="font-size:19px; font-weight:800; color:#fff; margin:0 0 6px;">Mobile Number Verify Karein</h3>
        <p style="font-size:13px; color:var(--text-sub); margin:0 0 10px;">
          Hamne <b>+91 ${esc(this.activeSession.phone)}</b> par 4-digit OTP bheja hai.
        </p>
        
        ${testOtpBadge}

        <div class="otp-container" style="display:flex; justify-content:center; gap:10px; margin:14px 0;">
          <input type="text" maxlength="1" class="otp-box" id="otp-1" inputmode="numeric" autofocus autocomplete="one-time-code">
          <input type="text" maxlength="1" class="otp-box" id="otp-2" inputmode="numeric">
          <input type="text" maxlength="1" class="otp-box" id="otp-3" inputmode="numeric">
          <input type="text" maxlength="1" class="otp-box" id="otp-4" inputmode="numeric">
        </div>

        <button class="btn-3d" id="otpVerifyBtn" style="margin-top:10px; width:100%;">
          🛡️ OTP Verify Karein
        </button>

        <div style="margin-top:14px; font-size:13px; color:var(--text-muted);">
          <span id="otpTimer">Resend OTP in <b id="countdown">30</b>s</span>
          <button id="resendOtpBtn" style="display:none; background:none; border:none; color:var(--primary-light); font-weight:700; cursor:pointer; text-decoration:underline;">
            🔄 OTP Dobara Bhejein
          </button>
        </div>

        <button id="otpCancelBtn" style="margin-top:12px; background:none; border:none; color:rgba(255,255,255,0.5); font-size:12.5px; cursor:pointer;">
          ✕ Cancel
        </button>
      </div>
    `;

    document.body.appendChild(backdrop);
    this.setupOtpInputs();
    this.startCountdown(30);

    // If testOtp provided, fill in inputs nicely after a slight delay
    if (testOtp && String(testOtp).length === 4) {
      setTimeout(() => {
        this.fillOtp(String(testOtp));
      }, 500);
    }

    $('otpVerifyBtn').onclick = () => this.verifyOtp();
    $('otpCancelBtn').onclick = () => this.closeModal();
    $('resendOtpBtn').onclick = () => this.resendOtp();
  },

  fillOtp(code) {
    if (!code) return;
    const chars = String(code).slice(0, 4).split('');
    chars.forEach((c, idx) => {
      const el = $(`otp-${idx + 1}`);
      if (el) {
        el.value = c;
        el.style.borderColor = '#10b981';
        el.style.backgroundColor = 'rgba(16,185,129,0.15)';
      }
    });
    const lastInput = $('otp-4');
    if (lastInput) lastInput.focus();
  },

  setupOtpInputs() {
    const inputs = [$('otp-1'), $('otp-2'), $('otp-3'), $('otp-4')];
    if (inputs[0]) setTimeout(() => inputs[0].focus(), 100);

    const handlePaste = (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (pasteData.length >= 4) {
        this.fillOtp(pasteData);
      }
    };

    inputs.forEach((input, index) => {
      if (!input) return;
      input.addEventListener('paste', handlePaste);
      input.addEventListener('input', (e) => {
        const val = e.target.value.replace(/\D/g, '');
        e.target.value = val ? val[0] : '';
        if (val && index < 3 && inputs[index + 1]) {
          inputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && index > 0 && inputs[index - 1]) {
          inputs[index - 1].focus();
        } else if (e.key === 'Enter') {
          this.verifyOtp();
        }
      });
    });
  },

  startCountdown(seconds) {
    clearInterval(this.timerInterval);
    let left = seconds;
    const cdEl = $('countdown');
    const timerWrap = $('otpTimer');
    const resendBtn = $('resendOtpBtn');

    if (!cdEl || !timerWrap || !resendBtn) return;
    timerWrap.style.display = 'inline';
    resendBtn.style.display = 'none';

    this.timerInterval = setInterval(() => {
      left--;
      if (cdEl) cdEl.textContent = left;
      if (left <= 0) {
        clearInterval(this.timerInterval);
        if (timerWrap) timerWrap.style.display = 'none';
        if (resendBtn) resendBtn.style.display = 'inline';
      }
    }, 1000);
  },

  async resendOtp() {
    if (!this.activeSession) return;
    try {
      toast('Naya OTP bheja ja raha hai...', 'info');
      const res = await apiFetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: this.activeSession.phone, purpose: this.activeSession.purpose })
      });
      this.activeSession.token = res.sessionToken;
      this.renderModal(res.testOtp);
      toast(res.message || 'Naya OTP bhej diya gaya!', 'ok');
    } catch (e) {
      toast(e.message, 'err');
    }
  },

  async verifyOtp() {
    if (this.isVerifying) return;
    const inputs = [$('otp-1'), $('otp-2'), $('otp-3'), $('otp-4')];
    const otp = inputs.map(i => i?.value || '').join('');

    if (otp.length !== 4) {
      toast('Kripya poora 4-digit OTP daalein.', 'err');
      return;
    }

    this.isVerifying = true;
    const btn = $('otpVerifyBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="pulse-dot"></span> Verifying...';
    }

    try {
      const res = await apiFetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: this.activeSession.phone,
          otp,
          sessionToken: this.activeSession.token
        })
      });

      const callback = this.activeSession?.onVerified;
      const phone = this.activeSession?.phone;
      this.closeModal();

      if (typeof callback === 'function') {
        callback({
          phone: phone,
          verificationToken: res.verificationToken
        });
      }
    } catch (e) {
      toast(e.message || 'OTP verification failed.', 'err');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '🛡️ OTP Verify Karein';
      }
      inputs.forEach(i => { if (i) i.value = ''; });
      inputs[0]?.focus();
    } finally {
      this.isVerifying = false;
    }
  },

  closeModal() {
    clearInterval(this.timerInterval);
    this.isVerifying = false;
    document.querySelectorAll('#otpModalBackdrop, .sheet-backdrop-3d[data-otp]').forEach(el => el.remove());
    const el = document.getElementById('otpModalBackdrop');
    if (el) el.remove();
  }
};

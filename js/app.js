/* App — khởi động */
(function () {
  const btnRefresh     = document.getElementById('btnRefresh');
  const regionDropdown = document.getElementById('regionDropdown');
  const regionBtn      = document.getElementById('regionBtn');
  const regionList     = document.getElementById('regionList');
  const regionCurrent  = document.getElementById('regionCurrent');
  const toastEl        = document.getElementById('toast');

  let currentRegion = 'VN';
  let currentLabel  = 'VN - Việt Nam';
  let loading = false;
  let toastTimer = null;

  /* ---------- Toast ---------- */
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2200);
  }

  /* ---------- Load events (GIẢ LẬP - CHƯA GẮN API) ---------- */
  async function loadEvents(region) {
    if (loading) return;
    loading = true;

    UI.renderSkeletons();
    btnRefresh.disabled = true;

    try {
      /* ═══════════════════════════════════════════
         TODO: GẮN API TẠI ĐÂY (Khi nào sẵn sàng thì mở ra)
         ═══════════════════════════════════════════ */

      // Thời gian chờ giả lập: Nhanh (1.2s - 1.8s)
      const loadDelay = Math.floor(Math.random() * 600) + 1200;
      await new Promise(r => setTimeout(r, loadDelay));
      
      UI.renderEmpty('GIAO DIỆN ĐÃ SẴN SÀNG');

    } catch (err) {
      console.error('[events]', err);
      UI.renderError(err);
    } finally {
      loading = false;
      btnRefresh.disabled = false;
      if (document.getElementById('loader')) {
        Loader.hide();
      }
    }
  }

  /* ---------- Dropdown ---------- */
  function openDropdown() {
    regionDropdown.classList.add('open');
    regionBtn.setAttribute('aria-expanded', 'true');
  }
  function closeDropdown() {
    regionDropdown.classList.remove('open');
    regionBtn.setAttribute('aria-expanded', 'false');
  }

  function selectRegion(code, label) {
    if (code === currentRegion) {
      closeDropdown();
      return;
    }
    currentRegion = code;
    currentLabel  = label;
    regionCurrent.textContent = label;

    regionBtn.classList.add('has-selected');

    regionList.querySelectorAll('.region-item').forEach(el => {
      const isSel = el.dataset.value === code;
      el.classList.toggle('selected', isSel);
      el.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });

    closeDropdown();
    showToast(`Đã chuyển sang Server ${code}`);
    loadEvents(code);
  }

  regionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (regionDropdown.classList.contains('open')) closeDropdown();
    else openDropdown();
  });

  regionList.addEventListener('click', (e) => {
    const item = e.target.closest('.region-item');
    if (!item) return;
    selectRegion(item.dataset.value, item.textContent.trim());
  });

  document.addEventListener('click', (e) => {
    if (!regionDropdown.contains(e.target)) closeDropdown();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDropdown();
  });

  /* ---------- Refresh ---------- */
  btnRefresh.addEventListener('click', () => loadEvents(currentRegion));

  /* ---------- Init ---------- */
  function init() {
    const initial = regionList.querySelector('.region-item.selected');
    if (initial) {
      currentRegion = initial.dataset.value;
      currentLabel  = initial.textContent.trim();
      regionCurrent.textContent = currentLabel;
    }

    Loader.start();
    loadEvents(currentRegion);
    
    // Tự động ẩn Loader sau 3s (đề phòng giật lag)
    setTimeout(() => Loader.hide(), 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

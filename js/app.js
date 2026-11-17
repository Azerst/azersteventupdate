/* App — khởi động */
(function () {
  const btnRefresh   = document.getElementById('btnRefresh');
  const regionDropdown = document.getElementById('regionDropdown');
  const regionBtn    = document.getElementById('regionBtn');
  const regionList   = document.getElementById('regionList');
  const regionCurrent = document.getElementById('regionCurrent');
  const toastEl      = document.getElementById('toast');

  let currentRegion = 'VN';
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

  /* ---------- Load events ---------- */
  async function loadEvents(region) {
    if (loading) return;
    loading = true;

    UI.renderSkeletons();
    btnRefresh.disabled = true;

    try {
      /* ═══════════════════════════════════════════
         TODO: GẮN API TẠI ĐÂY
         const res  = await fetch(`/api/events?region=${region}`);
         const raw  = await res.json();
         const data = normalize(raw);
         UI.renderEvents(data, region);
         return;
         ═══════════════════════════════════════════ */

      await new Promise(r => setTimeout(r, 600));
      UI.renderEmpty('GIAO DIỆN ĐÃ SẴN SÀNG');

    } catch (err) {
      console.error('[events]', err);
      UI.renderError(err);
    } finally {
      loading = false;
      btnRefresh.disabled = false;
      Loader.hide();
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

  function selectRegion(value) {
    if (value === currentRegion) {
      closeDropdown();
      return;
    }
    currentRegion = value;
    regionCurrent.textContent = value;

    regionList.querySelectorAll('.region-item').forEach(el => {
      const isSel = el.dataset.value === value;
      el.classList.toggle('selected', isSel);
      el.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });

    closeDropdown();
    showToast(`Đã chuyển sang server ${value}`);
    loadEvents(value);
  }

  regionBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (regionDropdown.classList.contains('open')) closeDropdown();
    else openDropdown();
  });

  regionList.addEventListener('click', (e) => {
    const item = e.target.closest('.region-item');
    if (!item) return;
    selectRegion(item.dataset.value);
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
    Loader.start();
    loadEvents(currentRegion);
    setTimeout(() => Loader.hide(), 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

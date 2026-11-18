/* App — khởi động & gọi API arexnetwork */
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

  /* ---------- Chuẩn hoá URL ảnh ---------- */
  function normalizeImageUrl(url) {
    if (!url || typeof url !== 'string') return '';
    let clean = url.trim();
    if (clean.startsWith('httpa://')) clean = clean.replace('httpa://', 'https://');
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) return '';
    return clean;
  }

  /* ---------- Định dạng ngày ---------- */
  function formatDate(isoString) {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) { return ''; }
  }

  /* ---------- Chuyển đổi dữ liệu API ---------- */
  function mapApiData(rawData, regionFilter) {
    const list = rawData.data || rawData.events || [];
    const hasRegionField = list.some(item => item.server_region);

    const filtered = (hasRegionField && regionFilter)
      ? list.filter(item => (item.server_region || '').toLowerCase() === regionFilter.toLowerCase())
      : list;

    return filtered.map(item => {
      let statusLabel = 'Đang diễn ra';
      let statusClass = 'active';
      const rawStatus = (item.status || '').toLowerCase();
      if (rawStatus.includes('upcoming') || rawStatus.includes('soon')) {
        statusLabel = 'Sắp diễn ra'; statusClass = 'upcoming';
      } else if (rawStatus.includes('end') || rawStatus.includes('over')) {
        statusLabel = 'Đã kết thúc'; statusClass = 'ended';
      }

      let imgUrl = normalizeImageUrl(item.image_url);
      if (!imgUrl) imgUrl = normalizeImageUrl(item.thumbnail_url);

      return {
        title: item.title || 'Sự kiện Free Fire',
        img: imgUrl,
        tag: (item.server_region || 'EVENT').toUpperCase(),
        statusLabel: statusLabel,
        statusClass: statusClass,
        start: formatDate(item.start_date),
        end: formatDate(item.end_date)
      };
    });
  }

  /* ---------- Load events ---------- */
  async function loadEvents(region) {
    if (loading) return;
    loading = true;

    UI.renderSkeletons();
    btnRefresh.disabled = true;

    try {
      const response = await fetch('https://www.arexnetwork.vn/api/v2/events', {
        method: 'GET',
        headers: { 'accept': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Máy chủ API phản hồi lỗi (Mã HTTP: ${response.status})`);
      }

      const rawData = await response.json();
      const events = mapApiData(rawData, region);

      if (events.length === 0) {
        UI.renderEmpty(`KHÔNG CÓ SỰ KIỆN Ở SERVER ${region}`);
      } else {
        UI.renderEvents(events, region.toUpperCase());
      }

    } catch (err) {
      console.error('[events error]', err);
      let userMsg = err.message || 'Lỗi không xác định';
      if (userMsg.includes('Failed to fetch') || userMsg.includes('NetworkError')) {
        userMsg = 'Lỗi kết nối API. Vui lòng kiểm tra mạng hoặc thử lại sau.';
      }
      UI.renderError(new Error(userMsg));
    } finally {
      loading = false;
      btnRefresh.disabled = false;
      if (document.getElementById('loader')) Loader.hide();
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
    if (code === currentRegion) { closeDropdown(); return; }
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
    setTimeout(() => Loader.hide(), 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

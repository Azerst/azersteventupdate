/* App — khởi động */
(function () {
  const btnRefresh     = document.getElementById('btnRefresh');
  const regionDropdown = document.getElementById('regionDropdown');
  const regionBtn      = document.getElementById('regionBtn');
  const regionList     = document.getElementById('regionList');
  const regionCurrent  = document.getElementById('regionCurrent');
  const toastEl        = document.getElementById('toast');

  let currentRegion = 'vn'; // Mặc định là vn
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

  /* ---------- Hàm chuyển đổi dữ liệu API (Dự phòng) ---------- */
  // Nếu API trả về tên trường khác (VD: name thay vì title), bạn có thể sửa ở đây
  function mapApiData(rawData) {
    // Giả sử API trả về mảng trực tiếp hoặc nằm trong key data/events
    const list = Array.isArray(rawData) ? rawData : (rawData.data || rawData.events || []);
    
    return list.map(item => {
      return {
        title: item.title || item.name || 'Sự kiện Free Fire',
        desc: item.desc || item.description || item.content || '',
        img: item.img || item.image || item.thumbnail || '',
        tag: item.tag || item.type || 'EVENT',
        statusLabel: item.statusLabel || item.status || 'Đang diễn ra',
        statusClass: item.statusClass || 'active',
        start: item.start || item.start_time || '',
        end: item.end || item.end_time || ''
      };
    });
  }

  /* ---------- Load events (GỌI API THẬT) ---------- */
  async function loadEvents(region) {
    if (loading) return;
    loading = true;

    UI.renderSkeletons();
    btnRefresh.disabled = true;

    try {
      // Gọi API với header x-region
      const response = await fetch('https://event.x3x.workers.dev/', {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'x-region': region,
          'x-requested-with': 'fetch'
        }
      });

      // Xử lý lỗi HTTP (Ví dụ: na, sg đang lỗi)
      if (!response.ok) {
        throw new Error(`Máy chủ ${region.toUpperCase()} đang bảo trì hoặc không có dữ liệu (Mã lỗi: ${response.status})`);
      }

      const rawData = await response.json();
      
      // Chuyển đổi dữ liệu
      const events = mapApiData(rawData);

      // Render ra giao diện
      UI.renderEvents(events, region.toUpperCase());

    } catch (err) {
      console.error('[events]', err);
      // Nếu server na hoặc sg lỗi, báo lỗi rõ ràng cho người dùng
      UI.renderError(err);
    } finally {
      loading = false;
      btnRefresh.disabled = false;
      
      // Ẩn Loader
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
    showToast(`Đã chuyển sang Server ${code.toUpperCase()}`);
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
    
    // Ẩn Loader sau 3s phòng trường hợp API phản hồi chậm
    setTimeout(() => Loader.hide(), 3000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

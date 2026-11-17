/* App — khởi động */
(function () {
  const btnRefresh     = document.getElementById('btnRefresh');
  const regionDropdown = document.getElementById('regionDropdown');
  const regionBtn      = document.getElementById('regionBtn');
  const regionList     = document.getElementById('regionList');
  const regionCurrent  = document.getElementById('regionCurrent');
  const toastEl        = document.getElementById('toast');

  let currentRegion = 'vn';
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

  /* ---------- Tự động dò tìm mảng dữ liệu từ JSON (đa dạng cấu trúc) ---------- */
  function extractEvents(rawData) {
    if (Array.isArray(rawData)) return rawData;
    if (typeof rawData === 'object' && rawData !== null) {
      const keys = ['data', 'events', 'list', 'items', 'result', 'event_list', 'event'];
      for (let key of keys) {
        if (Array.isArray(rawData[key])) return rawData[key];
        if (rawData[key] && typeof rawData[key] === 'object') {
          for (let subKey of keys) {
            if (Array.isArray(rawData[key][subKey])) return rawData[key][subKey];
          }
        }
      }
    }
    return [];
  }

  /* ---------- Chuyển đổi dữ liệu thô sang chuẩn UI (map ui.js) ---------- */
  function mapEventsToUI(eventsArray) {
    return eventsArray.map((item, idx) => {
      // Xử lý trạng thái (Active / Upcoming / Ended)
      let statusLabel = 'Đang diễn ra';
      let statusClass = 'active';
      
      const rawStatus = (item.status || item.state || '').toString().toLowerCase();
      if (rawStatus.includes('upcoming') || rawStatus.includes('soon') || rawStatus.includes('sắp')) {
        statusLabel = 'Sắp diễn ra'; statusClass = 'upcoming';
      } else if (rawStatus.includes('end') || rawStatus.includes('over') || rawStatus.includes('kết')) {
        statusLabel = 'Đã kết thúc'; statusClass = 'ended';
      }

      return {
        title: item.title || item.name || item.event_name || `Sự kiện #${idx + 1}`,
        desc: item.desc || item.description || item.content || item.short_desc || item.intro || '',
        img: item.img || item.image || item.banner || item.banner_url || item.thumbnail || item.icon || item.pic || '',
        tag: (item.tag || item.type || item.category || 'EVENT').toString().toUpperCase(),
        statusLabel: item.statusLabel || statusLabel,
        statusClass: item.statusClass || statusClass,
        start: item.start || item.start_time || item.startTime || item.begin || '',
        end: item.end || item.end_time || item.endTime || item.finish || ''
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
      const response = await fetch('https://event.x3x.workers.dev/', {
        method: 'GET',
        headers: {
          'accept': '*/*',
          'x-region': region,
          'x-requested-with': 'fetch'
        }
      });

      const text = await response.text();
      
      // Kiểm tra nếu API trả về HTML (Lỗi CORS, Cloudflare chặn, hoặc trang lỗi)
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error(`API trả về HTML (Mã HTTP: ${response.status}). Có thể do lỗi CORS hoặc Cloudflare đang chặn.`);
      }

      if (!response.ok) {
        throw new Error(`Server ${region.toUpperCase()} lỗi (Mã HTTP: ${response.status}). Server này có thể đang bảo trì.`);
      }

      let rawData;
      try {
        rawData = JSON.parse(text);
      } catch (e) {
        throw new Error("Dữ liệu API trả về không phải JSON hợp lệ.");
      }

      const eventsArray = extractEvents(rawData);
      const events = mapEventsToUI(eventsArray);

      if (events.length === 0) {
        UI.renderEmpty('KHÔNG CÓ SỰ KIỆN NÀO');
      } else {
        UI.renderEvents(events, region.toUpperCase());
      }

    } catch (err) {
      console.error('[events error]', err);
      
      let userMsg = err.message || 'Lỗi không xác định';
      
      // Bắt lỗi CORS / Network phổ biến
      if (userMsg.includes("Failed to fetch") || userMsg.includes("NetworkError") || userMsg.includes("Load failed")) {
        userMsg = "Lỗi CORS: Trình duyệt chặn gọi API. Bạn cần cấu hình CORS cho Cloudflare Worker (xem hướng dẫn bên dưới).";
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
    setTimeout(() => Loader.hide(), 4000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

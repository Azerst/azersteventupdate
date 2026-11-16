/* App — khởi động */
(function () {
  const btnRefresh = document.getElementById('btnRefresh');
  const regionSel  = document.getElementById('regionSelect');

  let loading = false;   // FIX #5: guard double-click

  async function loadEvents(region) {
    if (loading) return;
    loading = true;

    UI.renderSkeletons();
    btnRefresh.disabled = true;

    try {
      /* ═══════════════════════════════════════════
         TODO: GẮN API TẠI ĐÂY (khi có)
         const res  = await fetch(`/api/events?region=${region}`);
         const raw  = await res.json();
         const data = normalize(raw);      // hàm tự viết
         UI.renderEvents(data, region);
         return;
         ═══════════════════════════════════════════ */

      // Chưa có API: chờ 600ms rồi hiện empty state
      await new Promise(r => setTimeout(r, 600));
      UI.renderEmpty('Giao diện đã sẵn sàng — chờ API được gắn vào app.js');

    } catch (err) {
      console.error('[events]', err);
      UI.renderError(err);

    } finally {
      // FIX #1: Loader luôn được đóng dù thành công hay lỗi
      loading = false;
      btnRefresh.disabled = false;
      Loader.hide();
    }
  }

  function bindEvents() {
    btnRefresh.addEventListener('click', () => loadEvents(regionSel.value));
    regionSel.addEventListener('change', () => loadEvents(regionSel.value));
  }

  function init() {
    Loader.start();
    bindEvents();
    loadEvents(regionSel.value);

    // Fallback cứu hộ: nếu vì lý do gì Loader không được hide sau 10s
    setTimeout(() => Loader.hide(), 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

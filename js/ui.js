/* UI — render HTML */
window.UI = (function () {
  const $ = (s) => document.querySelector(s);
  let eventStore = [];

  const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function setBusy(busy) {
    const wrap = $('#eventsWrap');
    if (wrap) wrap.setAttribute('aria-busy', busy ? 'true' : 'false');
  }

  /* ---------- Hàm hiển thị Toast dùng chung ---------- */
  function showToast(msg) {
    const toastEl = document.getElementById('toast');
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2500);
  }

  function renderSkeletons(n = 3) {
    const wrap = $('#eventsWrap');
    if (!wrap) return;
    setBusy(true);
    wrap.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'skeleton';
      wrap.appendChild(el);
    }
    $('#statLine').textContent = 'Đang tải…';
  }

  function renderEmpty(msg = 'GIAO DIỆN ĐÃ SẴN SÀNG') {
    const wrap = $('#eventsWrap');
    if (!wrap) return;
    setBusy(false);
    wrap.innerHTML = `<div class="empty">${escapeHtml(msg)}</div>`;
    $('#statLine').innerHTML = `<strong>0</strong> sự kiện`;
  }

  function renderError(err) {
    const wrap = $('#eventsWrap');
    if (!wrap) return;
    setBusy(false);
    wrap.innerHTML = `
      <div class="error-box">
        Không thể tải sự kiện.
        <small>${escapeHtml(err?.message || String(err))}</small>
      </div>`;
    $('#statLine').innerHTML = '<strong>Lỗi</strong> kết nối';
  }

  function renderEvents(items, region) {
    const wrap = $('#eventsWrap');
    if (!wrap) return;
    if (!items?.length) return renderEmpty();
    setBusy(false);
    eventStore = items;

    wrap.innerHTML = items.map((it, idx) => {
      const timeLine = (it.start || it.end)
        ? `<div class="event-time"><span>${escapeHtml(it.start || '—')}</span><span>${escapeHtml(it.end || '—')}</span></div>`
        : '';

      return `
        <article class="event-card" data-index="${idx}" role="button" tabindex="0" style="animation-delay:${idx * 50}ms">
          <div class="event-thumb">
            ${it.img ? `<img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.title)}" loading="lazy" onerror="this.onerror=null; this.src='img/placeholder.svg'; this.style.objectFit='contain';">` : ''}
            <div class="event-tag">${escapeHtml(String(it.tag || 'EVENT').toUpperCase())}</div>
            ${it.statusLabel ? `<div class="event-status ${escapeHtml(it.statusClass || '')}">${escapeHtml(it.statusLabel)}</div>` : ''}
          </div>
          <div class="event-body">
            <h3 class="event-title">${escapeHtml(it.title)}</h3>
            ${timeLine}
          </div>
        </article>
      `;
    }).join('');

    $('#statLine').innerHTML = `<strong>${items.length}</strong> sự kiện${region ? ` · ${escapeHtml(region)}` : ''}`;
  }

  /* ---------- Modal chi tiết ---------- */
  function openModal(index) {
    const item = eventStore[index];
    if (!item) return;

    const modal = document.getElementById('eventModal');
    if (!modal) return;

    const imgEl = document.getElementById('modalImage');
    imgEl.src = item.img || 'img/placeholder.svg';
    imgEl.style.display = 'block';
    imgEl.style.objectFit = item.img ? 'cover' : 'contain';

    document.getElementById('modalTag').textContent = (item.tag || 'EVENT').toUpperCase();
    document.getElementById('modalTitle').textContent = item.title || 'Sự kiện';
    
    document.getElementById('modalStart').textContent = item.start || '—';
    document.getElementById('modalEnd').textContent = item.end || '—';

    const btnDownload = document.getElementById('btnDownload');
    btnDownload.dataset.url = item.img || '';
    btnDownload.dataset.title = item.title || 'Event'; // Lưu tên sự kiện để đặt tên file

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    const modal = document.getElementById('eventModal');
    if (!modal) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  /* ---------- Tải xuống (Có thông báo & Đặt tên AZERST_) ---------- */
  function downloadImage(url, title) {
    if (!url) {
      showToast('Không có ảnh để tải');
      return;
    }

    // Tạo tên file chuẩn: AZERST_TenSuKien.png
    let safeName = (title || 'Su_Kien').replace(/[\\/:*?"<>|]/g, '_').substring(0, 50);
    
    showToast('Đang tải ảnh...');

    fetch(url, { mode: 'cors' })
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.blob(); })
      .then(blob => {
        // Lấy đuôi file từ định dạng ảnh thực tế
        let ext = 'png';
        if (blob.type === 'image/jpeg') ext = 'jpg';
        else if (blob.type === 'image/webp') ext = 'webp';
        else if (blob.type === 'image/gif') ext = 'gif';

        const filename = `AZERST_${safeName}.${ext}`;

        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        showToast('Tải ảnh thành công!');
      })
      .catch((err) => {
        console.warn('Lỗi tải ảnh, mở tab mới:', err);
        window.open(url, '_blank', 'noopener');
        showToast('Đã mở ảnh ở tab mới (Trình duyệt chặn tải trực tiếp)');
      });
  }

  /* ---------- Gắn sự kiện ---------- */
  function setupEvents() {
    const wrap = document.getElementById('eventsWrap');
    if (wrap) {
      wrap.addEventListener('click', (e) => {
        const card = e.target.closest('.event-card');
        if (!card) return;
        const idx = parseInt(card.dataset.index, 10);
        if (!isNaN(idx)) openModal(idx);
      });
      wrap.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const card = e.target.closest('.event-card');
        if (!card) return;
        e.preventDefault();
        const idx = parseInt(card.dataset.index, 10);
        if (!isNaN(idx)) openModal(idx);
      });
    }

    const modal = document.getElementById('eventModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
    const closeBtn = document.getElementById('modalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    const btnDownload = document.getElementById('btnDownload');
    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        downloadImage(btnDownload.dataset.url, btnDownload.dataset.title);
      });
    }

    // Chặn menu chuột phải / nhấn giữ ảnh
    document.addEventListener('contextmenu', (e) => {
      if (e.target.tagName === 'IMG') e.preventDefault();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEvents);
  } else {
    setupEvents();
  }

  return { renderSkeletons, renderEmpty, renderError, renderEvents, openModal, closeModal };
})();

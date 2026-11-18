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

    // KHÔNG render desc (đã xóa chú thích)
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
    document.getElementById('modalStart').textContent = item.start ? `📅 Bắt đầu: ${item.start}` : '';
    document.getElementById('modalEnd').textContent = item.end ? `⏰ Kết thúc: ${item.end}` : '';

    const btnDownload = document.getElementById('btnDownload');
    btnDownload.dataset.url = item.img || '';
    btnDownload.dataset.name = getFilename(item.img, item.title);

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

  function getFilename(url, title) {
    const safeName = (title || 'azerst-event').replace(/[\\/:*?"<>|]/g, '_').substring(0, 60);
    let ext = 'png';
    try {
      const match = new URL(url || '').pathname.match(/\.(png|jpg|jpeg|webp|gif)$/i);
      if (match) ext = match[1].toLowerCase();
    } catch (e) {}
    return safeName + '.' + ext;
  }

  /* ---------- Tải xuống ---------- */
  function downloadImage(url, filename) {
    if (!url) return;
    fetch(url, { mode: 'cors' })
      .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.blob(); })
      .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      })
      .catch(() => {
        // Fallback: mở ảnh trong tab mới nếu CORS chặn
        window.open(url, '_blank', 'noopener');
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
        downloadImage(btnDownload.dataset.url, btnDownload.dataset.name);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupEvents);
  } else {
    setupEvents();
  }

  return { renderSkeletons, renderEmpty, renderError, renderEvents, openModal, closeModal };
})();

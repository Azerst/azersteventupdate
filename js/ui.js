 /* UI — render HTML */
window.UI = (function () {
  const $ = (s) => document.querySelector(s);

  const escapeHtml = (s = '') => String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));

  function renderSkeletons(n = 3) {
    const wrap = $('#eventsWrap');
    wrap.innerHTML = '';
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      el.className = 'skeleton';
      wrap.appendChild(el);
    }
    $('#statLine').textContent = 'Đang tải…';
  }

  function renderEmpty(msg = 'Chưa có dữ liệu sự kiện.') {
    $('#eventsWrap').innerHTML = `<div class="empty">${escapeHtml(msg)}</div>`;
    $('#statLine').innerHTML = `<strong>0</strong> sự kiện`;
  }

  function renderError(err) {
    $('#eventsWrap').innerHTML = `
      <div class="error-box">
        Không thể tải sự kiện.<br>
        <small>${escapeHtml(err?.message || String(err))}</small>
      </div>`;
    $('#statLine').innerHTML = '<strong>Lỗi</strong>';
  }

  /* Dùng khi có API: items = [{title, desc, img, tag, start, end, statusClass, statusLabel}] */
  function renderEvents(items, region) {
    if (!items?.length) return renderEmpty();

    $('#eventsWrap').innerHTML = items.map((it, idx) => {
      const timeLine = (it.start || it.end)
        ? `<div class="event-time"><span>${it.start || '—'}</span><span>${it.end || '—'}</span></div>`
        : '';

      return `
        <article class="event-card" style="animation-delay:${idx * 50}ms">
          <div class="event-thumb">
            ${it.img ? `<img src="${escapeHtml(it.img)}" alt="${escapeHtml(it.title)}" loading="lazy" onerror="this.style.display='none'">` : ''}
            <div class="event-tag">${escapeHtml(String(it.tag || 'EVENT').toUpperCase())}</div>
            ${it.statusLabel ? `<div class="event-status ${it.statusClass || ''}">${escapeHtml(it.statusLabel)}</div>` : ''}
          </div>
          <div class="event-body">
            <h3 class="event-title">${escapeHtml(it.title)}</h3>
            ${it.desc ? `<p class="event-desc">${escapeHtml(it.desc)}</p>` : ''}
            ${timeLine}
          </div>
        </article>
      `;
    }).join('');

    $('#statLine').innerHTML = `<strong>${items.length}</strong> sự kiện${region ? ` · ${escapeHtml(region)}` : ''}`;
  }

  return { renderSkeletons, renderEmpty, renderError, renderEvents };
})();

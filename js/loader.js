/* Loader — hiển thị & đóng, idempotent (gọi nhiều lần OK) */
window.Loader = (function () {
  let interval = null;
  let hidden = false;

  function start() {
    if (hidden) return;

    const fill = document.getElementById('barFill');
    const pct  = document.getElementById('barPct');
    if (!fill || !pct) return;

    document.documentElement.classList.add('loading');

    let p = 0;
    // Tăng tốc độ chạy thanh Loader: 80ms, tăng 4-8%
    // Thanh bar sẽ đạt 90% trong khoảng 1.5s - 1.8s
    interval = setInterval(() => {
      p = Math.min(90, p + Math.random() * 8); 
      fill.style.width = p + '%';
      pct.textContent = Math.floor(p) + '%';
    }, 80);
  }

  function hide() {
    if (hidden) return;
    hidden = true;

    const loader = document.getElementById('loader');
    const fill = document.getElementById('barFill');
    const pct  = document.getElementById('barPct');

    if (interval) { clearInterval(interval); interval = null; }
    if (fill) fill.style.width = '100%';
    if (pct)  pct.textContent = '100%';

    document.documentElement.classList.remove('loading');

    setTimeout(() => {
      if (loader) loader.classList.add('hide');
      setTimeout(() => { if (loader) loader.remove(); }, 900);
    }, 300);
  }

  return { start, hide };
})();

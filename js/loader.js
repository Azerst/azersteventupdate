/* Loader — hiển thị và đóng */
window.Loader = (function () {
  let interval, hidden = false;

  function start() {
    const fill = document.getElementById('barFill');
    const pct  = document.getElementById('barPct');
    document.documentElement.classList.add('loading');
    document.body.classList.add('expanded');

    let p = 0;
    interval = setInterval(() => {
      p = Math.min(90, p + Math.random() * 12);
      fill.style.width = p + '%';
      pct.textContent = Math.floor(p) + '%';
    }, 180);
  }

  function hide() {
    if (hidden) return;
    hidden = true;

    const loader = document.getElementById('loader');
    clearInterval(interval);
    document.getElementById('barFill').style.width = '100%';
    document.getElementById('barPct').textContent = '100%';

    setTimeout(() => {
      loader.classList.add('hide');
      document.documentElement.classList.remove('loading');
      setTimeout(() => loader.remove(), 900);
    }, 300);
  }

  return { start, hide };
})();

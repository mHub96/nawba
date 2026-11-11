// Time-of-day appearance for نوبة (family app + staff panel). Loaded in <head> so the right colours paint first.
// Modes: auto (follows the clock) · day · midday (max contrast for strong sun) · evening (dim, warm, low blue) · night.
(function () {
  var MODES = ['auto', 'day', 'midday', 'evening', 'night'];
  var LABELS = {
    auto: { ar: 'تلقائي حسب الوقت', en: 'Automatic (by time of day)' },
    day: { ar: 'نهار', en: 'Day' },
    midday: { ar: 'ظهيرة، أوضح بالشمس', en: 'Midday (bright sun)' },
    evening: { ar: 'مساء', en: 'Evening' },
    night: { ar: 'ليل', en: 'Night' }
  };
  var BAR = { day: '#1d3fa0', midday: '#16348c', evening: '#1b2142', night: '#050a1c' };
  var KEY = 'nawba.themeMode';

  function byClock(d) {
    d = d || new Date();
    var h = d.getHours() + d.getMinutes() / 60;
    if (h >= 5.5 && h < 11) return 'day';
    if (h >= 11 && h < 16) return 'midday';
    if (h >= 16 && h < 19.5) return 'evening';
    return 'night';
  }
  function get() { try { var m = localStorage.getItem(KEY); return MODES.indexOf(m) >= 0 ? m : 'auto'; } catch (e) { return 'auto'; } }
  function apply() {
    var mode = get(), theme = mode === 'auto' ? byClock() : mode, root = document.documentElement;
    if (root.dataset.theme !== theme) {
      root.dataset.theme = theme;
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', BAR[theme]);
      try { window.dispatchEvent(new CustomEvent('nawba-theme', { detail: { theme: theme, mode: mode } })); } catch (e) {}
    }
    return theme;
  }
  function set(mode) { try { localStorage.setItem(KEY, mode); } catch (e) {} apply(); }
  function next() { var i = MODES.indexOf(get()); set(MODES[(i + 1) % MODES.length]); return get(); }

  apply();
  setInterval(function () { if (get() === 'auto') apply(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') apply(); });
  window.NawbaTheme = { MODES: MODES, LABELS: LABELS, get: get, set: set, next: next, apply: apply, byClock: byClock, current: function () { return document.documentElement.dataset.theme; } };
})();

// Hand-drawn icon set for نوبة. UI icons use a 24-unit grid; pictograms (crisis steps) use 120 units
// with a heavier stroke so they read at a glance for families who do not read.
(function () {
  const ui = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const pic = (d) => `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  // reusable figure parts (120 grid)
  const lying = (y = 84) => `<circle cx="26" cy="${y - 8}" r="10"/><path d="M38 ${y - 6} Q62 ${y - 14} 96 ${y - 6}"/><path d="M14 ${y + 10} H106"/>`;
  const slash = `<circle cx="60" cy="60" r="50" stroke-width="5"/><path d="M25 25 L95 95" stroke-width="6"/>`;

  window.ICONS = {
    // ---- brand mark: glass lapis tile, ochre brainwave settling into a calm line ----
    logo: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="15" fill="#1d3fa0"/><rect width="64" height="34" rx="15" fill="#4a78ea" fill-opacity=".55"/><rect y="17" width="64" height="20" fill="#1d3fa0" fill-opacity=".35"/><path d="M9 34h10l4-12 6 22 5-30 4 20h17" fill="none" stroke="#f6c44e" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

    // ---- UI symbols (SF Symbols-style: 1.8 stroke, rounded caps and joins; *F = filled, for selected tabs) ----
    speaker: ui('<path d="M3.5 9.5v5h3.6l4.9 4V5.5l-4.9 4z"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6M18.2 6.6a8 8 0 0 1 0 10.8"/>'),
    mute: ui('<path d="M3.5 9.5v5h3.6l4.9 4V5.5l-4.9 4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/>'),
    close: ui('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
    phone: ui('<path d="M6.6 3.5h2.6l1.6 4.2-2 1.4a10.6 10.6 0 0 0 6.1 6.1l1.4-2 4.2 1.6v2.6a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2z"/>'),
    camera: ui('<rect x="2.8" y="6.5" width="13.2" height="11" rx="3"/><path d="M16 10.6l4.1-2.4a.6.6 0 0 1 .9.5v6.6a.6.6 0 0 1-.9.5L16 13.4"/>'),
    user: ui('<circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 20a7.2 7.2 0 0 1 14.4 0"/>'),
    book: ui('<path d="M12 6.4C10.2 5 7.6 4.5 4 4.6v13.6c3.6-.1 6.2.4 8 1.8 1.8-1.4 4.4-1.9 8-1.8V4.6c-3.6-.1-6.2.4-8 1.8zM12 6.4V20"/>'),
    list: ui('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.6" cy="6.5" r=".6" fill="currentColor"/><circle cx="4.6" cy="12" r=".6" fill="currentColor"/><circle cx="4.6" cy="17.5" r=".6" fill="currentColor"/>'),
    plus: ui('<path d="M12 5v14M5 12h14"/>'),
    check: ui('<path d="M5 12.6l4.4 4.4L19 7.4"/>', 'stroke-width="2.4"'),
    back: ui('<path d="M9.5 5.5l6.5 6.5-6.5 6.5"/>'),   // points "back" in RTL
    next: ui('<path d="M14.5 5.5L8 12l6.5 6.5"/>'),
    logout: ui('<path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14M9.5 8l-4 4 4 4M5.5 12H15"/>'),
    bolt: ui('<path d="M13.4 2.8L5.2 13.4h6.1l-.9 7.8 8.2-10.6h-6.1z"/>', 'stroke-width="1.9"'),
    clock: ui('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
    yes: ui('<path d="M5 12.6l4.4 4.4L19 7.4"/>', 'stroke-width="2.6"'),
    no: ui('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>', 'stroke-width="2.6"'),
    pill: ui('<rect x="2.6" y="8.4" width="18.8" height="7.2" rx="3.6" transform="rotate(-38 12 12)"/><path d="M9.1 8.3l5.8 7.4"/>'),
    brain: ui('<path d="M11.5 5.2a3 3 0 0 0-5.7 1.3 3.2 3.2 0 0 0-1.6 5.5 3.2 3.2 0 0 0 2.4 5 3 3 0 0 0 4.9 1.5zM12.5 5.2a3 3 0 0 1 5.7 1.3 3.2 3.2 0 0 1 1.6 5.5 3.2 3.2 0 0 1-2.4 5 3 3 0 0 1-4.9 1.5z"/>'),
    aid: ui('<rect x="3" y="6.5" width="18" height="13" rx="3"/><path d="M9 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v1.5M12 10v6M9 13h6"/>'),
    side: ui('<circle cx="5.5" cy="13" r="2.3"/><path d="M8.5 14c3.6-1.8 7.4-1.8 12 .2M3 18.5h18"/>'),
    moon: ui('<path d="M19.5 14.8A8 8 0 1 1 9.2 4.5a6.4 6.4 0 0 0 10.3 10.3z"/>'),
    home: ui('<path d="M3.8 10.4L12 3.8l8.2 6.6V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5.5H5.3A1.5 1.5 0 0 1 3.8 19z"/>'),
    homeF: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.4 3.3a1 1 0 0 1 1.2 0l8 6.4a1.6 1.6 0 0 1 .6 1.3V19a2 2 0 0 1-2 2H15.5v-5.6a1.4 1.4 0 0 0-1.4-1.4H9.9a1.4 1.4 0 0 0-1.4 1.4V21H5a2 2 0 0 1-2-2v-8a1.6 1.6 0 0 1 .6-1.3z"/></svg>`,
    file: ui('<rect x="4.5" y="3" width="15" height="18" rx="3"/><circle cx="12" cy="9.5" r="2.4"/><path d="M8 16.5c.8-1.8 2.2-2.7 4-2.7s3.2.9 4 2.7"/>'),
    fileF: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M7.5 2h9A3.5 3.5 0 0 1 20 5.5v13a3.5 3.5 0 0 1-3.5 3.5h-9A3.5 3.5 0 0 1 4 18.5v-13A3.5 3.5 0 0 1 7.5 2zM12 12.3a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6zM7.4 17h9.2c-.9-2-2.6-3-4.6-3s-3.7 1-4.6 3z"/></svg>`,
    diary: ui('<rect x="4.5" y="4" width="15" height="17" rx="3"/><path d="M9 4V3h6v1M8.5 10h7M8.5 14h7M8.5 18h4"/>'),
    diaryF: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M9 2.2h6a1 1 0 0 1 1 .8H17a3 3 0 0 1 3 3V19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h1a1 1 0 0 1 1-.8zM8.5 10.6h7a.8.8 0 0 0 0-1.6h-7a.8.8 0 0 0 0 1.6zm0 4h7a.8.8 0 0 0 0-1.6h-7a.8.8 0 0 0 0 1.6zm0 4h4a.8.8 0 0 0 0-1.6h-4a.8.8 0 0 0 0 1.6z"/></svg>`,
    bookF: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11.2 6.1C9.4 4.8 6.9 4.3 3.9 4.4a.9.9 0 0 0-.9.9v13a.9.9 0 0 0 .9.9c3.1-.1 5.4.4 7.3 1.5zm1.6 0c1.8-1.3 4.3-1.8 7.3-1.7a.9.9 0 0 1 .9.9v13a.9.9 0 0 1-.9.9c-3.1-.1-5.4.4-7.3 1.5z"/></svg>`,
    more: ui('<circle cx="12" cy="12" r="8.6"/><circle cx="8" cy="12" r=".8" fill="currentColor"/><circle cx="12" cy="12" r=".8" fill="currentColor"/><circle cx="16" cy="12" r=".8" fill="currentColor"/>'),
    moreF: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M12 2.6a9.4 9.4 0 1 1 0 18.8 9.4 9.4 0 0 1 0-18.8zM8 13.2a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm4 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4zm4 0a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z"/></svg>`,
    install: ui('<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M12 8v7.5M8.8 12.5L12 15.7l3.2-3.2"/>'),
    share: ui('<path d="M8.5 9H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1.5M12 14.5V3M8.5 6.3L12 2.8l3.5 3.5"/>'),
    addSquare: ui('<rect x="4" y="4" width="16" height="16" rx="4.5"/><path d="M12 8.5v7M8.5 12h7"/>'),
    refresh: ui('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v3.8h-3.8"/>'),
    appearance: ui('<circle cx="12" cy="12" r="8.6"/><path d="M12 3.4v17.2a8.6 8.6 0 0 0 0-17.2z" fill="currentColor" stroke="none"/>'),
    info: ui('<circle cx="12" cy="12" r="8.6"/><path d="M12 11v5.2"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>'),
    wifiOff: ui('<path d="M3.5 3.5l17 17M8.6 12.6a5 5 0 0 1 3.4-1.2M5.3 9.4A9.5 9.5 0 0 1 9 7.3M15.6 7.6a9.5 9.5 0 0 1 3.1 1.8M12 17.6h.01"/>'),
    sparkle: ui('<path d="M12 3.5l1.7 5.1 5.1 1.7-5.1 1.7L12 17.1l-1.7-5.1-5.1-1.7 5.1-1.7zM18.5 15.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>'),
    sunset: ui('<path d="M4 18.5h16M7.5 18.5a4.5 4.5 0 0 1 9 0M12 7v3M5.6 10.6l1.6 1.6M18.4 10.6l-1.6 1.6M9.5 4.5L12 2l2.5 2.5"/>'),
    stars: ui('<path d="M17.5 15.4A7.6 7.6 0 1 1 8.6 6.5a6 6 0 0 0 8.9 8.9z"/><path d="M17 3.5l.6 1.6 1.6.6-1.6.6-.6 1.6-.6-1.6-1.6-.6 1.6-.6z" fill="currentColor"/>'),
    water: ui('<path d="M2.5 15c2.4 0 2.4-1.8 4.8-1.8s2.4 1.8 4.7 1.8 2.4-1.8 4.8-1.8 2.4 1.8 4.7 1.8M2.5 19.5c2.4 0 2.4-1.8 4.8-1.8s2.4 1.8 4.7 1.8 2.4-1.8 4.8-1.8 2.4 1.8 4.7 1.8M12 3.5s3.6 4 3.6 6.4a3.6 3.6 0 0 1-7.2 0C8.4 7.5 12 3.5 12 3.5z"/>'),
    stairs: ui('<path d="M3.5 20h5v-4.5h4.5V11h4.5V6.5h3"/>'),
    school: ui('<path d="M2.5 9.2L12 4.5l9.5 4.7-9.5 4.7z"/><path d="M6.2 11.2v4.6c3.4 2.4 8.2 2.4 11.6 0v-4.6M21.5 9.2v5"/>'),
    screen: ui('<rect x="3" y="4" width="18" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M12 16.5v4"/>'),
    woman: ui('<circle cx="12" cy="8.6" r="4.4"/><path d="M12 13v8M8.8 17.8h6.4"/>'),
    heart: ui('<path d="M12 20s-7.8-4.6-7.8-10.3A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.8 2.5C19.8 15.4 12 20 12 20z"/>'),
    people: ui('<circle cx="8.6" cy="8.4" r="3.1"/><circle cx="16.8" cy="9.2" r="2.5"/><path d="M2.8 19.5a5.8 5.8 0 0 1 11.6 0M15 14.6a4.6 4.6 0 0 1 6.2 4.9"/>'),
    sun: ui('<circle cx="12" cy="12" r="3.8"/><path d="M12 2.8v1.8M12 19.4v1.8M2.8 12h1.8M19.4 12h1.8M5.5 5.5l1.3 1.3M17.2 17.2l1.3 1.3M5.5 18.5l1.3-1.3M17.2 6.8l1.3-1.3"/>'),
    sunMax: ui('<circle cx="12" cy="12" r="4.6"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/>', 'stroke-width="2.1"'),
    edit: ui('<path d="M14.8 5.2l4 4M4.5 19.5l1-4.4L16.2 4.4a1.6 1.6 0 0 1 2.3 0l1.1 1.1a1.6 1.6 0 0 1 0 2.3L8.9 18.5z"/>'),
    ecg: ui('<path d="M2.5 13h4l2-5 3.5 10 3-12 2.5 7h4"/>'),
    grid: ui('<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>'),
    gear: ui('<circle cx="12" cy="12" r="3"/><path d="M12 2.8l1.6 2.4 2.8-.6.6 2.8 2.4 1.6-1.2 2.6 1.2 2.6-2.4 1.6-.6 2.8-2.8-.6L12 21.2l-1.6-2.4-2.8.6-.6-2.8-2.4-1.6 1.2-2.6-1.2-2.6 2.4-1.6.6-2.8 2.8.6z"/>'),
    chart: ui('<path d="M4 20h16M7 16.5V11M12 16.5V6.5M17 16.5v-3.5"/>'),
    shield: ui('<path d="M12 3l7.5 2.8v5.5c0 4.6-3.1 8.2-7.5 9.7-4.4-1.5-7.5-5.1-7.5-9.7V5.8z"/><path d="M8.8 12l2.3 2.3 4.2-4.6"/>'),

    // ---- crisis pictograms ----
    p_convulsive: pic(`${lying(80)}<path d="M40 50l6-8 6 8 6-8 6 8 6-8 6 8" /><path d="M20 52l4-6M104 56l-4-6M98 40l-3-6M22 38l3-5"/>`),
    p_nonconvulsive: pic(`<circle cx="60" cy="30" r="12"/><path d="M60 42v34M60 76l-12 28M60 76l12 28M60 52l-16 14M60 52l16 14"/><path d="M84 18c6 0 10 4 10 9s-4 7-8 7-6-3-6-6 3-4 5-3" stroke-dasharray="3 6"/>`),
    p_calm: pic(`<circle cx="60" cy="66" r="36"/><path d="M60 66V44M60 66l14 8M50 20h20M60 20v10"/><path d="M98 40l8-6M102 52h10"/>`),
    p_space: pic(`<rect x="16" y="76" width="88" height="22" rx="11"/><circle cx="60" cy="60" r="16"/><path d="M8 40l10 8M8 48l10-8"/><path d="M98 30h14v14H98z"/><path d="M84 37h8M88 33l4 4-4 4"/><path d="M36 37h-8M32 33l-4 4 4 4"/><path d="M12 30l0 0"/>`),
    p_clothes: pic(`<path d="M30 28l20-8 10 16 10-16 20 8 12 30-16 5v37H34V63l-16-5z"/><path d="M50 20l10 30 10-30"/><circle cx="60" cy="64" r="2.5"/><circle cx="60" cy="80" r="2.5"/>`),
    p_side: pic(`<circle cx="30" cy="60" r="11"/><path d="M42 66c18-6 34-6 52 2M52 66v18M70 66c4 8 12 12 22 14"/><path d="M12 92h96"/><path d="M24 76c-2 4-2 8 0 10" stroke-dasharray="2 5"/>`),
    p_donts: pic(`<circle cx="60" cy="56" r="26"/><path d="M50 66q10 6 20 0"/><circle cx="51" cy="50" r="2.5"/><circle cx="69" cy="50" r="2.5"/><path d="M68 72l26 26" stroke-width="7"/>${slash}`),
    p_watch: pic(`<path d="M10 60c14-22 32-32 50-32s36 10 50 32c-14 22-32 32-50 32S24 82 10 60z"/><circle cx="60" cy="60" r="14"/><circle cx="60" cy="60" r="4" fill="currentColor"/>`),
    p_hold: pic(`<circle cx="40" cy="30" r="11"/><circle cx="82" cy="34" r="11"/><path d="M40 41v34M82 45v30M40 52l20 10 22-8M40 75l-8 30M40 75l8 30M82 75l-6 30M82 75l8 30"/>`),
    p_guide: pic(`<circle cx="42" cy="28" r="10"/><path d="M42 38v32M42 70l-10 28M42 70l10 28M42 48l-14 12M42 48l14 10"/><path d="M78 60h28M98 52l8 8-8 8"/><path d="M70 104h14V92h12V80h12" opacity=".6"/>`),
    p_talk: pic(`<path d="M18 26h70a10 10 0 0 1 10 10v30a10 10 0 0 1-10 10H50L32 92V76H18A10 10 0 0 1 8 66V36a10 10 0 0 1 10-10z"/><path d="M30 51c6-6 10 6 16 0s10 6 16 0 10 6 16 0"/>`),
    p_rec1: pic(`${lying(84)}<path d="M50 74l-6-30 14-4"/><path d="M62 70h14"/>`),
    p_rec2: pic(`${lying(84)}<path d="M80 78l-8-24 14-6"/><path d="M36 82q-6-8 2-14"/>`),
    p_rec3: pic(`${lying(84)}<path d="M84 44a28 28 0 0 0-40-6"/><path d="M40 30l4 8 8-2"/>`),
    p_rec4: pic(`<circle cx="44" cy="62" r="18"/><path d="M58 74q14 8 18 26"/><path d="M30 44q-6-14 6-22M36 22l2 8-8 2"/><path d="M50 78l8 4"/><path d="M84 52c6 0 10 2 14 6M86 42c8 0 14 4 18 10" opacity=".7"/>`),
    p_breathe: pic(`<path d="M60 18v34M60 52c-6 6-12 6-16 4M60 52c6 6 12 6 16 4"/><path d="M44 36c-16 4-26 22-26 44 0 12 6 18 14 16 10-2 16-10 16-24V40"/><path d="M76 36c16 4 26 22 26 44 0 12-6 18-14 16-10-2-16-10-16-24V40"/>`),
    p_stay: pic(`<circle cx="36" cy="40" r="11"/><path d="M36 51v26l-8 22M36 77l14 20M36 60l22 8"/>${lying(102)}<path d="M80 26c0-6 8-8 10-2 2-6 10-4 10 2 0 7-10 12-10 12s-10-5-10-12z"/>`),
    p_nofood: pic(`<path d="M38 40h44l-6 52H44z"/><path d="M40 56h40"/><path d="M58 22c0-6 6-6 6-12" opacity=".7"/>${slash}`),
    p_doctor: pic(`<circle cx="60" cy="32" r="14"/><path d="M30 104c0-22 12-38 30-38s30 16 30 38"/><path d="M48 70v14a8 8 0 0 0 16 0M76 70v10"/><circle cx="76" cy="86" r="6"/>`),
    p_ambulance: pic(`<path d="M10 40h62v44H10zM72 56h22l14 16v12H72z"/><circle cx="32" cy="88" r="9"/><circle cx="88" cy="88" r="9"/><path d="M41 52v20M31 62h20"/>`),
    p_diary: pic(`<rect x="24" y="14" width="72" height="92" rx="8"/><path d="M40 38h40M40 56h40M40 74h24"/><path d="M70 82l8 8 16-18"/>`),
    p_shield: pic(`<path d="M60 12l40 14v30c0 26-18 44-40 52-22-8-40-26-40-52V26z"/><path d="M42 60l12 12 24-26"/>`)
  };
})();

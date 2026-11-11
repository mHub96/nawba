// Hand-drawn icon set for نوبة. UI icons use a 24-unit grid; pictograms (crisis steps) use 120 units
// with a heavier stroke so they read at a glance for families who do not read.
(function () {
  const ui = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
  const pic = (d) => `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  // reusable figure parts (120 grid)
  const lying = (y = 84) => `<circle cx="26" cy="${y - 8}" r="10"/><path d="M38 ${y - 6} Q62 ${y - 14} 96 ${y - 6}"/><path d="M14 ${y + 10} H106"/>`;
  const slash = `<circle cx="60" cy="60" r="50" stroke-width="5"/><path d="M25 25 L95 95" stroke-width="6"/>`;

  window.ICONS = {
    // ---- brand: an EEG spike train settling into a calm flat line ----
    logo: `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="2" y="2" width="44" height="44" rx="13" fill="var(--tigris)"/><path d="M8 25h7l3-9 4 18 4-24 3 15h11" fill="none" stroke="var(--on-tigris)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`,

    // ---- UI ----
    speaker: ui('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>'),
    mute: ui('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>'),
    close: ui('<path d="M6 6l12 12M18 6L6 18"/>'),
    phone: ui('<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>'),
    camera: ui('<rect x="3" y="7" width="13" height="11" rx="2"/><path d="M16 11l5-3v9l-5-3"/>'),
    user: ui('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    book: ui('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>'),
    list: ui('<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>'),
    plus: ui('<path d="M12 5v14M5 12h14"/>'),
    check: ui('<path d="M5 12.5l4.5 4.5L19 7"/>', 'stroke-width="3"'),
    back: ui('<path d="M9 6l6 6-6 6"/>'),   // points "back" in RTL
    next: ui('<path d="M15 6l-6 6 6 6"/>'),
    logout: ui('<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>'),
    bolt: ui('<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>'),
    clock: ui('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6"/>'),
    yes: ui('<path d="M5 12.5l4.5 4.5L19 7"/>', 'stroke-width="3"'),
    no: ui('<path d="M6 6l12 12M18 6L6 18"/>', 'stroke-width="3"'),
    pill: ui('<rect x="3" y="8" width="18" height="8" rx="4" transform="rotate(-35 12 12)"/><path d="M9.5 8.5l5 7"/>'),
    brain: ui('<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>'),
    aid: ui('<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M9 6V4h6v2M12 10v6M9 13h6"/>'),
    side: ui('<circle cx="5" cy="14" r="2.5"/><path d="M8 15c4-2 8-2 13 0M2 19h20"/>'),
    moon: ui('<path d="M20 15A8 8 0 1 1 9 4a6.5 6.5 0 0 0 11 11z"/>'),
    home: ui('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9z"/>'),
    water: ui('<path d="M2 15c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M2 20c2.5 0 2.5-2 5-2s2.5 2 5 2 2.5-2 5-2 2.5 2 5 2M12 3s4 4.5 4 7a4 4 0 0 1-8 0c0-2.5 4-7 4-7z"/>'),
    stairs: ui('<path d="M3 20h5v-5h5v-5h5V5h3"/>'),
    school: ui('<path d="M2 9l10-5 10 5-10 5-10-5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>'),
    screen: ui('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M10 8l2 2 2-2"/>'),
    woman: ui('<circle cx="12" cy="8" r="4"/><path d="M12 12v9M8 17h8"/>'),
    heart: ui('<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>'),
    people: ui('<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20a6 6 0 0 1 12 0M14 20a4.5 4.5 0 0 1 8 0"/>'),
    sun: ui('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>'),
    edit: ui('<path d="M4 20h4L19 9l-4-4L4 16v4z"/>'),

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

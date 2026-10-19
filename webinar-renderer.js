/* Canvas-only rendering. Kept independent of the form so every layout is testable. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WebinarRenderer = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const clean = value => String(value || '').trim();
  const COPY = {
    en: { speakers: 'Our speakers', register: 'Register now', series: 'Register for the series', speaking: 'I am speaking at', moderator: 'Moderator' },
    ko: { speakers: '발표자', register: '지금 등록하기', series: '시리즈 등록하기', speaking: '발표자로 참여합니다', moderator: '진행자' },
    'zh-Hans': { speakers: '演讲嘉宾', register: '立即注册', series: '注册系列活动', speaking: '我将在本次活动演讲', moderator: '主持人' },
    'zh-Hant': { speakers: '演講嘉賓', register: '立即註冊', series: '註冊系列活動', speaking: '我將在本次活動演講', moderator: '主持人' },
    th: { speakers: 'วิทยากร', register: 'ลงทะเบียนเลย', series: 'ลงทะเบียนซีรีส์', speaking: 'ร่วมเป็นวิทยากร', moderator: 'ผู้ดำเนินรายการ' },
    ja: { speakers: '登壇者', register: '今すぐ登録', series: 'シリーズに登録', speaking: '登壇します', moderator: 'モデレーター' },
  };
  const ZONES = [
    ['Asia/Kolkata', 'India · IST'], ['Asia/Singapore', 'Singapore · SGT'],
    ['Australia/Sydney', 'Sydney · AEST / AEDT'], ['Asia/Seoul', 'Korea · KST'],
    ['Asia/Tokyo', 'Japan · JST'], ['Asia/Shanghai', 'China · CST'],
    ['Asia/Hong_Kong', 'Hong Kong · HKT'], ['Asia/Bangkok', 'Thailand · ICT'],
    ['Asia/Jakarta', 'Jakarta · WIB'], ['Asia/Taipei', 'Taiwan · CST'],
    ['Pacific/Auckland', 'New Zealand · NZST / NZDT'], ['UTC', 'UTC'],
    ['Europe/London', 'London · GMT / BST'], ['America/New_York', 'New York · EST / EDT'],
    ['America/Los_Angeles', 'Los Angeles · PST / PDT'],
  ];
  function dateParts(instant, zone) {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(instant);
    return Object.fromEntries(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
  }
  function localInstant(date, time, zone) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
    const desired = Date.parse(`${date}T${time}:00Z`);
    if (!Number.isFinite(desired)) return null;
    let candidate = desired;
    for (let i = 0; i < 4; i++) {
      const p = dateParts(new Date(candidate), zone);
      const actual = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
      const delta = desired - actual;
      if (!delta) return new Date(candidate);
      candidate += delta;
    }
    return null; // A nonexistent local time at the daylight-saving change.
  }
  function zoneLabel(zone, instant) {
    const fixed = { 'Asia/Kolkata': 'IST', 'Asia/Singapore': 'SGT', 'Asia/Seoul': 'KST', 'Asia/Tokyo': 'JST', 'Asia/Shanghai': 'CST', 'Asia/Taipei': 'CST', 'Asia/Hong_Kong': 'HKT', 'Asia/Bangkok': 'ICT', 'Asia/Jakarta': 'WIB', UTC: 'UTC' };
    if (fixed[zone]) return fixed[zone];
    const offset = new Intl.DateTimeFormat('en', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(instant).find(p => p.type === 'timeZoneName').value;
    const names = { 'Australia/Sydney': { 'GMT+10': 'AEST', 'GMT+11': 'AEDT' }, 'Pacific/Auckland': { 'GMT+12': 'NZST', 'GMT+13': 'NZDT' }, 'Europe/London': { GMT: 'GMT', 'GMT+1': 'BST' }, 'America/New_York': { 'GMT-5': 'EST', 'GMT-4': 'EDT' }, 'America/Los_Angeles': { 'GMT-8': 'PST', 'GMT-7': 'PDT' } };
    return names[zone]?.[offset] || offset;
  }
  function sessionTimes(session, extraZones = [], locale = 'en') {
    if (!session.start) return '';
    const source = session.zone || 'UTC';
    const zones = [...new Set([source, ...extraZones.filter(Boolean)])].slice(0, 3);
    const instant = session.date ? localInstant(session.date, session.start, source) : null;
    const end = session.date && session.end ? localInstant(session.date, session.end, source) : null;
    if (session.date && !instant) return '';
    const clock = (d, zone) => new Intl.DateTimeFormat(locale, { timeZone: zone, hour: 'numeric', minute: '2-digit', hour12: true }).format(d).replace(/:00\b/, '');
    if (!instant) {
      const d = new Date(`2000-01-01T${session.start}:00Z`);
      const e = session.end ? new Date(`2000-01-01T${session.end}:00Z`) : null;
      return `${clock(d, 'UTC')}${e ? `–${clock(e, 'UTC')}` : ''} (${source})`;
    }
    return zones.map(zone => {
      const p = dateParts(instant, zone);
      const localDate = `${p.year}-${p.month}-${p.day}`;
      const shift = Math.round((Date.parse(`${localDate}T00:00Z`) - Date.parse(`${session.date}T00:00Z`)) / 86400000);
      return `${clock(instant, zone)}${end ? `–${clock(end, zone)}` : ''} ${zoneLabel(zone, instant)}${shift ? ` (${shift > 0 ? '+' : ''}${shift}d)` : ''}`;
    }).join('  /  ');
  }
  function displayDate(date, locale = 'en', compact = false) {
    if (!date) return '';
    return new Intl.DateTimeFormat(locale, { day: 'numeric', month: compact ? 'short' : 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
  }
  function selectData(data, view = { type: 'overview' }) {
    const sessions = data.mode === 'webinar' ? data.sessions.slice(0, 1) : data.sessions.slice(0, 3);
    const selected = view.type === 'overview' ? sessions : sessions.filter(s => s.id === view.sessionId);
    const ids = new Set(selected.flatMap(s => s.speakerIds || []));
    const speakers = data.speakers.filter(s => ids.has(s.id) && (view.type !== 'speaker' || s.id === view.speakerId) && (s.photo || clean(s.name) || (data.speakerDetail === 'full' && (clean(s.title) || clean(s.organisation))) || s.role === 'moderator'));
    return { sessions: selected, speakers, view };
  }
  function validate(data, view) {
    const result = selectData(data, view);
    const errors = [];
    if (!clean(data.title) && !result.sessions.some(s => clean(s.title))) errors.push('Add a programme or session title before downloading.');
    if (!result.sessions.length) errors.push('Choose a session.');
    result.sessions.forEach((s, i) => {
      if (s.end && !s.start) errors.push(`Session ${i + 1}: add a start time or clear the end time.`);
      if (s.end && s.end <= s.start) errors.push(`Session ${i + 1}: end time must be later than start time (same day).`);
      if (s.start && s.date && !localInstant(s.date, s.start, s.zone || 'UTC')) errors.push(`Session ${i + 1}: this local time does not exist; choose a time outside the daylight-saving change.`);
      if (s.end && s.date && !localInstant(s.date, s.end, s.zone || 'UTC')) errors.push(`Session ${i + 1}: the end time does not exist on this date; choose a valid local time.`);
      if (s.start && !s.date && data.extraZones.some(Boolean)) errors.push(`Session ${i + 1}: a date is needed to convert time zones. Add a date or remove the extra time zones.`);
    });
    if (view?.type === 'speaker' && !result.speakers.length) errors.push('Assign a speaker with a name, photo or visible profile details to this session.');
    return errors;
  }
  function wrap(ctx, text, width, locale) {
    const output = [];
    for (const paragraph of clean(text).split('\n')) {
      if (!paragraph) { output.push(''); continue; }
      const tokens = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter(locale, { granularity: 'word' }).segment(paragraph)].map(p => p.segment) : paragraph.split(/(\s+)/);
      let line = '';
      for (const token of tokens) {
        if (ctx.measureText(line + token).width <= width) { line += token; continue; }
        if (line.trim()) { output.push(line.trim()); line = ''; }
        if (ctx.measureText(token).width <= width) { line = token.trimStart(); continue; }
        const chars = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter(locale, { granularity: 'grapheme' }).segment(token)].map(p => p.segment) : [...token];
        for (const char of chars) {
          if (line && ctx.measureText(line + char).width > width) { output.push(line); line = ''; }
          line += char;
        }
      }
      if (line.trim()) output.push(line.trim());
    }
    return output;
  }
  function render({ ctx, width, height, data, assets = {}, view = { type: 'overview' }, language = {} }) {
    const locale = language.locale || 'en';
    const family = language.fontFamily || 'Inter, Arial, sans-serif';
    const copy = COPY[data.language] || COPY.en;
    const selected = selectData(data, view);
    const errors = validate(data, view);
    const notices = [];
    const H = height / width * 1080;
    const landscape = H < 700;
    const story = H > 1600;
    const dark = data.theme.startsWith('dark');
    const ink = dark ? '#FFFFFF' : '#04070B';
    const muted = dark ? '#BAC4CF' : '#455667';
    const lineColor = dark ? '#3B4651' : '#BAC5D0';
    const margin = landscape ? 44 : 60;
    const right = 1080 - margin;
    const W = right - margin;
    const top = story ? 150 : landscape ? 28 : 48;
    const bottom = H - (story ? 155 : landscape ? 30 : 42);
    const sessions = selected.sessions;
    const speakers = selected.speakers;
    const rich = data.speakerDetail === 'full';
    let speakerLayout = data.speakerLayout;
    if (speakerLayout === 'auto') speakerLayout = speakers.length > 1 && rich && !landscape ? 'column' : 'row';
    if (data.theme === 'dark-hero' && speakerLayout === 'column') { speakerLayout = 'row'; notices.push('Hero artwork uses a speaker row to keep the artwork clear.'); }
    if (landscape && speakers.length && sessions.length > 1) {
      notices.push('Landscape is best for one session. Use square or portrait for the complete series.');
    }
    const sidebar = speakers.length && speakerLayout === 'column';
    const sidebarW = landscape ? 340 : 370;
    const mainW = sidebar ? W - sidebarW - 36 : W;
    let topicLayout = data.topicLayout;
    if (topicLayout === 'columns' && mainW / sessions.length < 250) { topicLayout = 'rows'; notices.push('Topics stacked to preserve readable text at this width.'); }
    ctx.save();
    ctx.setTransform(width / 1080, 0, 0, width / 1080, 0, 0);
    ctx.fillStyle = dark ? '#070B10' : '#EDF2F7';
    ctx.fillRect(0, 0, 1080, H);
    const artKey = data.theme === 'dark-hero' ? 'hero' : data.theme === 'light-angular' ? 'angular' : dark ? 'darkGlow' : 'lightGlow';
    const art = assets[artKey];
    if (art) {
      const artW = data.theme === 'dark-hero' ? 440 : data.theme === 'light-angular' ? 430 : 490;
      const artH = artW / art.width * art.height;
      ctx.globalAlpha = data.theme === 'light-soft' ? 0.48 : 1;
      ctx.drawImage(art, 1080 - artW, 0, artW, artH);
      ctx.globalAlpha = 1;
      // Blend only the crop edges into the base; preserve the supplied artwork.
      const base = dark ? '7,11,16' : '237,242,247';
      const edge = ctx.createLinearGradient(1080 - artW, 0, 1080 - artW + 90, 0);
      edge.addColorStop(0, `rgba(${base},1)`); edge.addColorStop(1, `rgba(${base},0)`);
      ctx.fillStyle = edge; ctx.fillRect(1080 - artW, 0, 92, artH);
      const foot = ctx.createLinearGradient(0, artH - 100, 0, artH);
      foot.addColorStop(0, `rgba(${base},0)`); foot.addColorStop(1, `rgba(${base},1)`);
      ctx.fillStyle = foot; ctx.fillRect(1080 - artW, artH - 100, artW, 101);
    }
    if (data.theme === 'light-soft') {
      const g = ctx.createLinearGradient(0, 0, 1080, 0); g.addColorStop(0, '#FF0087'); g.addColorStop(1, '#FF9800');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1080, 11);
    }
    const logo = dark ? assets.whiteLogo : assets.blackLogo;
    if (logo) ctx.drawImage(logo, margin, top, landscape ? 148 : 180, (landscape ? 148 : 180) * logo.height / logo.width);
    const setFont = (size, weight) => { ctx.font = `${Math.round(weight / 100) * 100} ${size}px ${family}`; };
    function measure(text, w, size, weight = 450) { setFont(size, weight); return wrap(ctx, text, w, locale); }
    function text(text, x, y, w, size, options = {}) {
      if (!clean(text)) return y;
      const { weight = 450, color = ink, maxLines = 8, minSize = size, label = 'Text', align = 'left' } = options;
      let s = size, lines;
      do { lines = measure(text, w, s, weight); if (lines.length <= maxLines || s <= minSize) break; s -= 1; } while (true);
      if (lines.length > maxLines) errors.push(`${label} is too long for this layout. Shorten it or choose a larger format / different layout.`);
      ctx.fillStyle = color; ctx.textBaseline = 'top'; ctx.textAlign = align;
      lines.slice(0, maxLines).forEach((line, i) => ctx.fillText(line, align === 'center' ? x + w / 2 : x, y + i * s * 1.2));
      ctx.textAlign = 'left';
      return y + Math.min(lines.length, maxLines) * s * 1.2;
    }
    const hero = data.theme === 'dark-hero';
    const headerY = top + (landscape ? 78 : 114);
    const headerW = hero ? Math.min(mainW, 570) : mainW;
    let y = headerY;
    y = text(view.type === 'speaker' ? copy.speaking : data.eyebrow, margin, y, headerW, landscape ? 15 : 19, { weight: 650, color: muted, maxLines: 2, label: 'Eyebrow' });
    if (y > headerY) y += landscape ? 12 : 26;
    y = text(data.title, margin, y, headerW, landscape ? 36 : sidebar ? 45 : 57, { weight: 650, minSize: landscape ? 28 : 40, maxLines: 3, label: 'Programme title' });
    if (clean(data.title)) y += landscape ? 12 : 24;
    y = text(data.tagline, margin, y, headerW, landscape ? 21 : 30, { weight: 600, maxLines: 2, label: 'Tagline' });
    if (clean(data.tagline)) y += landscape ? 7 : 13;
    y = text(data.description, margin, y, headerW, landscape ? 16 : 22, { color: muted, maxLines: 2, label: 'Description' });
    y += landscape ? 16 : 24;
    const headerBottom = y;
    const cta = data.cta === 'none' ? '' : data.cta === 'custom' ? clean(data.ctaText) : (sessions.length > 1 ? copy.series : copy.register);
    const footerH = cta || clean(data.ctaNote) ? (landscape ? 44 : 60) : 0;
    const footerY = bottom - footerH;
    const compactRow = !rich && !sidebar && speakerLayout === 'row';
    const speakerFont = landscape || (compactRow && speakers.length > 3) ? 17 : 21;
    const photoSize = landscape ? 58 : 76;
    const photoCount = speakers.filter(s => s.photo).length;
    let speakerH = 0;
    if (speakers.length && !sidebar) {
      if (speakerLayout === 'grid' && speakers.length > 1) speakerH = (landscape ? 2 : Math.ceil(speakers.length / 2)) * (rich ? 130 : 94) + 20;
      else if (compactRow) speakerH = Math.max(photoCount ? (landscape ? 48 : 64) : 0, speakerFont * 2.4 + (speakers.some(s => s.role === 'moderator') ? 24 : 0)) + 12;
      else speakerH = (photoCount ? photoSize + 12 : 0) + speakerFont * 2.4 + (rich ? (landscape ? 56 : 80) : 0) + 22;
    }
    const speakerY = footerY - (speakerH ? speakerH + 20 : 0);
    const agendaBottom = sidebar ? footerY - 24 : speakerY - 18;
    const available = agendaBottom - headerBottom;
    const times = sessions.map(s => sessionTimes(s, data.extraZones, locale));
    const sharedTime = times.length && times.every(t => t === times[0]) ? times[0] : '';
    const sharedTimeH = sharedTime ? (landscape ? 29 : 38) * (sharedTime.length > 76 ? 2 : 1) : 0;
    const agendaH = available - sharedTimeH;
    let agendaEnd = headerBottom;
    const colGap = 28;
    const rowH = topicLayout === 'columns' ? agendaH : Math.min(landscape ? 130 : 160, agendaH / Math.max(1, sessions.length));
    if (rowH < (landscape ? 66 : 84) && sessions.some(s => s.title || s.subtitle || s.date)) errors.push('This combination is too dense. Choose portrait / story, compact speaker details, or an individual session card.');
    sessions.forEach((session, i) => {
      const columns = topicLayout === 'columns' && sessions.length > 1;
      const cellW = columns ? (mainW - colGap * (sessions.length - 1)) / sessions.length : mainW;
      const x = margin + (columns ? i * (cellW + colGap) : 0);
      const sy = headerBottom + (columns ? 0 : i * rowH);
      ctx.strokeStyle = lineColor; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x, sy); ctx.lineTo(x + cellW, sy); ctx.stroke();
      const date = displayDate(session.date, locale, true);
      let ty = sy + 14;
      const dateW = columns ? 0 : Math.min(150, cellW * .27);
      const tx = columns || !date ? x : x + dateW;
      const tw = cellW - (tx - x);
      if (date) {
        if (columns) { ty = text(date, x, ty, cellW, landscape ? 17 : 22, { weight: 650, maxLines: 2, label: `Session ${i + 1} date` }) + 16; }
        else text(date, x, ty, dateW - 16, landscape ? 17 : 23, { weight: 600, maxLines: 2, label: `Session ${i + 1} date` });
      }
      const f = landscape ? 20 : sidebar || columns ? 23 : 26;
      ty = text(session.title, tx, ty, tw, f, { weight: 600, maxLines: 2, label: `Session ${i + 1} title` });
      if (clean(session.title) && clean(session.subtitle)) ty += 4;
      ty = text(session.subtitle, tx, ty, tw, landscape ? 16 : 21, { color: muted, maxLines: 2, label: `Session ${i + 1} subtitle` });
      if (!sharedTime && times[i]) ty = text(times[i], tx, ty + 9, tw, landscape ? 15 : 18, { weight: 550, maxLines: 3, label: `Session ${i + 1} times` });
      const limit = columns ? headerBottom + agendaH : sy + rowH;
      if (ty > limit - 5) errors.push(`Session ${i + 1} does not fit. Use columns, fewer details, portrait / story, or an individual session card.`);
      agendaEnd = Math.max(agendaEnd, ty);
    });
    if (sharedTime) agendaEnd = text(sharedTime, margin, Math.max(headerBottom + (topicLayout === 'columns' ? Math.min(agendaH, agendaEnd - headerBottom) : rowH * sessions.length) + 10, agendaEnd + 12), mainW, landscape ? 16 : 22, { weight: 600, maxLines: 2, label: 'Time-zone line' });
    if (agendaEnd > agendaBottom + 5) errors.push('The agenda extends into the speaker / footer area. Use a taller format or less text.');
    function portrait(speaker, x, py, size) {
      if (!speaker.photo) return;
      const img = speaker.photo;
      const zoom = Math.max(1, Number(speaker.zoom) || 1);
      const scale = Math.max(size / img.width, size / img.height) * zoom;
      const iw = img.width * scale, ih = img.height * scale;
      const ox = (iw - size) / 2, oy = (ih - size) / 2;
      ctx.save(); ctx.beginPath(); ctx.arc(x + size / 2, py + size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, x - ox - ox * (Number(speaker.x) || 0), py - oy - oy * (Number(speaker.y) || 0), iw, ih); ctx.restore();
    }
    let speakerEnd = 0;
    if (speakers.length) {
      const sx = sidebar ? right - sidebarW : margin;
      const sw = sidebar ? sidebarW : W;
      let sy = sidebar ? headerY : speakerY;
      if (sidebar) sy = text(copy.speakers, sx, sy, sw, 18, { weight: 600, color: muted, maxLines: 1 }) + 28;
      speakers.forEach((speaker, i) => {
        let x, py, w, ps = photoSize;
        if (sidebar) { x = sx; py = sy + i * ((footerY - sy - 15) / speakers.length); w = sw; ps = landscape ? 58 : 80; }
        else if (speakerLayout === 'grid' && speakers.length > 1) { x = sx + (i % 2) * ((sw + 24) / 2); py = sy + Math.floor(i / 2) * (rich ? 130 : 94); w = (sw - 24) / 2; }
        else { w = (sw - 24 * (speakers.length - 1)) / speakers.length; x = sx + i * (w + 24); py = sy; }
        const beside = sidebar || speakerLayout === 'grid' || compactRow;
        if (compactRow) ps = landscape ? 48 : 64;
        if (speaker.photo) portrait(speaker, x + (beside ? 0 : (w - ps) / 2), py, ps);
        const tx = x + (beside && speaker.photo ? ps + (compactRow ? 12 : 18) : 0);
        const tw = w - (tx - x);
        let ty = py + (!beside && photoCount ? ps + 12 : 0);
        const opts = { align: beside ? 'left' : 'center', maxLines: 2 };
        ty = text(speaker.name, tx, ty, tw, speakerFont, { ...opts, weight: 650, label: `Speaker ${i + 1} name` });
        if (rich) {
          if (speaker.name) ty += 6;
          ty = text(speaker.title, tx, ty, tw, landscape ? 14 : 18, { ...opts, maxLines: 3, color: muted, label: `Speaker ${i + 1} title` });
          ty = text(speaker.organisation, tx, ty + (speaker.title && speaker.organisation ? 3 : 0), tw, landscape ? 14 : 18, { ...opts, color: muted, label: `Speaker ${i + 1} organisation` });
        }
        if (speaker.role === 'moderator') ty = text(copy.moderator, tx, ty + 4, tw, 15, { ...opts, color: muted, label: 'Moderator label' });
        speakerEnd = Math.max(speakerEnd, ty, speaker.photo ? py + ps : py);
        if (sidebar && ty > sy + (i + 1) * ((footerY - sy - 15) / speakers.length)) errors.push(`Speaker ${i + 1} details exceed their space. Use compact names or fewer speakers.`);
      });
    }
    if (speakers.length && speakerEnd > footerY - 8) errors.push('Speaker details overlap the footer. Choose compact names, a vertical / grid layout, or a taller format.');
    if (cta) {
      setFont(landscape ? 17 : 21, 600);
      const ctaW = Math.min(W, Math.max(180, ctx.measureText(cta).width + 44));
      const ctaH = landscape ? 40 : 54;
      if (ctx.measureText(cta).width > W - 44) errors.push('CTA is too long. Use a shorter call to action.');
      ctx.fillStyle = dark ? '#FFFFFF' : '#04070B';
      ctx.beginPath(); ctx.roundRect(margin, footerY, ctaW, ctaH, ctaH / 2); ctx.fill();
      text(cta, margin + 22, footerY + (landscape ? 10 : 14), ctaW - 44, landscape ? 17 : 21, { weight: 600, color: dark ? '#04070B' : '#FFFFFF', maxLines: 1, label: 'CTA' });
      text(data.ctaNote, margin + ctaW + 26, footerY + (landscape ? 10 : 14), W - ctaW - 26, landscape ? 15 : 19, { color: muted, maxLines: 2, label: 'CTA note' });
    } else text(data.ctaNote, margin, footerY, W, 20, { color: muted, maxLines: 2, label: 'CTA note' });
    ctx.restore();
    return { errors: [...new Set(errors)], notices: [...new Set(notices)], summary: `${sessions.length} session${sessions.length === 1 ? '' : 's'} · ${speakers.length} speaker${speakers.length === 1 ? '' : 's'} · topics: ${topicLayout} · speakers: ${sidebar ? 'vertical' : speakerLayout}` };
  }
  return { render, wrap, selectData, validate, sessionTimes, displayDate, localInstant, zoneLabel, COPY, ZONES };
});

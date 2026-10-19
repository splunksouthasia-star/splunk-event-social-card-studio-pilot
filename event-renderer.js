/* Pure canvas layout for the approved multi-speaker event card. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./webinar-renderer.js'));
  else root.EventRenderer = factory(root.WebinarRenderer);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (R) {
  'use strict';
  const clean = value => String(value || '').trim();
  const LABELS = {
    en: { meet: 'MEET OUR SPEAKERS', join: 'JOIN US', booth: 'Booth' },
    ko: { meet: '발표자를 만나보세요', join: '함께하세요', booth: '부스' },
    'zh-Hans': { meet: '认识我们的演讲嘉宾', join: '欢迎参加', booth: '展位' },
    'zh-Hant': { meet: '認識我們的演講嘉賓', join: '歡迎參加', booth: '展位' },
    th: { meet: 'พบกับวิทยากรของเรา', join: 'เข้าร่วมกับเรา', booth: 'บูธ' },
    ja: { meet: '登壇者のご紹介', join: 'ぜひご参加ください', booth: 'ブース' },
  };
  function eventTitle(data) { return clean(data.preset === 'custom' ? data.customTitle : data.preset); }
  function dateRange(data, locale = 'en') {
    const start = data.startDate, end = data.dateMode === 'range' ? data.endDate : '';
    if (!start && !end) return '';
    if (!start || !end || start === end) return R.displayDate(start || end, locale);
    const a = new Date(`${start}T12:00:00Z`), b = new Date(`${end}T12:00:00Z`);
    if (locale === 'en' && a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth()) {
      const month = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(a);
      return `${a.getUTCDate()}–${b.getUTCDate()} ${month} ${a.getUTCFullYear()}`;
    }
    return `${R.displayDate(start, locale, true)} – ${R.displayDate(end, locale, true)}`;
  }
  function selectedSpeakers(data) { return data.speakers.slice(0, Number(data.speakerCount) === 2 ? 2 : 3); }
  function validate(data) {
    const errors = [];
    if (!eventTitle(data)) errors.push('Choose an event name, or enter a custom event name.');
    if (data.dateMode === 'range' && Boolean(data.startDate) !== Boolean(data.endDate)) errors.push('Choose both dates for a range, or select Single day. Leave both blank to hide the dates.');
    if (data.dateMode === 'range' && data.startDate && data.endDate && data.endDate < data.startDate) errors.push('The end date must be on or after the start date.');
    if (data.endTime && !data.startTime) errors.push('Add a start time or clear the end time.');
    if (data.endTime && data.endTime <= data.startTime) errors.push('The end time must be later than the start time (same day).');
    for (const time of [data.startTime, data.endTime].filter(Boolean)) {
      if (data.startDate && !R.localInstant(data.startDate, time, data.zone)) errors.push('That local time does not exist on this date. Choose a time outside the daylight-saving change.');
    }
    selectedSpeakers(data).forEach((speaker, i) => {
      if (!speaker.photo && ![speaker.name, speaker.title, speaker.organisation].some(clean)) errors.push(`Speaker ${i + 1}: add a name, photo or professional details before downloading.`);
    });
    return errors;
  }
  function timeText(data, locale = 'en') {
    return R.sessionTimes({ date: data.startDate, start: data.startTime, end: data.endTime, zone: data.zone }, [], locale);
  }
  function caption(data, locale = 'en') {
    const title = eventTitle(data), lines = [];
    if (title) lines.push(`Join us at ${title}${clean(data.city) ? ` in ${clean(data.city)}` : ''}.`);
    if (clean(data.cardCaption)) lines.push(clean(data.cardCaption));
    const details = [dateRange(data, locale), timeText(data, locale), clean(data.venue), clean(data.booth) ? `Booth ${clean(data.booth)}` : ''].filter(Boolean);
    if (details.length) lines.push(details.join(' · '));
    const names = selectedSpeakers(data).map(s => clean(s.name)).filter(Boolean);
    if (names.length) lines.push(`Meet our speakers: ${names.join(', ')}.`);
    if (/^https?:\/\//i.test(clean(data.registration))) lines.push(`Register: ${clean(data.registration)}`);
    lines.push('#Splunk #Cisco');
    return lines.join('\n\n');
  }
  function render({ ctx, width, height, data, assets, language = {} }) {
    const errors = validate(data), notices = [];
    const locale = language.locale || 'en', family = language.fontFamily || 'Inter, Arial, sans-serif';
    const copy = LABELS[data.language] || LABELS.en;
    const translated = R.COPY[data.language] || R.COPY.en;
    const H = height / width * 1080, landscape = H < 700, story = H > 1600;
    const vertical = data.layout === 'vertical';
    const dark = data.theme === 'dark-glow';
    const base = dark ? '#070B10' : '#EDF2F7', ink = dark ? '#FFFFFF' : '#04070B', muted = dark ? '#BAC4CF' : '#455667';
    const margin = landscape ? 44 : 60, W = 1080 - margin * 2;
    const top = story ? 150 : landscape ? 26 : 50;
    const headingY = story ? 270 : landscape ? 98 : 218;
    const bottom = H - (story ? 165 : landscape ? 36 : 96);
    const leftW = vertical ? landscape ? 490 : 490 : W;
    const speakers = selectedSpeakers(data);
    const title = eventTitle(data);
    const cardCaption = clean(data.cardCaption);
    const cta = data.cta === 'none' ? '' : data.cta === 'custom' ? clean(data.ctaText) : translated.register;
    ctx.save(); ctx.setTransform(width / 1080, 0, 0, width / 1080, 0, 0);
    ctx.fillStyle = base; ctx.fillRect(0, 0, 1080, H);
    const art = dark ? assets.darkGlow : assets.lightGlow;
    if (art) {
      const aw = 490, ah = aw * art.height / art.width, baseRGB = dark ? '7,11,16' : '237,242,247';
      ctx.drawImage(art, 590, 0, aw, ah);
      const edge = ctx.createLinearGradient(590, 0, 690, 0); edge.addColorStop(0, `rgba(${baseRGB},1)`); edge.addColorStop(1, `rgba(${baseRGB},0)`);
      ctx.fillStyle = edge; ctx.fillRect(590, 0, 100, ah);
      const foot = ctx.createLinearGradient(0, ah - 100, 0, ah); foot.addColorStop(0, `rgba(${baseRGB},0)`); foot.addColorStop(1, `rgba(${baseRGB},1)`);
      ctx.fillStyle = foot; ctx.fillRect(590, ah - 100, aw, 101);
    }
    const logo = dark ? assets.whiteLogo : assets.blackLogo;
    if (logo) { const lw = landscape ? 145 : 185; ctx.drawImage(logo, margin, top, lw, lw * logo.height / logo.width); }
    else errors.push('The official logo is not ready. Refresh before downloading.');
    const font = (size, weight) => { ctx.font = `${weight} ${size}px ${family}`; };
    function block(value, x, y, w, size, { weight = 400, color = ink, maxLines = 4, minSize = size, label = 'Text', align = 'left', gap = 0 } = {}) {
      if (!clean(value)) return y;
      let s = size, lines;
      do { font(s, weight); lines = R.wrap(ctx, value, w, locale); if (lines.length <= maxLines || s <= minSize) break; s--; } while (true);
      if (lines.length > maxLines) errors.push(`${label} is too long. Shorten it or choose another layout / taller format.`);
      ctx.fillStyle = color; ctx.textBaseline = 'top'; ctx.textAlign = align;
      lines.slice(0, maxLines).forEach((line, i) => ctx.fillText(line, align === 'center' ? x + w / 2 : x, y + i * (s * 1.16 + gap)));
      ctx.textAlign = 'left';
      return y + Math.min(lines.length, maxLines) * (s * 1.16 + gap);
    }
    function photo(speaker, x, y, size) {
      if (!speaker.photo) return;
      const img = speaker.photo, scale = Math.max(size / img.width, size / img.height) * Math.max(1, Number(speaker.zoom) || 1);
      const iw = img.width * scale, ih = img.height * scale, ox = (iw - size) / 2, oy = (ih - size) / 2;
      ctx.save(); ctx.beginPath(); ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2); ctx.clip();
      ctx.drawImage(img, x - ox - ox * (Number(speaker.x) || 0), y - oy - oy * (Number(speaker.y) || 0), iw, ih); ctx.restore();
    }
    let y = headingY;
    if (data.intro !== 'none') block(copy[data.intro] || copy.meet, margin, headingY - (landscape ? 27 : 48), leftW, landscape ? 15 : 20, { weight: 600, color: muted, maxLines: 1, label: 'Intro line' });
    const verticalTitle = vertical && !landscape && title === 'Splunk Experience Day' ? 'Splunk\nExperience\nDay' : title;
    let titleSize = landscape ? 38 : vertical ? (cardCaption ? 78 : 84) : 66;
    // Long event names wrap and fit within the fixed event column; nothing is drawn over speakers.
    y = block(verticalTitle, margin, y, leftW, titleSize, { weight: 600, minSize: landscape ? 30 : 54, maxLines: 3, label: 'Event name' });
    const infoGap = landscape ? 14 : vertical ? 38 : 22;
    if (title) y += infoGap;
    const detailLines = [
      [clean(data.city), landscape ? 24 : vertical ? 37 : 32, 500, ink, 'City'],
      [dateRange(data, locale), landscape ? 20 : vertical ? 28 : 26, 500, ink, 'Dates'],
      [clean(data.venue), landscape ? 17 : vertical ? 24 : 22, 400, muted, 'Venue'],
      [timeText(data, locale), landscape ? 17 : 23, 500, ink, 'Time'],
      [clean(data.booth) ? `${copy.booth} ${clean(data.booth)}` : '', landscape ? 17 : 23, 400, muted, 'Booth'],
    ].filter(([value]) => value);
    detailLines.forEach(([value, size, weight, color, label], i) => {
      if (i) y += landscape ? 10 : label === 'Dates' ? (vertical ? 25 : 20) : (vertical ? 17 : 14);
      y = block(value, margin, y, leftW, size, { weight, color, maxLines: label === 'City' ? 2 : 2, minSize: size - 2, label });
    });
    if (cardCaption) {
      y += landscape ? 20 : vertical ? 35 : 24;
      ctx.strokeStyle = dark ? '#3B4651' : '#BBC6D1'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(margin, y); ctx.lineTo(margin + leftW, y); ctx.stroke();
      y += landscape ? 19 : vertical ? 34 : 24;
      y = block(cardCaption, margin, y, leftW, landscape ? 23 : vertical ? 34 : 28, { weight: 600, maxLines: vertical ? 4 : 3, minSize: landscape ? 20 : 28, label: 'On-card caption' });
    }
    const mainEnd = y;
    const ctaH = cta ? landscape ? 42 : 54 : 0;
    const footerY = bottom - ctaH;
    let speakerEnd = 0;
    if (vertical) {
      const sx = landscape ? 594 : 632, sw = 1080 - margin - sx;
      const ps = landscape ? 68 : story ? 156 : 134;
      const start = headingY + (landscape ? 6 : 32);
      const heights = speakers.map(speaker => {
        const tw = sw - (speaker.photo ? ps + 20 : 0);
        let h = landscape ? 0 : 8;
        for (const [key, value, size, weight] of [['name', speaker.name, landscape ? 23 : 28, 600], ['title', speaker.title, landscape ? 17 : 22, 400], ['organisation', speaker.organisation, landscape ? 17 : 22, 400]]) {
          if (!clean(value)) continue;
          if (key === 'title' && clean(speaker.name)) h += landscape ? 7 : 14;
          if (key === 'organisation' && clean(speaker.title)) h += 8;
          if (key === 'organisation' && !clean(speaker.title) && clean(speaker.name)) h += landscape ? 7 : 14;
          font(size, weight); h += R.wrap(ctx, value, tw, locale).length * size * 1.16;
        }
        return Math.max(speaker.photo ? ps : 0, h);
      });
      const free = bottom - start - heights.reduce((sum, h) => sum + h, 0);
      const gap = Math.max(18, free / Math.max(1, speakers.length - 1));
      if (free < 18 * (speakers.length - 1)) errors.push('The speaker column is too tall. Shorten the profile details or choose a taller format.');
      let cursor = start;
      speakers.forEach((speaker, i) => {
        const py = cursor;
        photo(speaker, sx, py, ps);
        const tx = sx + (speaker.photo ? ps + 20 : 0), tw = sw - (tx - sx);
        let sy = py + (landscape ? 0 : 8);
        sy = block(speaker.name, tx, sy, tw, landscape ? 23 : 28, { weight: 600, maxLines: 2, minSize: landscape ? 21 : 25, label: `Speaker ${i + 1} name` });
        if (clean(speaker.name) && (clean(speaker.title) || clean(speaker.organisation))) sy += landscape ? 7 : 14;
        sy = block(speaker.title, tx, sy, tw, landscape ? 17 : 22, { color: muted, maxLines: 3, label: `Speaker ${i + 1} title` });
        if (clean(speaker.title) && clean(speaker.organisation)) sy += 8;
        sy = block(speaker.organisation, tx, sy, tw, landscape ? 17 : 22, { color: muted, maxLines: 2, label: `Speaker ${i + 1} organisation` });
        speakerEnd = Math.max(speakerEnd, sy, speaker.photo ? py + ps : py);
        if (sy > bottom + 1) errors.push(`Speaker ${i + 1} details do not fit. Shorten the title, use a horizontal layout, or choose portrait / story.`);
        cursor += heights[i] + gap;
      });
      if (mainEnd > footerY - (landscape ? 18 : 50)) errors.push('The event details / caption overlap the CTA area. Shorten the text, clear optional details, or choose a taller format.');
    } else {
      const gap = landscape ? 24 : 44, cellW = (W - gap * (speakers.length - 1)) / speakers.length;
      const hasPhotos = speakers.some(s => s.photo), ps = landscape ? 68 : speakers.length === 2 ? 166 : 152;
      const nameSize = landscape ? 22 : 28;
      const measured = speakers.map(speaker => {
        let h = hasPhotos && !landscape ? ps + 24 : 0;
        const tw = cellW - (landscape && speaker.photo ? ps + 14 : 0);
        for (const [value, size, weight] of [[speaker.name, nameSize, 600], [speaker.title, landscape ? 17 : 22, 400], [speaker.organisation, landscape ? 17 : 22, 400]]) {
          if (!clean(value)) continue; font(size, weight); h += R.wrap(ctx, value, tw, locale).length * size * 1.16 + 10;
        }
        return Math.max(h, landscape && speaker.photo ? ps : 0);
      });
      const neededH = Math.max(...measured, 0), end = footerY - (landscape ? 22 : 42);
      const start = Math.max(mainEnd + 30, end - neededH);
      speakers.forEach((speaker, i) => {
        const sx = margin + i * (cellW + gap);
        photo(speaker, sx, start, ps);
        const tx = sx + (landscape && speaker.photo ? ps + 14 : 0), tw = cellW - (tx - sx);
        let sy = start + (hasPhotos && !landscape ? ps + 24 : 0);
        sy = block(speaker.name, tx, sy, tw, nameSize, { weight: 600, maxLines: 2, label: `Speaker ${i + 1} name` });
        if (clean(speaker.name) && (clean(speaker.title) || clean(speaker.organisation))) sy += 12;
        sy = block(speaker.title, tx, sy, tw, landscape ? 17 : 22, { color: muted, maxLines: 3, label: `Speaker ${i + 1} title` });
        if (clean(speaker.title) && clean(speaker.organisation)) sy += 8;
        sy = block(speaker.organisation, tx, sy, tw, landscape ? 17 : 22, { color: muted, maxLines: 2, label: `Speaker ${i + 1} organisation` });
        speakerEnd = Math.max(speakerEnd, sy, speaker.photo ? start + ps : start);
      });
      if (speakerEnd > end + 4) errors.push('The horizontal speaker row is too tall for this content. Use a vertical layout, shorten the text, or choose portrait / story.');
    }
    if (cta) {
      const size = landscape ? 20 : 22; font(size, 600);
      const bw = Math.max(220, ctx.measureText(cta).width + 58);
      if (bw > leftW) errors.push('The CTA is too long. Use shorter wording.');
      ctx.fillStyle = dark ? '#FFFFFF' : '#04070B'; ctx.beginPath(); ctx.roundRect(margin, footerY, Math.min(bw, leftW), ctaH, ctaH / 2); ctx.fill();
      block(cta, margin + 29, footerY + (landscape ? 9 : 15), Math.min(bw, leftW) - 58, size, { weight: 600, color: dark ? '#04070B' : '#FFFFFF', maxLines: 1, label: 'CTA' });
      if (clean(data.ctaNote)) {
        const remaining = leftW - bw - 28;
        const noteX = remaining >= 150 ? margin + bw + 28 : margin;
        const noteY = remaining >= 150 ? footerY + 13 : footerY + ctaH + 12;
        const noteEnd = block(data.ctaNote, noteX, noteY, remaining >= 150 ? remaining : leftW, landscape ? 17 : 21, { color: muted, maxLines: 2, label: 'CTA supporting note' });
        if (noteEnd > H - (story ? 140 : 30)) errors.push('The CTA supporting note is too long. Shorten it or remove it.');
      }
    } else if (clean(data.ctaNote)) block(data.ctaNote, margin, footerY - 24, leftW, 21, { color: muted, maxLines: 2, label: 'CTA supporting note' });
    ctx.restore();
    return { errors: [...new Set(errors)], notices, summary: `${speakers.length} speakers · ${vertical ? 'vertical' : 'horizontal'} layout · ${dark ? 'dark' : 'light'} style` };
  }
  return { render, validate, selectedSpeakers, eventTitle, dateRange, timeText, caption };
});

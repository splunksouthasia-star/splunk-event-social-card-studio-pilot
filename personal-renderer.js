/* Content-aware personal cards. Text geometry is shared by preview and PNG export. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./webinar-renderer.js'));
  else root.PersonalRenderer = factory(root.WebinarRenderer);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (R) {
  'use strict';
  const clean = value => String(value || '').trim();
  function formatLocation(city, venue) {
    const c = clean(city), v = clean(venue);
    if (!v) return c;
    if (!c) return v;
    const normal = text => text.normalize('NFKC').toLocaleLowerCase();
    const nv = normal(v), nc = normal(c);
    // Preserve the full venue name when it already includes the city at the end.
    if (nv === nc || nv.endsWith(` ${nc}`) || nv.endsWith(`,${nc}`)) return v;
    return `${v}, ${c}`;
  }
  function bannerLayout({ ctx, width, height, data, assets = {}, language = {} }) {
    const H = height / width * 1080, landscape = H < 700, story = H > 1600, portrait = H > 1200;
    const margin = landscape ? 60 : 81, usable = 1080 - 2 * margin;
    const family = language.fontFamily || 'Inter, Arial, sans-serif', locale = language.locale || 'en';
    const lineFactor = /^th/.test(locale) ? 1.35 : /^(ko|zh|ja)/.test(locale) ? 1.24 : 1.14;
    const values = { location: formatLocation(data.location, data.venue), booth: clean(data.booth), date: clean(data.date), time: clean(data.time), supporting: clean(data.cardCaption) };
    const base = landscape
      ? { top: 104, intro: 42, single: 68, double: 52, location: 32, city: 36, booth: 27, date: 24, time: 23, support: 23, introGap: 18, metaGap: 24, rowGap: 9, supportGap: 24, logoW: 150, logoH: 42, logoGap: 24, bottom: 34 }
      : story
        ? { top: 260, intro: 96, single: 132, double: 108, location: 58, city: 66, booth: 48, date: 44, time: 42, support: 40, introGap: 36, metaGap: 56, rowGap: 22, supportGap: 78, logoW: 240, logoH: 76, logoGap: 50, bottom: 160 }
        : portrait
          ? { top: 210, intro: 86, single: 120, double: 96, location: 52, city: 58, booth: 44, date: 40, time: 38, support: 36, introGap: 32, metaGap: 48, rowGap: 18, supportGap: 64, logoW: 210, logoH: 62, logoGap: 44, bottom: 90 }
          : { top: 184, intro: 78, single: 112, double: 88, location: 46, city: 52, booth: 38, date: 36, time: 34, support: 32, introGap: 28, metaGap: 40, rowGap: 14, supportGap: 54, logoW: 190, logoH: 54, logoGap: 40, bottom: 72 };
    function attempt(scale) {
      const blocks = [], errors = [];
      const size = n => Math.round(n * scale);
      const font = (s, weight) => { ctx.font = `${weight} ${s}px ${family}`; };
      const gap = n => n * scale;
      let y = base.top, eventLogo = null;
      function measure(id, value, preferred, weight, maxLines, min) {
        const text = clean(value);
        if (!text) return null;
        let s = size(preferred), lines;
        const limit = Math.min(s, size(min ?? preferred));
        do {
          font(s, weight); lines = R.wrap(ctx, text, usable, locale);
          if (lines.length <= maxLines || s <= limit) break;
          s--;
        } while (true);
        if (lines.length > maxLines) errors.push(`${id} is too long for this format. Shorten it or choose portrait / story.`);
        return { id, text, lines, x: margin, y: 0, width: usable, font: s, weight, lineHeight: s * lineFactor, height: lines.length * s * lineFactor };
      }
      function place(block, before = 0) {
        if (!block) return;
        if (blocks.length) y += gap(before);
        block.y = y; blocks.push(block); y += block.height;
      }
      if (assets.eventLogo) {
        const ratio = Math.min(size(base.logoW) / assets.eventLogo.width, size(base.logoH) / assets.eventLogo.height);
        const w = assets.eventLogo.width * ratio, h = assets.eventLogo.height * ratio;
        eventLogo = { x: margin, y: y + (size(base.logoH) - h) / 2, width: w, height: h };
        y += size(base.logoH) + gap(base.logoGap);
      }
      place(measure('Card message', data.eyebrow, base.intro, 400, 2, base.intro * .84));
      const titleText = clean(data.title);
      if (titleText) {
        const maxSingle = size(base.single), maxDouble = size(base.double);
        font(maxSingle, 600);
        const fittedSingle = Math.min(maxSingle, Math.floor(usable / Math.max(1, ctx.measureText(titleText).width) * maxSingle));
        let s, lines;
        if (!titleText.includes('\n') && fittedSingle >= maxDouble + size(6)) {
          s = fittedSingle; lines = [titleText];
        } else {
          const words = titleText.split(/\s+/);
          for (s = maxDouble; s >= Math.round(maxDouble * .78); s--) {
            font(s, 600);
            const candidates = [];
            for (let i = 1; i < words.length; i++) {
              const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
              const lengths = pair.map(line => ctx.measureText(line).width);
              if (Math.max(...lengths) <= usable) candidates.push({ pair, score: Math.abs(lengths[0] - lengths[1]) });
            }
            if (candidates.length) { lines = candidates.sort((a, b) => a.score - b.score)[0].pair; break; }
            lines = R.wrap(ctx, titleText, usable, locale);
            // Keep named terms such as Symposium/Xpo intact before accepting
            // a larger but awkward break at punctuation. CJK still wraps by word.
            if ((words.length === 1 && lines.length <= 2) || s === Math.round(maxDouble * .78)) break;
          }
        }
        if (lines.length > 2) errors.push('The event name needs more than two lines. Shorten it or choose portrait / story.');
        place({ id: 'Event name', text: titleText, lines, x: margin, y: 0, width: usable, font: s, weight: 600, lineHeight: s * lineFactor, height: lines.length * s * lineFactor, gradient: true }, base.introGap);
      }
      const identityBottom = y;
      const locationSize = clean(data.venue) ? base.location : base.city;
      let first = true;
      const rows = [
        measure('Event city', values.location, locationSize, 600, 1, landscape ? 27 : 34),
        measure('Booth number', values.booth, base.booth, 500, 2, base.booth * .85),
        measure('Event dates', values.date, base.date, 400, 2, base.date * .86),
        measure('Event time', values.time, base.time, 400, 2, base.time * .86),
      ];
      rows.filter(Boolean).forEach(row => { place(row, first ? base.metaGap : base.rowGap); first = false; });
      const detailsBottom = y;
      place(measure('Supporting line', values.supporting, base.support, 400, 3, base.support * .9), base.supportGap);
      const contentBottom = y, minTop = landscape ? 96 : story ? 230 : portrait ? 180 : 160;
      const overflow = Math.max(0, contentBottom - (H - base.bottom));
      const shift = Math.min(overflow, base.top - minTop);
      if (shift) {
        blocks.forEach(b => { b.y -= shift; });
        if (eventLogo) eventLogo.y -= shift;
      }
      if (contentBottom - shift > H - base.bottom + .5) errors.push('These event details need more space. Shorten optional text or choose portrait / story before downloading.');
      return { width, height, H, margin, blocks, eventLogo, photo: null, profile: null, identityBottom: identityBottom - shift, detailsBottom: detailsBottom - shift, errors: [...new Set(errors)], landscape, story };
    }
    let result = attempt(1);
    if (result.errors.length) for (const scale of [.94, .88, .82]) {
      const next = attempt(scale);
      result = next;
      if (!result.errors.length) break;
    }
    return result;
  }
  function layout({ ctx, width, height, data, assets = {}, language = {} }) {
    if (data.intent === 'banner') return bannerLayout({ ctx, width, height, data, assets, language });
    const H = height / width * 1080, landscape = H < 700, story = H > 1600;
    const margin = landscape ? 60 : 72, right = 1080 - margin;
    const locale = language.locale || 'en', family = language.fontFamily || 'Inter, Arial, sans-serif';
    const errors = [], blocks = [];
    const banner = data.intent === 'banner';
    const rowGap = landscape ? 12 : 18;
    let y = story ? 250 : landscape ? 90 : 160;
    const font = (size, weight) => { ctx.font = `${weight} ${size}px ${family}`; };
    function measure(id, value, w, size, weight, maxLines, minSize = size) {
      const text = clean(value);
      if (!text) return null;
      let s = size, lines;
      do {
        font(s, weight); lines = R.wrap(ctx, text, w, locale);
        if (lines.length <= maxLines || s <= minSize) break;
        s--;
      } while (true);
      if (lines.length > maxLines) errors.push(`${id} is too long for this format. Shorten it or choose portrait / story; the text will not be squeezed or cut off in an export.`);
      return { id, text, lines, width: w, font: s, weight, lineHeight: s * 1.18, height: lines.length * s * 1.18 };
    }
    function add(block, x, py) { if (block) { block.x = x; block.y = py; blocks.push(block); } return block; }
    const eyebrow = measure('Card message', data.eyebrow, right - margin, landscape ? 31 : 44, 600, 2, landscape ? 27 : 38);
    if (eyebrow) { add(eyebrow, margin, y); y += eyebrow.height + (landscape ? 16 : 28); }
    const title = measure('Event name', data.title, right - margin, landscape ? 54 : story ? 80 : 76, 600, 2, landscape ? 43 : 62);
    if (title) { add(title, margin, y); title.gradient = true; y += title.height + rowGap; }
    const city = measure('Event city', formatLocation(data.location, data.venue), right - margin, clean(data.venue) ? landscape ? 31 : 44 : landscape ? 34 : 48, 600, 2, landscape ? 28 : 36);
    if (city) { add(city, margin, y); y += city.height; }
    const identityBottom = y;
    const photoSize = banner ? 0 : landscape ? 230 : story ? 440 : H > 1200 ? 400 : 360;
    const photoX = right - photoSize;
    const profileW = banner ? right - margin : photoX - margin - (landscape ? 36 : 54);
    const metaW = banner ? right - margin : profileW;
    const metadata = [];
    const booth = measure('Booth number', data.booth, metaW, landscape ? 27 : 36, 600, 2, landscape ? 24 : 32);
    if (booth) metadata.push(booth);
    const date = clean(data.date), time = clean(data.time);
    const joinedTime = landscape && date && time ? `${date} · ${time}` : '';
    font(24, 400);
    const combineTime = joinedTime && ctx.measureText(joinedTime).width <= metaW;
    if (combineTime) metadata.push(measure('Date / time', joinedTime, metaW, 24, 400, 2, 22));
    else {
      if (date) metadata.push(measure('Event dates', date, metaW, landscape ? 24 : 32, 400, 2, landscape ? 22 : 29));
      if (time) metadata.push(measure('Event time', time, metaW, landscape ? 22 : 30, 400, 2, landscape ? 21 : 27));
    }
    metadata.filter(Boolean).forEach((b, i) => {
      y += i === 0 ? landscape ? 14 : 24 : landscape ? 10 : 14;
      add(b, margin, y); y += b.height;
    });
    const detailsBottom = y;
    let photo = null, profile = null;
    if (!banner) {
      const name = measure('Profile name', data.name, profileW, landscape ? 30 : story ? 50 : 44, 600, 3, landscape ? 26 : 34);
      const role = measure('Job title / region', [clean(data.role), clean(data.region)].filter(Boolean).join(', '), profileW, landscape ? 23 : story ? 35 : 32, 400, 4, landscape ? 21 : 28);
      const organisation = measure('Organisation', data.organisation, profileW, landscape ? 21 : story ? 31 : 28, 400, 3, landscape ? 20 : 25);
      const profileBlocks = [name, role, organisation].filter(Boolean);
      const gap = landscape ? 7 : 10;
      const profileH = profileBlocks.reduce((sum, b) => sum + b.height, 0) + Math.max(0, profileBlocks.length - 1) * gap;
      const safeBottom = H - (story ? 160 : landscape ? 34 : 72);
      const minCenter = Math.max(
        identityBottom + (landscape ? 18 : 28) + photoSize / 2,
        detailsBottom + (landscape ? 16 : 40) + profileH / 2,
      );
      const preferredCenter = story ? H * .68 : H > 1200 ? H * .68 : landscape ? 0 : H * .66;
      const extent = Math.max(photoSize, profileH) / 2;
      const maxCenter = safeBottom - extent;
      const center = Math.max(minCenter, Math.min(Math.max(minCenter, preferredCenter), maxCenter));
      if (minCenter > maxCenter + .5) errors.push('These event/profile details need more space. Shorten optional text or choose portrait / story before downloading.');
      photo = { x: photoX, y: center - photoSize / 2, size: photoSize, centerY: center };
      let py = center - profileH / 2;
      profile = { x: margin, y: py, width: profileW, height: profileH, centerY: center };
      profileBlocks.forEach(b => { add(b, margin, py); py += b.height + gap; });
    } else {
      // Event-only cards use the available height without leaving a portrait-sized hole.
      const contentH = detailsBottom - blocks[0]?.y || 0;
      const desiredTop = Math.max(story ? 280 : landscape ? 95 : 190, (H - contentH) * .38);
      const delta = desiredTop - (blocks[0]?.y || desiredTop);
      blocks.forEach(b => { b.y += delta; });
      if (blocks.some(b => b.y + b.height > H - (story ? 160 : 40))) errors.push('The event details do not fit this format. Shorten the text or choose portrait / story.');
    }
    return { width, height, H, margin, blocks, photo, profile, identityBottom, detailsBottom, errors: [...new Set(errors)], landscape, story };
  }
  function cover(ctx, image, x, y, w, h) {
    const scale = Math.max(w / image.width, h / image.height);
    const iw = image.width * scale, ih = image.height * scale;
    ctx.drawImage(image, x - (iw - w) / 2, y - (ih - h) / 2, iw, ih);
  }
  function render({ ctx, width, height, data, assets = {}, language = {} }) {
    ctx.save();
    ctx.setTransform(width / 1080, 0, 0, width / 1080, 0, 0);
    const geometry = layout({ ctx, width, height, data, assets, language });
    const { H, blocks, photo, landscape, story } = geometry;
    const family = language.fontFamily || 'Inter, Arial, sans-serif';
    ctx.fillStyle = '#0B1118'; ctx.fillRect(0, 0, 1080, H);
    if (assets.background) cover(ctx, assets.background, 0, 0, 1080, H);
    if (data.overlay) {
      const overlay = ctx.createLinearGradient(0, 0, 1080, 0);
      overlay.addColorStop(0, 'rgba(4,7,11,.74)'); overlay.addColorStop(.56, 'rgba(4,7,11,.26)'); overlay.addColorStop(1, 'rgba(4,7,11,0)');
      ctx.fillStyle = overlay; ctx.fillRect(0, 0, 1080, H);
    }
    if (assets.logo) {
      const lw = landscape ? 166 : 204, lh = lw * assets.logo.height / assets.logo.width;
      ctx.drawImage(assets.logo, 1080 - geometry.margin - lw, story ? 100 : landscape ? 24 : 56, lw, lh);
    } else geometry.errors.push('The brand logo is not ready. Refresh before downloading.');
    if (assets.eventLogo && geometry.eventLogo) {
      const box = geometry.eventLogo;
      ctx.drawImage(assets.eventLogo, box.x, box.y, box.width, box.height);
    }
    blocks.forEach(b => {
      ctx.font = `${b.weight} ${b.font}px ${family}`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
      if (b.gradient) {
        const gradient = ctx.createLinearGradient(b.x, 0, b.x + Math.min(b.width, Math.max(...b.lines.map(line => ctx.measureText(line).width))), 0);
        gradient.addColorStop(0, '#FF007F'); gradient.addColorStop(.52, '#FF596E'); gradient.addColorStop(1, '#FF9000'); ctx.fillStyle = gradient;
      } else ctx.fillStyle = '#FFFFFF';
      b.lines.forEach((line, i) => ctx.fillText(line, b.x, b.y + i * b.lineHeight));
    });
    if (photo) {
      const { x, y, size } = photo, cx = x + size / 2, cy = y + size / 2;
      const ring = ctx.createLinearGradient(x, 0, x + size, 0);
      ring.addColorStop(0, '#FF007F'); ring.addColorStop(.52, '#FF596E'); ring.addColorStop(1, '#FF9000');
      ctx.strokeStyle = ring; ctx.lineWidth = landscape ? 4 : 6;
      ctx.beginPath(); ctx.arc(cx, cy, size / 2 + (landscape ? 7 : 10), 0, Math.PI * 2); ctx.stroke();
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, Math.PI * 2); ctx.clip();
      if (assets.photo) {
        const image = assets.photo;
        const scale = Math.max(size / image.width, size / image.height) * Math.max(1, Number(data.zoom) || 1);
        const iw = image.width * scale, ih = image.height * scale;
        const dx = (iw - size) / 2, dy = (ih - size) / 2;
        ctx.drawImage(image, x - dx + (Number(data.photoX) || 0) * dx, y - dy + (Number(data.photoY) || 0) * dy, iw, ih);
      } else {
        ctx.fillStyle = '#111922'; ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#DCE4EA'; ctx.font = `500 ${landscape ? 19 : 25}px ${family}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('Upload photo', cx, cy);
      }
      ctx.restore();
    }
    ctx.restore();
    return geometry;
  }
  return { layout, render, formatLocation };
});

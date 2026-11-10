/* Content-aware personal cards. Text geometry is shared by preview and PNG export. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./webinar-renderer.js'));
  else root.PersonalRenderer = factory(root.WebinarRenderer);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (R) {
  'use strict';
  const clean = value => String(value || '').trim();
  function layout({ ctx, width, height, data, language = {} }) {
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
    const city = measure('Event city', data.location, right - margin, landscape ? 34 : 48, 600, 2, landscape ? 30 : 42);
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
    const geometry = layout({ ctx, width, height, data, language });
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
  return { layout, render };
});

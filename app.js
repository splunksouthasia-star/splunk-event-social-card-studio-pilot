const canvas = document.querySelector("#card-canvas");
const ctx = canvas.getContext("2d");

const form = document.querySelector("#card-form");
const fields = {
  owner: document.querySelector("#event-owner"),
  eventPreset: document.querySelector("#event-preset"),
  title: document.querySelector("#event-title"),
  location: document.querySelector("#event-location"),
  date: document.querySelector("#event-date"),
  platform: document.querySelector("#social-platform"),
  socialFormat: document.querySelector("#social-format"),
  intent: document.querySelector("#card-intent"),
  language: document.querySelector("#card-language"),
  name: document.querySelector("#person-name"),
  role: document.querySelector("#person-role"),
  region: document.querySelector("#person-region"),
  organisation: document.querySelector("#person-organisation"),
  photo: document.querySelector("#photo-upload"),
  background: document.querySelector("#background-upload"),
  overlay: document.querySelector("#readability-overlay"),
  photoZoom: document.querySelector("#photo-zoom"),
  photoHorizontal: document.querySelector("#photo-horizontal"),
  photoVertical: document.querySelector("#photo-vertical"),
  registration: document.querySelector("#registration-link"),
  caption: document.querySelector("#caption"),
};

const backgroundUploadWrap = document.querySelector("#background-upload-wrap");
const customEventTitleWrap = document.querySelector("#custom-event-title-wrap");
const thirdPartyNote = document.querySelector("#third-party-note");
const photoControls = document.querySelector("#photo-controls");
const photoCropNote = document.querySelector("#photo-crop-note");
const actionStatus = document.querySelector("#action-status");
const previewSize = document.querySelector("#preview-size");
const previewNote = document.querySelector("#preview-note");
const openLinkedInButton = document.querySelector("#open-linkedin");

const state = {
  genericBackground: null,
  concentricSquare: null,
  concentricLandscape: null,
  customBackground: null,
  logo: null,
  photo: null,
  photoZoom: 1,
  photoHorizontal: 0,
  photoVertical: 0,
  captionEdited: false,
};

const socialFormats = {
  square: {
    label: "Square post — 1080 × 1080",
    width: 1080,
    height: 1080,
    layout: {
      eyebrow: { x: 72, y: 156, maxWidth: 830, font: 52 },
      title: { x: 72, y: 246, maxWidth: 940, font: 74 },
      location: { x: 72, y: 334, maxWidth: 600, font: 80 },
      date: { x: 78, y: 448, maxWidth: 650, font: 40 },
      profile: { x: 188, y: 636, maxWidth: 350 },
      portrait: { x: 560, y: 468, size: 445 },
      logo: { x: 824, y: 20, width: 220, height: 119 },
    },
  },
  landscape: {
    label: "Landscape post — 1200 × 627",
    width: 1200,
    height: 627,
    layout: {
      eyebrow: { x: 72, y: 115, maxWidth: 660, font: 38 },
      title: { x: 72, y: 174, maxWidth: 670, font: 68 },
      location: { x: 72, y: 258, maxWidth: 620, font: 65 },
      date: { x: 72, y: 341, maxWidth: 620, font: 33 },
      profile: { x: 72, y: 449, maxWidth: 480 },
      portrait: { x: 802, y: 266, size: 288 },
      logo: { x: 938, y: 30, width: 190, height: 102 },
    },
  },
  portrait: {
    label: "Portrait feed — 1080 × 1350",
    width: 1080,
    height: 1350,
    layout: {
      eyebrow: { x: 72, y: 168, maxWidth: 850, font: 50 },
      title: { x: 72, y: 246, maxWidth: 930, font: 72 },
      location: { x: 72, y: 334, maxWidth: 760, font: 76 },
      date: { x: 76, y: 442, maxWidth: 700, font: 38 },
      profile: { x: 116, y: 1010, maxWidth: 490 },
      portrait: { x: 554, y: 588, size: 428 },
      logo: { x: 824, y: 28, width: 220, height: 119 },
    },
  },
  story: {
    label: "Story / Status — 1080 × 1920",
    width: 1080,
    height: 1920,
    layout: {
      eyebrow: { x: 72, y: 278, maxWidth: 860, font: 52 },
      title: { x: 72, y: 368, maxWidth: 940, font: 74 },
      location: { x: 72, y: 460, maxWidth: 780, font: 78 },
      date: { x: 76, y: 568, maxWidth: 720, font: 40 },
      profile: { x: 112, y: 1584, maxWidth: 820 },
      portrait: { x: 228, y: 804, size: 624 },
      logo: { x: 824, y: 72, width: 220, height: 119 },
    },
  },
};

const platformFormats = {
  linkedin: ["square", "landscape", "portrait"],
  facebook: ["square", "landscape", "story"],
  instagram: ["square", "portrait", "story"],
  x: ["square", "landscape"],
  whatsapp: ["square", "story"],
  other: ["square", "landscape", "portrait", "story"],
};

const languagePack = {
  en: {
    locale: "en",
    fontFamily: 'Inter, Arial, sans-serif',
    fontName: "Inter",
    copy: { speaking: "I am speaking at", attending: "I am attending", meet: "Meet me at" },
  },
  ko: {
    locale: "ko",
    fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", Arial, sans-serif',
    fontName: "Noto Sans KR",
    copy: { speaking: "발표자로 참여합니다", attending: "행사에 참석합니다", meet: "행사에서 만나요" },
  },
  "zh-Hans": {
    locale: "zh-CN",
    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
    fontName: "Noto Sans SC",
    copy: { speaking: "我将在本次活动演讲", attending: "我将参加本次活动", meet: "活动现场见" },
  },
  "zh-Hant": {
    locale: "zh-TW",
    fontFamily: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif',
    fontName: "Noto Sans TC",
    copy: { speaking: "我將在本次活動演講", attending: "我將參加本次活動", meet: "活動現場見" },
  },
  th: {
    locale: "th",
    fontFamily: '"Noto Sans Thai", "Thonburi", Tahoma, Arial, sans-serif',
    fontName: "Noto Sans Thai",
    copy: { speaking: "ร่วมเป็นวิทยากร", attending: "เข้าร่วมงาน", meet: "พบกันที่งาน" },
  },
  ja: {
    locale: "ja",
    fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", Arial, sans-serif',
    fontName: "Noto Sans JP",
    copy: { speaking: "登壇します", attending: "参加します", meet: "会場で会いましょう" },
  },
};

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}

function currentBackgroundMode() {
  return form.querySelector('input[name="background-mode"]:checked').value;
}

function currentLanguage() {
  return languagePack[fields.language.value] || languagePack.en;
}

function currentFormat() {
  return socialFormats[fields.socialFormat.value] || socialFormats.square;
}

function cardScale() {
  const { width, height } = currentFormat();
  return Math.min(width, height) / 1080;
}

function updatePreviewMeta() {
  const { width, height } = currentFormat();
  previewSize.textContent = `${width} × ${height}`;
  previewNote.textContent = `Downloads as a ${width} × ${height} PNG.`;
  openLinkedInButton.classList.toggle("is-hidden", fields.platform.value !== "linkedin");
}

function updateSocialFormats() {
  const availableFormats = platformFormats[fields.platform.value] || platformFormats.other;
  const previous = fields.socialFormat.value;
  fields.socialFormat.replaceChildren(
    ...availableFormats.map((format) => {
      const option = document.createElement("option");
      option.value = format;
      option.textContent = socialFormats[format].label;
      return option;
    }),
  );
  fields.socialFormat.value = availableFormats.includes(previous) ? previous : availableFormats[0];
  updatePreviewMeta();
}

function cardFont(weight, fontSize) {
  return `${weight} ${fontSize}px ${currentLanguage().fontFamily}`;
}

async function loadCardLanguageFont() {
  const language = currentLanguage();
  document.documentElement.lang = language.locale;
  if (!document.fonts?.load) return;
  await Promise.all([400, 500, 600, 700].map((weight) => document.fonts.load(`${weight} 72px "${language.fontName}"`)));
}

function intentCopy(intent) {
  return currentLanguage().copy[intent];
}

function captionLead(intent) {
  return {
    speaking: "I’m excited to be speaking at",
    attending: "I’m excited to be attending",
    meet: "I’ll be at",
  }[intent];
}

function titleCaseLocation(value) {
  return value.replace(/\s+\d{4}$/, "").trim();
}

function suggestedCaption() {
  const title = fields.title.value.trim() || "this event";
  const place = titleCaseLocation(fields.location.value.trim());
  const date = fields.date.value.trim();
  const link = fields.registration.value.trim();
  const lines = [`${captionLead(fields.intent.value)} ${title}${place ? ` in ${place}` : ""}.`];
  if (date) lines.push(`Join me on ${date}.`);
  if (link) lines.push(`Register here: ${link}`);
  lines.push("#Splunk #Cisco");
  return lines.join("\n\n");
}

function updateCaption(force = false) {
  if (force || !state.captionEdited) fields.caption.value = suggestedCaption();
}

function setStatus(message) {
  actionStatus.textContent = message;
}

function drawImageCover(image, x, y, width, height) {
  const imageRatio = image.width / image.height;
  const targetRatio = width / height;
  let drawWidth = width;
  let drawHeight = height;
  let drawX = x;
  let drawY = y;
  if (imageRatio > targetRatio) {
    drawWidth = height * imageRatio;
    drawX = x - (drawWidth - width) / 2;
  } else {
    drawHeight = width / imageRatio;
    drawY = y - (drawHeight - height) / 2;
  }
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

function fitFont(text, maxWidth, startingSize, weight = 650, minSize = 40) {
  let fontSize = startingSize;
  while (fontSize > minSize) {
    ctx.font = cardFont(weight, fontSize);
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 1;
  }
  return fontSize;
}

function drawText(text, { x, y, maxWidth, font, weight = 500, color = "#FFFFFF", gradient = false }) {
  const size = fitFont(text, maxWidth, font, weight);
  ctx.save();
  ctx.font = cardFont(weight, size);
  ctx.textBaseline = "top";
  if (gradient) {
    const titleGradient = ctx.createLinearGradient(x, y, x + Math.min(maxWidth, ctx.measureText(text).width), y);
    titleGradient.addColorStop(0, "#FF007F");
    titleGradient.addColorStop(0.52, "#FF596E");
    titleGradient.addColorStop(1, "#FF9000");
    ctx.fillStyle = titleGradient;
  } else {
    ctx.fillStyle = color;
  }
  ctx.fillText(text, x, y, maxWidth);
  ctx.restore();
  return size;
}

function textSegments(text) {
  const value = text.trim();
  if (!value) return [];
  const locale = currentLanguage().locale;
  const characterBased = ["zh-CN", "zh-TW", "th", "ja"].includes(locale);
  if (typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter(locale, { granularity: characterBased ? "grapheme" : "word" });
    return Array.from(segmenter.segment(value), ({ segment }) => segment);
  }
  return characterBased ? Array.from(value) : value.split(/(\s+)/);
}

function wrapText(text, maxWidth, fontSize, weight = 500, lineLimit = 2) {
  ctx.save();
  ctx.font = cardFont(weight, fontSize);
  const segments = textSegments(text);
  const lines = [];
  let line = "";
  for (const segment of segments) {
    const candidate = `${line}${segment}`;
    if (ctx.measureText(candidate.trim()).width > maxWidth && line.trim()) {
      lines.push(line.trim());
      line = segment.trimStart();
    } else {
      line = candidate;
    }
  }
  if (line.trim()) lines.push(line.trim());
  ctx.restore();
  return lines.slice(0, lineLimit);
}

function fitFontForLines(text, maxWidth, startingSize, weight = 500, minSize = 23 * cardScale(), lineLimit = 2) {
  let fontSize = startingSize;
  while (fontSize > minSize) {
    if (wrapText(text, maxWidth, fontSize, weight, lineLimit + 1).length <= lineLimit) break;
    fontSize -= 1;
  }
  return fontSize;
}

function drawProfileLine(text, y, font, weight = 460, minSize = 23 * cardScale()) {
  if (!text) return y;
  const { x, maxWidth } = currentFormat().layout.profile;
  const size = fitFontForLines(text, maxWidth, font, weight, minSize);
  const lines = wrapText(text, maxWidth, size, weight);
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = cardFont(weight, size);
  ctx.textBaseline = "top";
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * size * 1.15, maxWidth));
  ctx.restore();
  return y + Math.max(1, lines.length) * size * 1.15;
}

function drawProfile() {
  const name = fields.name.value.trim() || "Your name";
  const role = fields.role.value.trim() || "Your title";
  const region = fields.region.value.trim();
  const organisation = fields.organisation.value.trim();
  const unit = cardScale();
  let y = currentFormat().layout.profile.y;

  y = drawProfileLine(name, y, 37 * unit, 680, 24 * unit);
  const titleAndRegion = [role, region].filter(Boolean).join(", ");
  y = drawProfileLine(titleAndRegion, y + 5 * unit, 31 * unit, 460, 22 * unit);
  drawProfileLine(organisation, y + 3 * unit, 27 * unit, 460, 21 * unit);
}

function drawPortrait() {
  const unit = cardScale();
  const { x, y, size } = currentFormat().layout.portrait;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 13 * unit, 0, Math.PI * 2);
  const ring = ctx.createLinearGradient(x, y, x + size, y + size);
  ring.addColorStop(0, "#FF007F");
  ring.addColorStop(0.52, "#FF596E");
  ring.addColorStop(1, "#FF9000");
  ctx.strokeStyle = ring;
  ctx.lineWidth = 12 * unit;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.clip();

  if (state.photo) {
    const baseScale = Math.max(size / state.photo.width, size / state.photo.height) * state.photoZoom;
    const imageWidth = state.photo.width * baseScale;
    const imageHeight = state.photo.height * baseScale;
    const horizontalTravel = Math.max(0, (imageWidth - size) / 2);
    const verticalTravel = Math.max(0, (imageHeight - size) / 2);
    const imageX = centerX - imageWidth / 2 + state.photoHorizontal * horizontalTravel;
    const imageY = centerY - imageHeight / 2 + state.photoVertical * verticalTravel;
    ctx.drawImage(state.photo, imageX, imageY, imageWidth, imageHeight);
  } else {
    ctx.fillStyle = "#111922";
    ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#DCE4EA";
    ctx.font = cardFont(560, 25 * unit);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Upload", centerX, centerY - 16 * unit);
    ctx.fillText("portrait", centerX, centerY + 16 * unit);
  }
  ctx.restore();
}

function drawLogo() {
  if (!state.logo) return;
  const { x, y, width, height } = currentFormat().layout.logo;
  const aspect = state.logo.width / state.logo.height;
  let drawWidth = width;
  let drawHeight = drawWidth / aspect;
  if (drawHeight > height) {
    drawHeight = height;
    drawWidth = drawHeight * aspect;
  }
  ctx.drawImage(state.logo, x + width - drawWidth, y, drawWidth, drawHeight);
}

function hasMatchingConcentricMaster() {
  return ["square", "landscape"].includes(fields.socialFormat.value);
}

function currentConcentricMaster() {
  if (fields.socialFormat.value === "landscape") return state.concentricLandscape;
  if (fields.socialFormat.value === "square") return state.concentricSquare;
  return null;
}

function ensureMasterSupported() {
  if (currentBackgroundMode() !== "concentric-circles" || hasMatchingConcentricMaster()) return;
  form.querySelector('input[name="background-mode"][value="generic"]').checked = true;
  setStatus("The supplied concentric-circle masters are available in Square and Landscape. Switched to Splunk glow and grid for this placement.");
}

function drawBackground() {
  const mode = currentBackgroundMode();
  const { width, height } = currentFormat();
  if (mode === "concentric-circles") {
    const master = currentConcentricMaster();
    if (master) drawImageCover(master, 0, 0, width, height);
    else {
      ctx.fillStyle = "#0B1118";
      ctx.fillRect(0, 0, width, height);
    }
    return;
  }

  ctx.fillStyle = "#0B1118";
  ctx.fillRect(0, 0, width, height);
  const background = mode === "upload" && state.customBackground ? state.customBackground : state.genericBackground;
  if (background) drawImageCover(background, 0, 0, width, height);

  if (mode === "upload" && fields.overlay.checked) {
    const overlay = ctx.createLinearGradient(0, 0, width, 0);
    overlay.addColorStop(0, "rgba(4,7,11,0.74)");
    overlay.addColorStop(0.56, "rgba(4,7,11,0.26)");
    overlay.addColorStop(1, "rgba(4,7,11,0)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);
  }
}

function renderCard() {
  const { width, height, layout } = currentFormat();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.clearRect(0, 0, width, height);
  drawBackground();
  if (!(currentBackgroundMode() === "concentric-circles" && hasMatchingConcentricMaster())) drawLogo();

  drawText(intentCopy(fields.intent.value), { ...layout.eyebrow, weight: 650, color: "#FFFFFF" });
  drawText(fields.title.value.trim() || "Event name", { ...layout.title, weight: 680, gradient: true });
  drawText(fields.location.value.trim() || "City 2026", { ...layout.location, weight: 650, color: "#FFFFFF" });
  drawText(fields.date.value.trim(), { ...layout.date, weight: 450, color: "#FFFFFF" });
  drawProfile();
  drawPortrait();
}

async function handleImageUpload(input, target) {
  const [file] = input.files;
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    setStatus("Please upload a PNG, JPEG, or WebP image.");
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    state[target] = await loadImage(url);
    if (target === "photo") {
      const isNarrowPortrait = state.photo.height > state.photo.width;
      state.photoZoom = isNarrowPortrait ? 1.16 : 1;
      state.photoHorizontal = 0;
      state.photoVertical = 0;
      fields.photoZoom.value = String(state.photoZoom);
      fields.photoHorizontal.value = "0";
      fields.photoVertical.value = "0";
      photoCropNote.textContent = isNarrowPortrait
        ? "We added a little zoom so you can move this portrait left or right. Increase Photo zoom for more control."
        : "Tip: increase Photo zoom to give yourself more room to reposition the image.";
      setStatus("Photo ready.");
    } else {
      setStatus("Event background ready.");
    }
    renderCard();
  } catch {
    setStatus("That image could not be opened. Please choose another file.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function copyCaption() {
  const text = fields.caption.value.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Caption copied.");
  } catch {
    fields.caption.focus();
    fields.caption.select();
    setStatus("Select and copy the caption from the text field.");
  }
}

async function downloadCard() {
  await loadCardLanguageFont().catch(() => {});
  renderCard();
  const filePart = (value, fallback) => {
    const cleaned = (value || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, "-")
      .replace(/^-|-$/g, "");
    return cleaned || fallback;
  };
  const title = filePart(fields.title.value, "event-card");
  const name = filePart(fields.name.value, "splunk");
  const format = fields.socialFormat.value || "square";
  const link = document.createElement("a");
  link.download = `${name}-${title}-${format}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  const { width, height } = currentFormat();
  setStatus(`Card downloaded as a ${width} × ${height} PNG.`);
}

function toggleBackgroundUpload() {
  const isUpload = currentBackgroundMode() === "upload";
  backgroundUploadWrap.classList.toggle("is-hidden", !isUpload);
  renderCard();
}

function toggleCustomEventTitle() {
  const isCustom = fields.eventPreset.value === "custom";
  customEventTitleWrap.classList.toggle("is-hidden", !isCustom);
  if (!isCustom) fields.title.value = fields.eventPreset.value;
  updateCaption();
  renderCard();
}

function toggleThirdPartyNote() {
  thirdPartyNote.classList.toggle("is-hidden", fields.owner.value !== "third-party");
}

function bindEvents() {
  form.addEventListener("input", (event) => {
    if (event.target === fields.caption) {
      state.captionEdited = true;
      return;
    }
    if (event.target === fields.photoZoom) state.photoZoom = Number(fields.photoZoom.value);
    if (event.target === fields.photoHorizontal) state.photoHorizontal = Number(fields.photoHorizontal.value);
    if (event.target === fields.photoVertical) state.photoVertical = Number(fields.photoVertical.value);
    updateCaption();
    renderCard();
  });

  form.addEventListener("change", (event) => {
    if (event.target.name === "background-mode") {
      toggleBackgroundUpload();
    }
    if (event.target === fields.eventPreset) toggleCustomEventTitle();
    if (event.target === fields.owner) toggleThirdPartyNote();
    if (event.target === fields.platform) {
      updateSocialFormats();
      ensureMasterSupported();
      renderCard();
    }
    if (event.target === fields.socialFormat) {
      updatePreviewMeta();
      ensureMasterSupported();
      renderCard();
    }
    if (event.target === fields.language) {
      loadCardLanguageFont().catch(() => {}).finally(renderCard);
    }
    if (event.target === fields.photo) {
      handleImageUpload(fields.photo, "photo");
      photoControls.classList.remove("is-hidden");
    }
    if (event.target === fields.background) handleImageUpload(fields.background, "customBackground");
    if (event.target === fields.overlay) renderCard();
  });

  document.querySelector("#download-card").addEventListener("click", downloadCard);
  document.querySelector("#copy-caption").addEventListener("click", copyCaption);
  document.querySelector("#open-linkedin").addEventListener("click", async () => {
    await copyCaption();
    window.open("https://www.linkedin.com/feed/", "_blank", "noopener,noreferrer");
  });
  document.querySelector("#reset-caption").addEventListener("click", () => {
    state.captionEdited = false;
    updateCaption(true);
    setStatus("Suggested caption restored.");
  });
}

async function start() {
  try {
    const [background, logo, concentricSquare, concentricLandscape] = await Promise.all([
      loadImage("assets/generic-event-background.png"),
      loadImage("assets/splunk-corporate-white.png"),
      loadImage("assets/concentric-circles-square.png"),
      loadImage("assets/concentric-circles-landscape.png"),
    ]);
    state.genericBackground = background;
    state.logo = logo;
    state.concentricSquare = concentricSquare;
    state.concentricLandscape = concentricLandscape;
    updateSocialFormats();
    loadCardLanguageFont().catch(() => {}).finally(renderCard);
    updateCaption(true);
    renderCard();
  } catch {
    setStatus("The approved brand assets could not be loaded. Please refresh the page.");
  }
  bindEvents();
}

start();

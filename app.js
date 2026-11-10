const canvas = document.querySelector("#card-canvas");
const ctx = canvas.getContext("2d");

const form = document.querySelector("#card-form");
const fields = {
  owner: document.querySelector("#event-owner"),
  eventPreset: document.querySelector("#event-preset"),
  title: document.querySelector("#event-title"),
  location: document.querySelector("#event-location"),
  dateMode: document.querySelector("#event-date-mode"),
  date: document.querySelector("#event-date"),
  startDate: document.querySelector("#event-start-date"),
  endDate: document.querySelector("#event-end-date"),
  startTime: document.querySelector("#event-start-time"),
  endTime: document.querySelector("#event-end-time"),
  timeZone: document.querySelector("#event-time-zone"),
  booth: document.querySelector("#event-booth"),
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
const singleDateWrap = document.querySelector("#single-date-wrap");
const dateRangeWrap = document.querySelector("#date-range-wrap");
const thirdPartyNote = document.querySelector("#third-party-note");
const profileCardFields = document.querySelector("#profile-card-fields");
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
let webinarStudio = null;
let eventStudio = null;
let personalLayoutResult = null;

const socialFormats = {
  square: { label: "Square post — 1080 × 1080", width: 1080, height: 1080 },
  landscape: { label: "Landscape post — 1200 × 627", width: 1200, height: 627 },
  portrait: { label: "Portrait feed — 1080 × 1350", width: 1080, height: 1350 },
  story: { label: "Story / Status — 1080 × 1920", width: 1080, height: 1920 },
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
    copy: { speaking: "I am speaking at", attending: "I am attending", meet: "Meet me at", banner: "Join us at" },
  },
  ko: {
    locale: "ko",
    fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", Arial, sans-serif',
    fontName: "Noto Sans KR",
    copy: { speaking: "발표자로 참여합니다", attending: "행사에 참석합니다", meet: "행사에서 만나요", banner: "행사에서 만나요" },
  },
  "zh-Hans": {
    locale: "zh-CN",
    fontFamily: '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", Arial, sans-serif',
    fontName: "Noto Sans SC",
    copy: { speaking: "我将在本次活动演讲", attending: "我将参加本次活动", meet: "活动现场见", banner: "欢迎参加" },
  },
  "zh-Hant": {
    locale: "zh-TW",
    fontFamily: '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", Arial, sans-serif',
    fontName: "Noto Sans TC",
    copy: { speaking: "我將在本次活動演講", attending: "我將參加本次活動", meet: "活動現場見", banner: "歡迎參加" },
  },
  th: {
    locale: "th",
    fontFamily: '"Noto Sans Thai", "Thonburi", Tahoma, Arial, sans-serif',
    fontName: "Noto Sans Thai",
    copy: { speaking: "ร่วมเป็นวิทยากร", attending: "เข้าร่วมงาน", meet: "พบกันที่งาน", banner: "พบกันที่งาน" },
  },
  ja: {
    locale: "ja",
    fontFamily: '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", Arial, sans-serif',
    fontName: "Noto Sans JP",
    copy: { speaking: "登壇します", attending: "参加します", meet: "会場で会いましょう", banner: "会場で会いましょう" },
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

function dateFromValue(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateValue(value, includeWeekday = false) {
  const date = dateFromValue(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(currentLanguage().locale, {
    ...(includeWeekday ? { weekday: "long" } : {}),
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formattedDate() {
  if (fields.dateMode.value === "single") return formatDateValue(fields.date.value, true);

  const startValue = fields.startDate.value;
  const endValue = fields.endDate.value;
  if (!startValue && !endValue) return "";
  if (!startValue) return formatDateValue(endValue);
  if (!endValue) return formatDateValue(startValue);

  const start = dateFromValue(startValue);
  const end = dateFromValue(endValue);
  const locale = currentLanguage().locale;
  if (locale === "en" && start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
    const month = new Intl.DateTimeFormat(locale, { month: "long" }).format(start);
    return `${month} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${formatDateValue(startValue)}–${formatDateValue(endValue)}`;
}

function formattedTime() {
  const startValue = fields.startTime.value;
  const endValue = fields.endTime.value;
  if (!startValue && !endValue) return "";

  const formatPart = (value) => {
    const [hours, minutes] = value.split(":").map(Number);
    const suffix = hours >= 12 ? "pm" : "am";
    const hour = hours % 12 || 12;
    return { text: `${hour}${minutes ? `:${String(minutes).padStart(2, "0")}` : ""}`, suffix };
  };

  const start = startValue ? formatPart(startValue) : null;
  const end = endValue ? formatPart(endValue) : null;
  let result = "";
  if (start && end && start.suffix === end.suffix) result = `${start.text}–${end.text} ${end.suffix}`;
  else if (start && end) result = `${start.text} ${start.suffix}–${end.text} ${end.suffix}`;
  else result = `${(start || end).text} ${(start || end).suffix}`;
  return `${result}${fields.timeZone.value ? ` ${fields.timeZone.value}` : ""}`;
}

function formattedBooth() {
  const booth = fields.booth.value.trim();
  return booth ? `Booth ${booth}` : "";
}

function suggestedCaption() {
  if (eventStudio?.isActive()) return eventStudio.caption();
  if (webinarStudio?.isActive()) return webinarStudio.caption();
  const title = fields.title.value.trim();
  const place = titleCaseLocation(fields.location.value.trim());
  const date = formattedDate();
  const time = formattedTime();
  const booth = formattedBooth();
  const link = fields.registration.value.trim();
  const lines = [];
  if (title) {
    const lead = fields.intent.value === "banner" ? "Join us at" : captionLead(fields.intent.value);
    lines.push(`${lead} ${title}${place ? ` in ${place}` : ""}.`);
  }
  if (booth) lines.push(`Meet us at ${booth}.`);
  if (date) lines.push(fields.intent.value === "banner" ? `Save the date: ${date}.` : `Join me on ${date}.`);
  if (time) lines.push(`Time: ${time}.`);
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


function hasMatchingConcentricMaster() {
  return ["square", "landscape"].includes(fields.socialFormat.value);
}

function currentConcentricMaster() {
  if (fields.socialFormat.value === "landscape") return state.concentricLandscape;
  if (fields.socialFormat.value === "square") return state.concentricSquare;
  return null;
}

function ensureMasterSupported() {
  if (eventStudio?.isActive()) return;
  if (webinarStudio?.isActive()) return;
  if (currentBackgroundMode() !== "concentric-circles" || hasMatchingConcentricMaster()) return;
  form.querySelector('input[name="background-mode"][value="generic"]').checked = true;
  setStatus("The supplied concentric-circle masters are available in Square and Landscape. Switched to Splunk glow and grid for this placement.");
}


function renderCard() {
  const feedback = document.querySelector('#personal-layout-feedback');
  feedback.classList.add('is-hidden');
  if (eventStudio?.isActive()) {
    eventStudio.render();
    return;
  }
  if (webinarStudio?.isActive()) {
    webinarStudio.render();
    return;
  }
  const { width, height } = currentFormat();
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const mode = currentBackgroundMode();
  const background = mode === 'concentric-circles' ? currentConcentricMaster() : mode === 'upload' && state.customBackground ? state.customBackground : state.genericBackground;
  personalLayoutResult = PersonalRenderer.render({
    ctx, width, height, language: currentLanguage(),
    data: {
      intent: fields.intent.value, eyebrow: intentCopy(fields.intent.value),
      title: fields.title.value.trim(), location: fields.location.value.trim(),
      booth: formattedBooth(), date: formattedDate(), time: formattedTime(),
      name: fields.name.value.trim(), role: fields.role.value.trim(),
      region: fields.region.value.trim(), organisation: fields.organisation.value.trim(),
      zoom: state.photoZoom, photoX: state.photoHorizontal, photoY: state.photoVertical,
      overlay: mode === 'upload' && fields.overlay.checked,
    },
    assets: { background, logo: state.logo, photo: state.photo },
  });
  if (fields.dateMode.value === 'range' && fields.startDate.value && fields.endDate.value && fields.endDate.value < fields.startDate.value) {
    personalLayoutResult.errors.push('The end date must be on or after the start date.');
  }
  feedback.replaceChildren();
  personalLayoutResult.errors.forEach(message => { const p = document.createElement('p'); p.textContent = message; feedback.appendChild(p); });
  feedback.classList.toggle('is-hidden', personalLayoutResult.errors.length === 0);
  document.querySelector('#download-card').disabled = personalLayoutResult.errors.length > 0;
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
  if (eventStudio?.isActive()) return eventStudio.downloadCurrent();
  if (webinarStudio?.isActive()) return webinarStudio.downloadCurrent();
  await loadCardLanguageFont().catch(() => {});
  renderCard();
  if (personalLayoutResult?.errors.length) {
    setStatus('Resolve the layout notes before downloading.');
    return;
  }
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

function toggleDateMode() {
  const isRange = fields.dateMode.value === "range";
  singleDateWrap.classList.toggle("is-hidden", isRange);
  dateRangeWrap.classList.toggle("is-hidden", !isRange);
  updateCaption();
  renderCard();
}

function toggleCardMode() {
  const isBanner = fields.intent.value === "banner";
  profileCardFields.classList.toggle("is-hidden", isBanner);
  updateCaption();
  renderCard();
}

function toggleCustomEventTitle() {
  const isCustom = fields.eventPreset.value === "custom";
  customEventTitleWrap.classList.toggle("is-hidden", !isCustom);
  fields.title.value = isCustom ? "" : fields.eventPreset.value;
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
    if (event.target === fields.dateMode) toggleDateMode();
    if (event.target === fields.intent) toggleCardMode();
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
    setStatus("Suggested caption applied.");
  });
}

async function start() {
  try {
    const [background, logo, concentricSquare, concentricLandscape] = await Promise.all([
      loadImage("assets/generic-event-background.png"),
      loadImage("assets/splunk-by-cisco-white.svg"),
      loadImage("assets/concentric-circles-square-background.png"),
      loadImage("assets/concentric-circles-landscape-background.png"),
    ]);
    state.genericBackground = background;
    state.logo = logo;
    state.concentricSquare = concentricSquare;
    state.concentricLandscape = concentricLandscape;
    webinarStudio = new WebinarStudio({
      canvas, fields, getFormat: currentFormat, getLanguage: currentLanguage,
      renderCard, updateCaption, setStatus, loadFont: loadCardLanguageFont,
      onModeChange: () => {
        state.captionEdited = false;
        updatePreviewMeta();
        if (document.querySelector('#creative-mode').value === 'personal') ensureMasterSupported();
      },
    });
    await webinarStudio.loadAssets();
    eventStudio = new EventStudio({
      canvas, fields, getFormat: currentFormat, getLanguage: currentLanguage,
      renderCard, updateCaption, setStatus, loadFont: loadCardLanguageFont,
      getAssets: () => webinarStudio.assets,
    });
    toggleCustomEventTitle();
    toggleDateMode();
    toggleCardMode();
    updateSocialFormats();
    loadCardLanguageFont().catch(() => {}).finally(renderCard);
    updateCaption(true);
    renderCard();
  } catch {
    setStatus("The approved brand assets could not be loaded. Please refresh the page.");
    if (state.logo && state.genericBackground) renderCard();
  }
  bindEvents();
}

start();

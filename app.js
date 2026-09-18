const canvas = document.querySelector("#card-canvas");
const ctx = canvas.getContext("2d");

const form = document.querySelector("#card-form");
const fields = {
  owner: document.querySelector("#event-owner"),
  title: document.querySelector("#event-title"),
  location: document.querySelector("#event-location"),
  date: document.querySelector("#event-date"),
  intent: document.querySelector("#card-intent"),
  name: document.querySelector("#person-name"),
  role: document.querySelector("#person-role"),
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
const thirdPartyNote = document.querySelector("#third-party-note");
const photoControls = document.querySelector("#photo-controls");
const actionStatus = document.querySelector("#action-status");

const state = {
  genericBackground: null,
  customBackground: null,
  logo: null,
  photo: null,
  photoZoom: 1,
  photoHorizontal: 0,
  photoVertical: 0,
  captionEdited: false,
};

const CARD = 1200;
const SOURCE = 1080;
const s = CARD / SOURCE;
const layout = {
  eyebrow: { x: 72 * s, y: 156 * s, maxWidth: 830 * s, font: 52 * s },
  title: { x: 72 * s, y: 246 * s, maxWidth: 965 * s, font: 74 * s },
  location: { x: 72 * s, y: 334 * s, maxWidth: 600 * s, font: 80 * s },
  date: { x: 78 * s, y: 448 * s, maxWidth: 650 * s, font: 40 * s },
  name: { x: 188 * s, y: 636 * s, maxWidth: 390 * s, font: 37 * s },
  role: { x: 188 * s, y: 690 * s, maxWidth: 380 * s, font: 31 * s },
  portrait: { x: 560 * s, y: 468 * s, size: 445 * s },
  logo: { x: 824 * s, y: 20 * s, width: 220 * s, height: 119 * s },
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

function intentCopy(intent) {
  return {
    speaking: "I am speaking at",
    attending: "I am attending",
    meet: "Meet me at",
  }[intent];
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
    ctx.font = `${weight} ${fontSize}px Inter, Arial, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) break;
    fontSize -= 1;
  }
  return fontSize;
}

function drawText(text, { x, y, maxWidth, font, weight = 500, color = "#FFFFFF", gradient = false }) {
  const size = fitFont(text, maxWidth, font, weight);
  ctx.save();
  ctx.font = `${weight} ${size}px Inter, Arial, sans-serif`;
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

function wrapText(text, maxWidth, fontSize, weight = 500) {
  ctx.save();
  ctx.font = `${weight} ${fontSize}px Inter, Arial, sans-serif`;
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  ctx.restore();
  return lines.slice(0, 2);
}

function drawRole(text) {
  const { x, y, maxWidth, font } = layout.role;
  const size = fitFont(text, maxWidth, font, 460, 23 * s);
  const lines = wrapText(text, maxWidth, size, 460);
  ctx.save();
  ctx.fillStyle = "#FFFFFF";
  ctx.font = `460 ${size}px Inter, Arial, sans-serif`;
  ctx.textBaseline = "top";
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * size * 1.15, maxWidth));
  ctx.restore();
}

function drawPortrait() {
  const { x, y, size } = layout.portrait;
  const centerX = x + size / 2;
  const centerY = y + size / 2;
  const radius = size / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 13 * s, 0, Math.PI * 2);
  const ring = ctx.createLinearGradient(x, y, x + size, y + size);
  ring.addColorStop(0, "#FF007F");
  ring.addColorStop(0.52, "#FF596E");
  ring.addColorStop(1, "#FF9000");
  ctx.strokeStyle = ring;
  ctx.lineWidth = 12 * s;
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
    ctx.font = `560 ${25 * s}px Inter, Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Upload", centerX, centerY - 16 * s);
    ctx.fillText("portrait", centerX, centerY + 16 * s);
  }
  ctx.restore();
}

function drawLogo() {
  if (!state.logo) return;
  const { x, y, width, height } = layout.logo;
  const aspect = state.logo.width / state.logo.height;
  let drawWidth = width;
  let drawHeight = drawWidth / aspect;
  if (drawHeight > height) {
    drawHeight = height;
    drawWidth = drawHeight * aspect;
  }
  ctx.drawImage(state.logo, x + width - drawWidth, y, drawWidth, drawHeight);
}

function drawBackground() {
  ctx.fillStyle = "#0B1118";
  ctx.fillRect(0, 0, CARD, CARD);
  const background = currentBackgroundMode() === "upload" && state.customBackground ? state.customBackground : state.genericBackground;
  if (background) drawImageCover(background, 0, 0, CARD, CARD);

  if (currentBackgroundMode() === "upload" && fields.overlay.checked) {
    const overlay = ctx.createLinearGradient(0, 0, CARD, 0);
    overlay.addColorStop(0, "rgba(4,7,11,0.74)");
    overlay.addColorStop(0.56, "rgba(4,7,11,0.26)");
    overlay.addColorStop(1, "rgba(4,7,11,0)");
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, CARD, CARD);
  }
}

function renderCard() {
  ctx.clearRect(0, 0, CARD, CARD);
  drawBackground();
  drawLogo();

  drawText(intentCopy(fields.intent.value), { ...layout.eyebrow, weight: 650, color: "#FFFFFF" });
  drawText(fields.title.value.trim() || "Event name", { ...layout.title, weight: 680, gradient: true });
  drawText(fields.location.value.trim() || "City 2026", { ...layout.location, weight: 650, color: "#FFFFFF" });
  drawText(fields.date.value.trim(), { ...layout.date, weight: 450, color: "#FFFFFF" });
  drawText(fields.name.value.trim() || "Your name", { ...layout.name, weight: 680, color: "#FFFFFF" });
  drawRole(fields.role.value.trim() || "Your title, Splunk");
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
    setStatus(`${target === "photo" ? "Photo" : "Background"} ready. It remains in this browser.`);
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

function downloadCard() {
  const title = (fields.title.value || "event-card").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const name = (fields.name.value || "splunk").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const link = document.createElement("a");
  link.download = `${name}-${title || "event-card"}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  setStatus("Card downloaded as a 1200 × 1200 PNG.");
}

function toggleBackgroundUpload() {
  const isUpload = currentBackgroundMode() === "upload";
  backgroundUploadWrap.classList.toggle("is-hidden", !isUpload);
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
    if (event.target.name === "background-mode") toggleBackgroundUpload();
    if (event.target === fields.owner) toggleThirdPartyNote();
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
    const [background, logo] = await Promise.all([
      loadImage("assets/generic-event-background.png"),
      loadImage("assets/splunk-corporate-white.png"),
      document.fonts.ready,
    ]);
    state.genericBackground = background;
    state.logo = logo;
    updateCaption(true);
    renderCard();
  } catch {
    setStatus("The approved brand assets could not be loaded. Please refresh the page.");
  }
  bindEvents();
}

start();

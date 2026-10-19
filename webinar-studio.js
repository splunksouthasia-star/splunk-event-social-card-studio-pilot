/* Browser form/controller. Images and programme data are never uploaded. */
(function () {
  'use strict';
  const R = window.WebinarRenderer;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let sequence = 0;
  const uid = prefix => `${prefix}-${++sequence}`;
  const slug = value => String(value || 'webinar').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 100) || 'webinar';
  const session = () => ({ id: uid('session'), title: '', subtitle: '', date: '', start: '', end: '', zone: 'Asia/Singapore', link: '', speakerIds: [] });
  const speaker = () => ({ id: uid('speaker'), name: '', title: '', organisation: '', role: 'speaker', photo: null, zoom: 1.16, x: 0, y: 0 });
  const input = (id, label, value, attrs = '') => `<label for="${id}">${label}</label><input id="${id}" value="${escape(value)}" ${attrs}>`;
  const options = (items, current) => items.map(([v, label]) => `<option value="${escape(v)}"${v === current ? ' selected' : ''}>${escape(label)}</option>`).join('');
  const select = (id, label, items, current, attrs = '') => `<label for="${id}">${label}</label><select id="${id}" ${attrs}>${options(items, current)}</select>`;
  function zipFiles(files) {
    // ZIP store (uncompressed PNGs): interoperable and no third-party upload/service.
    const encoder = new TextEncoder();
    const chunks = [], directory = [];
    let offset = 0;
    const crc32 = bytes => {
      let crc = -1;
      for (const byte of bytes) { crc ^= byte; for (let n = 0; n < 8; n++) crc = (crc >>> 1) ^ (0xEDB88320 & -(crc & 1)); }
      return (crc ^ -1) >>> 0;
    };
    files.forEach(({ name, bytes }) => {
      const filename = encoder.encode(name), crc = crc32(bytes);
      const local = new Uint8Array(30 + filename.length), l = new DataView(local.buffer);
      l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true);
      l.setUint32(14, crc, true); l.setUint32(18, bytes.length, true); l.setUint32(22, bytes.length, true); l.setUint16(26, filename.length, true); local.set(filename, 30);
      const central = new Uint8Array(46 + filename.length), c = new DataView(central.buffer);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x800, true);
      c.setUint32(16, crc, true); c.setUint32(20, bytes.length, true); c.setUint32(24, bytes.length, true); c.setUint16(28, filename.length, true); c.setUint32(42, offset, true); central.set(filename, 46);
      chunks.push(local, bytes); directory.push(central); offset += local.length + bytes.length;
    });
    const size = directory.reduce((sum, a) => sum + a.length, 0);
    const end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, size, true); e.setUint32(16, offset, true);
    return new Blob([...chunks, ...directory, end], { type: 'application/zip' });
  }
  function download(blob, name) {
    const url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  class WebinarStudio {
    constructor(config) {
      this.config = config;
      this.host = document.querySelector('#webinar-controls');
      this.mode = document.querySelector('#creative-mode');
      this.packButton = document.querySelector('#download-webinar-set');
      this.summary = document.querySelector('#webinar-layout-summary');
      this.feedback = document.querySelector('#webinar-layout-feedback');
      this.data = { mode: 'series', title: '', eyebrow: '', tagline: '', description: '', theme: 'light-glow', topicLayout: 'rows', speakerLayout: 'auto', speakerDetail: 'compact', cta: 'register', ctaText: '', ctaNote: '', extraZones: ['', ''], sessions: [session()], speakers: [], language: 'en', personalPack: false };
      this.view = { type: 'overview' };
      this.assets = {};
      this.assetsReady = false;
      this.renderForm();
      this.bind();
    }
    async loadAssets() {
      const files = { whiteLogo: 'splunk-by-cisco-white.svg', blackLogo: 'splunk-by-cisco-black.svg', hero: 'webinar-hero.png', angular: 'webinar-angular.png', lightGlow: 'webinar-light-glow.png', darkGlow: 'webinar-dark-glow.png' };
      await Promise.all(Object.entries(files).map(async ([key, file]) => {
        this.assets[key] = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = `assets/${file}`; });
      }));
      this.assetsReady = true;
    }
    isActive() { return this.mode.value !== 'personal'; }
    sessions() { return this.mode.value === 'webinar' ? this.data.sessions.slice(0, 1) : this.data.sessions; }
    snapshot() { return { ...this.data, mode: this.mode.value, language: this.config.fields.language.value, registration: this.config.fields.registration.value.trim() }; }
    notify(forceCaption = false) { this.config.updateCaption(forceCaption); this.config.renderCard(); }
    renderForm() {
      const d = this.data;
      this.host.innerHTML = `<section class="form-section">
        <div class="section-heading"><h2>Programme</h2></div>
        <p class="field-note">Build one webinar, or up to three sessions. Blank fields stay off the artwork.</p>
        ${input('wb-title', 'Programme title', d.title, 'type="text" maxlength="110" data-programme="title" placeholder="Your webinar or series title"')}
        ${input('wb-eyebrow', 'Region / eyebrow <span class="optional">optional</span>', d.eyebrow, 'type="text" maxlength="65" data-programme="eyebrow" placeholder="e.g., APJC / WEBINAR SERIES"')}
        ${input('wb-tagline', 'Tagline <span class="optional">optional</span>', d.tagline, 'type="text" maxlength="85" data-programme="tagline"')}
        ${input('wb-description', 'Supporting line <span class="optional">optional</span>', d.description, 'type="text" maxlength="115" data-programme="description"')}
        ${select('wb-theme', 'Visual style', [['light-glow', 'Light · glow and signal curves'], ['dark-glow', 'Dark · glow and signal curves'], ['light-angular', 'Light · angular brand artwork'], ['light-soft', 'Light · soft glow / gradient edge'], ['dark-hero', 'Dark · glass hero artwork']], d.theme, 'data-programme="theme"')}
        <p class="field-note">Five styles based on your supplied webinar references. The personal-card templates remain available in Personal event card mode.</p>
        <div class="two-column">${select('wb-topic-layout', 'Topic arrangement', [['rows', 'Stacked rows'], ['columns', 'Side-by-side columns']], d.topicLayout, 'data-programme="topicLayout"')}${select('wb-speaker-layout', 'Speaker arrangement', [['auto', 'Automatic (recommended)'], ['row', 'Horizontal row'], ['column', 'Vertical side panel'], ['grid', '2 × 2 grid']], d.speakerLayout, 'data-programme="speakerLayout"')}</div>
        ${select('wb-speaker-detail', 'Speaker details on artwork', [['compact', 'Names only · compact'], ['full', 'Name, title and organisation']], d.speakerDetail, 'data-programme="speakerDetail"')}
        <button type="button" class="text-button" data-action="example">Try a three-session example</button>
      </section>
      <section class="form-section"><div class="section-heading"><h2>Sessions <span class="optional">maximum 3</span></h2></div>
        <p class="field-note">Use one entry per date / topic. For the same topic on multiple dates, duplicate the session and change its date. Times are optional and use the selected source time zone.</p>
        <div id="wb-session-list"></div>
        <button type="button" class="secondary-button" id="wb-add-session" data-action="add-session">+ Add session</button>
        <p id="wb-single-note" class="field-note is-hidden">Webinar mode shows the first session. Switch to Webinar series to restore the other sessions.</p>
        <h3 class="subheading">Additional display time zones</h3>
        <p class="field-note">The source time is always included. Add up to two more zones; conversions use each session’s date, including daylight saving.</p>
        <div class="two-column">${select('wb-extra-zone-0', 'Additional zone 1', [['', 'None'], ...R.ZONES], d.extraZones[0], 'data-extra-zone="0"')}${select('wb-extra-zone-1', 'Additional zone 2', [['', 'None'], ...R.ZONES], d.extraZones[1], 'data-extra-zone="1"')}</div>
      </section>
      <section class="form-section"><div class="section-heading"><h2>Speakers <span class="optional">0–4 per graphic</span></h2></div>
        <p class="field-note">Leave this empty for an event-led banner. Add speakers, then select who appears in each session. Photos are optional. Use a clear square image of at least 800 × 800 px; portrait images work too.</p>
        <div id="wb-speaker-list"></div><button type="button" class="secondary-button" id="wb-add-speaker" data-action="add-speaker">+ Add speaker</button>
      </section>
      <section class="form-section"><div class="section-heading"><h2>Call to action & output</h2></div>
        ${select('wb-cta', 'Call to action', [['register', 'Register (translated with card language)'], ['custom', 'Custom wording'], ['none', 'No CTA']], d.cta, 'data-programme="cta"')}
        <div id="wb-custom-cta" class="${d.cta === 'custom' ? '' : 'is-hidden'}">${input('wb-cta-text', 'Custom CTA wording', d.ctaText, 'type="text" maxlength="40" data-programme="ctaText"')}</div>
        ${input('wb-cta-note', 'CTA supporting note <span class="optional">optional</span>', d.ctaNote, 'type="text" maxlength="70" data-programme="ctaNote" placeholder="e.g., Register once. Select your sessions."')}
        <p class="field-note">Add the registration URL in Caption below. A PNG cannot contain a clickable registration button.</p>
        ${select('wb-output', 'Preview / download', [['overview', 'Full programme overview'], ['session', 'Individual session'], ['speaker', 'Personal speaker card']], this.view.type)}
        <div id="wb-output-session-wrap">${select('wb-output-session', 'Choose session', [], '')}</div>
        <div id="wb-output-speaker-wrap">${select('wb-output-speaker', 'Choose speaker', [], '')}</div>
        <label class="check-option"><input id="wb-personal-pack" type="checkbox"${d.personalPack ? ' checked' : ''}><span>Include personal speaker cards in the ZIP pack</span></label>
        <p class="field-note">The ZIP includes the programme overview, each session and suggested captions. Personal cards follow your speaker assignments. The pack uses your current format and visual style.</p>
      </section>`;
      this.renderLists();
    }
    renderLists() {
      const sessions = this.sessions();
      document.querySelector('#wb-session-list').innerHTML = sessions.map((s, i) => `<fieldset class="repeat-card" data-session-id="${s.id}"><legend>Session ${i + 1}</legend>
        ${input(`${s.id}-title`, 'Session topic', s.title, 'type="text" maxlength="90" data-session="title"')}
        ${input(`${s.id}-subtitle`, 'Supporting line <span class="optional">optional</span>', s.subtitle, 'type="text" maxlength="100" data-session="subtitle"')}
        ${input(`${s.id}-date`, 'Date <span class="optional">optional</span>', s.date, 'type="date" data-session="date"')}
        <div class="two-column">${input(`${s.id}-start`, 'Start time <span class="optional">optional</span>', s.start, 'type="time" data-session="start"')}${input(`${s.id}-end`, 'End time <span class="optional">optional</span>', s.end, 'type="time" data-session="end"')}</div>
        ${select(`${s.id}-zone`, 'Source time zone', R.ZONES, s.zone, 'data-session="zone"')}
        ${input(`${s.id}-link`, 'Session registration URL <span class="optional">optional</span>', s.link, 'type="url" data-session="link" placeholder="Uses the programme link if blank"')}
        <div class="assignment-list" id="${s.id}-assignments"></div>
        <div class="repeat-actions"><button type="button" class="text-button" data-action="up-session"${i === 0 ? ' disabled' : ''}>Move up</button><button type="button" class="text-button" data-action="duplicate-session"${this.data.sessions.length >= 3 || this.mode.value === 'webinar' ? ' disabled' : ''}>Duplicate</button><button type="button" class="text-button" data-action="remove-session"${this.data.sessions.length === 1 ? ' disabled' : ''}>Remove</button></div>
      </fieldset>`).join('');
      document.querySelector('#wb-speaker-list').innerHTML = this.data.speakers.map((s, i) => `<fieldset class="repeat-card" data-speaker-id="${s.id}"><legend>Speaker ${i + 1}</legend>
        ${input(`${s.id}-name`, 'Name', s.name, 'type="text" maxlength="60" data-speaker="name"')}
        ${input(`${s.id}-title`, 'Job title <span class="optional">optional</span>', s.title, 'type="text" maxlength="105" data-speaker="title"')}
        ${input(`${s.id}-organisation`, 'Organisation <span class="optional">optional</span>', s.organisation, 'type="text" maxlength="60" data-speaker="organisation"')}
        ${select(`${s.id}-role`, 'Role', [['speaker', 'Speaker'], ['moderator', 'Moderator']], s.role, 'data-speaker="role"')}
        <label for="${s.id}-photo">Photo <span class="optional">optional</span></label><input id="${s.id}-photo" type="file" accept="image/png,image/jpeg,image/webp" data-speaker-photo>
        ${s.photo ? `<p class="field-note">Photo loaded. Choose a file to replace it.</p><button type="button" class="text-button" data-action="remove-photo">Remove photo</button><div class="two-column">${input(`${s.id}-zoom`, 'Photo zoom', s.zoom, 'type="range" min="1" max="3" step="0.01" data-speaker="zoom"')}${input(`${s.id}-x`, 'Move left / right', s.x, 'type="range" min="-1" max="1" step="0.01" data-speaker="x"')}</div>${input(`${s.id}-y`, 'Move up / down', s.y, 'type="range" min="-1" max="1" step="0.01" data-speaker="y"')}<p class="field-note">Increase zoom for more room to move the photo.</p>` : ''}
        <div class="repeat-actions"><button type="button" class="text-button" data-action="up-speaker"${i === 0 ? ' disabled' : ''}>Move up</button><button type="button" class="text-button" data-action="remove-speaker">Remove speaker</button></div>
      </fieldset>`).join('');
      document.querySelector('#wb-add-session').disabled = this.data.sessions.length >= 3 || this.mode.value === 'webinar';
      document.querySelector('#wb-add-session').classList.toggle('is-hidden', this.mode.value === 'webinar');
      document.querySelector('#wb-single-note').classList.toggle('is-hidden', this.mode.value !== 'webinar' || this.data.sessions.length < 2);
      document.querySelector('#wb-add-speaker').disabled = this.data.speakers.length >= 4;
      this.updateAssignments(); this.updateViewControls();
    }
    updateAssignments() {
      this.sessions().forEach(s => {
        document.getElementById(`${s.id}-assignments`).innerHTML = this.data.speakers.length ? `<p class="field-note">Speakers in this session</p>${this.data.speakers.map((p, i) => `<label class="check-option"><input type="checkbox" data-assignment="${p.id}"${s.speakerIds.includes(p.id) ? ' checked' : ''}><span>${escape(p.name || `Speaker ${i + 1}`)}</span></label>`).join('')}` : '';
      });
    }
    updateViewControls() {
      const sessions = this.sessions();
      if (!sessions.some(s => s.id === this.view.sessionId)) this.view.sessionId = sessions[0].id;
      document.querySelector('#wb-output-session').innerHTML = options(sessions.map((s, i) => [s.id, s.title || `Session ${i + 1}`]), this.view.sessionId);
      const assigned = this.data.speakers.filter(s => sessions.find(p => p.id === this.view.sessionId).speakerIds.includes(s.id));
      if (!assigned.some(s => s.id === this.view.speakerId)) this.view.speakerId = assigned[0]?.id || '';
      document.querySelector('#wb-output-speaker').innerHTML = options(assigned.length ? assigned.map((s, i) => [s.id, s.name || `Speaker ${i + 1}`]) : [['', 'Assign a speaker to this session first']], this.view.speakerId);
      document.querySelector('#wb-output-session-wrap').classList.toggle('is-hidden', this.view.type === 'overview');
      document.querySelector('#wb-output-speaker-wrap').classList.toggle('is-hidden', this.view.type !== 'speaker');
    }
    switchMode() {
      const active = this.isActive();
      document.body.classList.toggle('webinar-mode', active);
      this.host.classList.toggle('is-hidden', !active); this.packButton.classList.toggle('is-hidden', !active);
      this.summary.classList.toggle('is-hidden', !active); this.feedback.classList.add('is-hidden');
      document.querySelector('#format-section-heading').textContent = active ? 'Social format' : 'Event';
      if (active) this.renderLists();
      this.config.onModeChange(); this.notify(true);
    }
    bind() {
      this.mode.addEventListener('change', () => this.switchMode());
      this.host.addEventListener('input', event => {
        const t = event.target;
        if (t.dataset.programme) this.data[t.dataset.programme] = t.value;
        if (t.dataset.extraZone !== undefined) this.data.extraZones[Number(t.dataset.extraZone)] = t.value;
        if (t.dataset.session) { const s = this.data.sessions.find(s => s.id === t.closest('[data-session-id]').dataset.sessionId); s[t.dataset.session] = t.value; if (t.dataset.session === 'title') this.updateViewControls(); }
        if (t.dataset.speaker) { const s = this.data.speakers.find(s => s.id === t.closest('[data-speaker-id]').dataset.speakerId); s[t.dataset.speaker] = ['zoom', 'x', 'y'].includes(t.dataset.speaker) ? Number(t.value) : t.value; if (t.dataset.speaker === 'name') { this.updateAssignments(); this.updateViewControls(); } }
        if (t.dataset.assignment) { const s = this.data.sessions.find(s => s.id === t.closest('[data-session-id]').dataset.sessionId); s.speakerIds = t.checked ? [...new Set([...s.speakerIds, t.dataset.assignment])] : s.speakerIds.filter(id => id !== t.dataset.assignment); this.updateViewControls(); }
        if (t.id === 'wb-cta') document.querySelector('#wb-custom-cta').classList.toggle('is-hidden', t.value !== 'custom');
        if (t.id === 'wb-output') { this.view.type = t.value; this.updateViewControls(); }
        if (t.id === 'wb-output-session') { this.view.sessionId = t.value; this.updateViewControls(); }
        if (t.id === 'wb-output-speaker') this.view.speakerId = t.value;
        if (t.id === 'wb-personal-pack') this.data.personalPack = t.checked;
        this.notify();
      });
      this.host.addEventListener('change', async event => {
        if (!event.target.hasAttribute('data-speaker-photo')) return;
        const file = event.target.files[0]; if (!file) return;
        const s = this.data.speakers.find(s => s.id === event.target.closest('[data-speaker-id]').dataset.speakerId);
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { this.config.setStatus('Choose a PNG, JPEG or WebP photo.'); return; }
        const url = URL.createObjectURL(file);
        try { s.photo = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url; }); s.zoom = 1.16; s.x = 0; s.y = 0; this.renderLists(); this.notify(); }
        catch { this.config.setStatus('That photo could not be opened. Try another image.'); }
        finally { URL.revokeObjectURL(url); }
      });
      this.host.addEventListener('click', event => {
        const button = event.target.closest('[data-action]'); if (!button) return;
        const action = button.dataset.action;
        const sid = button.closest('[data-session-id]')?.dataset.sessionId;
        const pid = button.closest('[data-speaker-id]')?.dataset.speakerId;
        const d = this.data;
        if (action === 'add-session' && d.sessions.length < 3) { const s = session(); s.speakerIds = d.speakers.map(p => p.id); d.sessions.push(s); }
        if (action === 'duplicate-session' && d.sessions.length < 3) { const s = d.sessions.find(s => s.id === sid); d.sessions.splice(d.sessions.indexOf(s) + 1, 0, { ...s, id: uid('session'), speakerIds: [...s.speakerIds] }); }
        if (action === 'remove-session' && d.sessions.length > 1) d.sessions = d.sessions.filter(s => s.id !== sid);
        if (action === 'up-session') { const i = d.sessions.findIndex(s => s.id === sid); if (i > 0) [d.sessions[i - 1], d.sessions[i]] = [d.sessions[i], d.sessions[i - 1]]; }
        if (action === 'add-speaker' && d.speakers.length < 4) { const p = speaker(); d.speakers.push(p); d.sessions.forEach(s => s.speakerIds.push(p.id)); }
        if (action === 'remove-speaker') { d.speakers = d.speakers.filter(s => s.id !== pid); d.sessions.forEach(s => s.speakerIds = s.speakerIds.filter(id => id !== pid)); }
        if (action === 'up-speaker') { const i = d.speakers.findIndex(s => s.id === pid); if (i > 0) [d.speakers[i - 1], d.speakers[i]] = [d.speakers[i], d.speakers[i - 1]]; }
        if (action === 'remove-photo') d.speakers.find(s => s.id === pid).photo = null;
        if (action === 'example') {
          if ((d.title || d.sessions.some(s => s.title) || d.speakers.length) && !window.confirm('Replace this webinar draft with an example? Your personal event card will not change.')) return;
          d.title = 'Agentic AI Observability Webinar Series'; d.eyebrow = 'APJC / THREE-PART WEBINAR SERIES'; d.tagline = 'Understand. Evaluate. Protect.'; d.description = 'Splunk Agent Observability, powered by Galileo'; d.ctaNote = 'Register once. Select your sessions.';
          d.speakers = Array.from({ length: 4 }, (_, i) => ({ ...speaker(), name: `Example speaker ${i + 1}`, title: 'Solutions Architect', organisation: 'Splunk' }));
          d.sessions = [['2026-10-29', 'When the Agent Fails:', 'Seeing Inside Multi-Agent Systems'], ['2026-11-26', 'Is the Agent Right?', 'Continuous Evaluation for AI Quality'], ['2026-12-10', 'Stop Bad Behaviour', 'Before It Reaches Users']].map(([date, title, subtitle]) => ({ ...session(), date, title, subtitle, start: '12:00', speakerIds: d.speakers.map(p => p.id) }));
          d.extraZones = ['Asia/Kolkata', 'Australia/Sydney']; this.mode.value = 'series'; this.view.type = 'overview'; this.renderForm(); this.switchMode(); return;
        }
        this.renderLists(); this.notify();
      });
      this.packButton.addEventListener('click', () => this.downloadPack());
    }
    draw(canvas, view = this.view) {
      const format = this.config.getFormat();
      if (canvas.width !== format.width || canvas.height !== format.height) { canvas.width = format.width; canvas.height = format.height; }
      const result = R.render({ ctx: canvas.getContext('2d'), width: format.width, height: format.height, data: this.snapshot(), assets: this.assets, view, language: this.config.getLanguage() });
      if (!this.assetsReady) result.errors.push('Brand artwork is not ready. Refresh the page before downloading.');
      return result;
    }
    render() {
      const result = this.draw(this.config.canvas);
      this.result = result;
      this.summary.textContent = result.summary;
      this.feedback.replaceChildren();
      [...result.errors, ...result.notices].forEach(message => { const p = document.createElement('p'); p.textContent = message; this.feedback.appendChild(p); });
      this.feedback.classList.toggle('is-hidden', !result.errors.length && !result.notices.length);
      this.feedback.classList.toggle('has-errors', result.errors.length > 0);
      document.querySelector('#download-card').disabled = result.errors.length > 0;
    }
    caption(view = this.view) {
      const d = this.snapshot(), selected = R.selectData(d, view);
      const parts = [];
      const name = selected.speakers[0]?.name;
      const title = d.title || selected.sessions[0]?.title;
      if (title) parts.push(view.type === 'speaker' ? `I’m speaking at ${title}.` : `Join us for ${title}.`);
      if (view.type === 'speaker' && name) parts.push(`${name} · ${selected.speakers[0].title || ''}`.replace(/ · $/, ''));
      if (d.tagline) parts.push(d.tagline);
      selected.sessions.forEach(s => { const line = [R.displayDate(s.date, this.config.getLanguage().locale), s.title, s.subtitle, R.sessionTimes(s, d.extraZones, this.config.getLanguage().locale)].filter(Boolean).join(' · '); if (line) parts.push(line); });
      const link = view.type !== 'overview' && selected.sessions[0]?.link ? selected.sessions[0].link : d.registration;
      if (link && /^https?:\/\//i.test(link)) parts.push(`Register: ${link}`);
      parts.push('#Splunk #Cisco');
      return parts.join('\n\n');
    }
    async downloadCurrent() {
      await this.config.loadFont().catch(() => {});
      this.render();
      if (this.result.errors.length) { this.config.setStatus('Resolve the layout notes before downloading.'); return; }
      const blob = await new Promise(resolve => this.config.canvas.toBlob(resolve, 'image/png'));
      if (!blob) { this.config.setStatus('Could not create the PNG. Please try again.'); return; }
      const selected = R.selectData(this.snapshot(), this.view);
      const suffix = this.view.type === 'overview' ? 'programme' : this.view.type === 'speaker' ? `${slug(selected.speakers[0]?.name)}-${slug(selected.sessions[0]?.title)}` : slug(selected.sessions[0]?.title);
      download(blob, `${slug(this.data.title)}-${suffix}-${this.config.fields.socialFormat.value}.png`);
      this.config.setStatus('PNG downloaded.');
    }
    packViews() {
      const views = [{ type: 'overview', name: '01-programme' }];
      this.sessions().forEach((s, i) => {
        views.push({ type: 'session', sessionId: s.id, name: `0${i + 2}-session-${i + 1}` });
        if (this.data.personalPack) this.data.speakers.filter(p => s.speakerIds.includes(p.id)).forEach((p, j) => views.push({ type: 'speaker', sessionId: s.id, speakerId: p.id, name: `session-${i + 1}-speaker-${j + 1}-${slug(p.name)}` }));
      });
      return views;
    }
    async downloadPack() {
      this.packButton.disabled = true;
      const c = document.createElement('canvas');
      try {
        await this.config.loadFont().catch(() => {});
        const views = this.packViews();
        for (const view of views) {
          const result = this.draw(c, view);
          if (result.errors.length) { this.config.setStatus(`Pack not downloaded: ${view.name} needs adjustment. ${result.errors[0]}`); return; }
        }
        const files = [], captions = [];
        for (const view of views) {
          this.config.setStatus(`Preparing ${view.name}…`);
          this.draw(c, view);
          const blob = await new Promise(resolve => c.toBlob(resolve, 'image/png'));
          if (!blob) throw new Error('PNG encoding failed');
          files.push({ name: `${view.name}.png`, bytes: new Uint8Array(await blob.arrayBuffer()) });
          captions.push(`${view.name}\n${this.caption(view)}`);
        }
        files.push({ name: 'captions.txt', bytes: new TextEncoder().encode(captions.join('\n\n--------------------\n\n')) });
        download(zipFiles(files), `${slug(this.data.title)}-${this.config.fields.socialFormat.value}-pack.zip`);
        this.config.setStatus(`Programme pack downloaded: ${views.length} PNGs and suggested captions. Your edited caption stays in the studio.`);
      } catch { this.config.setStatus('Could not create the pack. Please try again or download individual cards.'); }
      finally { this.packButton.disabled = false; }
    }
  }
  window.WebinarStudio = WebinarStudio;
})();

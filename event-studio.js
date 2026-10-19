/* Multi-speaker event form. All text and photographs remain in this browser. */
(function () {
  'use strict';
  const R = window.EventRenderer;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const opts = (items, current) => items.map(([value, label]) => `<option value="${esc(value)}"${value === String(current) ? ' selected' : ''}>${esc(label)}</option>`).join('');
  const input = (id, label, value, attr = '') => `<label for="${id}">${label}</label><input id="${id}" value="${esc(value)}" ${attr}>`;
  const select = (id, label, items, value, attr = '') => `<label for="${id}">${label}</label><select id="${id}" ${attr}>${opts(items, value)}</select>`;
  const optional = '<span class="optional">optional</span>';
  const newSpeaker = () => ({ name: '', title: '', organisation: '', photo: null, zoom: 1.16, x: 0, y: 0 });
  class EventStudio {
    constructor(config) {
      this.config = config;
      this.mode = document.querySelector('#creative-mode');
      this.host = document.querySelector('#multi-event-controls');
      this.summary = document.querySelector('#webinar-layout-summary');
      this.feedback = document.querySelector('#webinar-layout-feedback');
      this.data = { preset: 'Splunk Experience Day', customTitle: '', city: '', venue: '', dateMode: 'single', startDate: '', endDate: '', startTime: '', endTime: '', zone: 'Asia/Singapore', booth: '', intro: 'meet', cardCaption: '', cta: 'register', ctaText: '', ctaNote: '', speakerCount: '3', layout: 'vertical', theme: 'light-glow', speakers: Array.from({ length: 3 }, newSpeaker) };
      this.renderForm(); this.bind();
    }
    isActive() { return this.mode.value === 'multi-event'; }
    snapshot() { return { ...this.data, language: this.config.fields.language.value, registration: this.config.fields.registration.value.trim() }; }
    notify() { this.config.updateCaption(); this.config.renderCard(); }
    renderForm() {
      const d = this.data;
      this.host.innerHTML = `<section class="form-section"><div class="section-heading"><h2>Multi-speaker event</h2></div>
        <p class="field-note">Create an event card with two or three speakers. Empty optional fields are left off the artwork.</p>
        ${select('me-preset', 'Event name', [['Splunk Experience Day', 'Splunk Experience Day'], ['.conf Unpacked', '.conf Unpacked'], ['Splunk GO', 'Splunk GO'], ['custom', 'Custom event name']], d.preset, 'data-event="preset"')}
        <p class="field-note">Choose a standard event, or select Custom event name to type your own.</p>
        <div id="me-custom-title-wrap">${input('me-custom-title', 'Custom event name', d.customTitle, 'type="text" maxlength="90" data-event="customTitle"')}</div>
        ${input('me-city', `City / location ${optional}`, d.city, 'type="text" maxlength="60" data-event="city"')}
        ${input('me-venue', `Venue ${optional}`, d.venue, 'type="text" maxlength="100" data-event="venue"')}
        ${select('me-date-mode', 'Event dates', [['single', 'Single day'], ['range', 'Date range']], d.dateMode, 'data-event="dateMode"')}
        <div class="two-column">${input('me-start-date', `Date / start date ${optional}`, d.startDate, 'type="date" data-event="startDate"')}<div id="me-end-date-wrap">${input('me-end-date', 'End date', d.endDate, 'type="date" data-event="endDate"')}</div></div>
        <p class="field-note">Use the date picker. Leave the date blank—or both dates for a range—to hide it.</p>
        <details class="event-optional-details"><summary>Optional time and booth details</summary>
          <div class="two-column">${input('me-start-time', `Start time ${optional}`, d.startTime, 'type="time" data-event="startTime"')}${input('me-end-time', `End time ${optional}`, d.endTime, 'type="time" data-event="endTime"')}</div>
          ${select('me-zone', 'Local time zone', window.WebinarRenderer.ZONES, d.zone, 'data-event="zone"')}
          ${input('me-booth', `Booth number ${optional}`, d.booth, 'type="text" maxlength="20" data-event="booth"')}
        </details>
      </section>
      <section class="form-section"><div class="section-heading"><h2>Layout & card wording</h2></div>
        <div class="two-column">${select('me-speaker-count', 'Number of speakers', [['2', '2 speakers'], ['3', '3 speakers']], d.speakerCount, 'data-event="speakerCount"')}${select('me-layout', 'Speaker layout', [['horizontal', 'Horizontal · side by side'], ['vertical', 'Vertical · stacked on the right']], d.layout, 'data-event="layout"')}</div>
        ${select('me-theme', 'Card style', [['light-glow', 'Light · glow and signal curves'], ['dark-glow', 'Dark · glow and signal curves']], d.theme, 'data-event="theme"')}
        ${select('me-intro', 'Intro line', [['meet', 'Meet our speakers'], ['join', 'Join us'], ['none', 'No intro line']], d.intro, 'data-event="intro"')}
        <label for="me-card-caption">On-card caption / event theme ${optional}</label>
        <textarea id="me-card-caption" rows="3" maxlength="110" data-event="cardCaption" placeholder="Type your event theme or short supporting headline">${esc(d.cardCaption)}</textarea>
        <p class="field-note">This appears on the image. Write your own wording and line breaks, use the suggestion below, or leave it blank to hide it. The social-post caption remains separately editable in Caption below.</p>
        <button type="button" class="text-button" data-me-action="suggest-theme">Use suggested theme</button>
        ${select('me-cta', 'Call to action', [['register', 'Register now (translated with card language)'], ['custom', 'Custom wording'], ['none', 'No CTA']], d.cta, 'data-event="cta"')}
        <div id="me-custom-cta-wrap">${input('me-cta-text', 'Custom CTA wording', d.ctaText, 'type="text" maxlength="32" data-event="ctaText"')}</div>
        ${input('me-cta-note', `CTA supporting note ${optional}`, d.ctaNote, 'type="text" maxlength="55" data-event="ctaNote"')}
        <p class="field-note">The image’s CTA is visual, not clickable. Add the registration URL in Caption below.</p>
        <button type="button" class="text-button" data-me-action="example">Try the approved layout example</button>
      </section>
      <section class="form-section"><div class="section-heading"><h2>Speakers</h2></div>
        <p class="field-note">Enter a name or professional details, or upload a photo for each selected speaker. Photos are optional. Recommended: a clear square photo at least 800 × 800 px; portrait photos work too. PNG, JPEG or WebP, up to 20 MB.</p>
        <div id="me-speaker-list"></div><p id="me-retained-speaker-note" class="field-note is-hidden">Speaker 3’s details are retained. Choose 3 speakers to show them again.</p>
      </section>`;
      this.updateVisibility(); this.renderSpeakers();
    }
    updateVisibility() {
      document.querySelector('#me-custom-title-wrap').classList.toggle('is-hidden', this.data.preset !== 'custom');
      document.querySelector('#me-end-date-wrap').classList.toggle('is-hidden', this.data.dateMode !== 'range');
      document.querySelector('#me-custom-cta-wrap').classList.toggle('is-hidden', this.data.cta !== 'custom');
    }
    renderSpeakers() {
      document.querySelector('#me-speaker-list').innerHTML = R.selectedSpeakers(this.data).map((s, i) => `<fieldset class="repeat-card" data-me-speaker="${i}"><legend>Speaker ${i + 1}</legend>
        ${input(`me-speaker-${i}-name`, 'Name', s.name, 'type="text" maxlength="60" data-profile="name"')}
        ${input(`me-speaker-${i}-title`, `Job title ${optional}`, s.title, 'type="text" maxlength="105" data-profile="title"')}
        ${input(`me-speaker-${i}-organisation`, `Organisation ${optional}`, s.organisation, 'type="text" maxlength="60" data-profile="organisation"')}
        <label for="me-speaker-${i}-photo">Photo ${optional}</label><input id="me-speaker-${i}-photo" type="file" accept="image/png,image/jpeg,image/webp" data-me-photo>
        ${s.photo ? `<p class="field-note">Photo loaded. Choose another file to replace it.</p><button type="button" class="text-button" data-me-action="remove-photo">Remove photo</button>
          ${input(`me-speaker-${i}-zoom`, 'Photo zoom', s.zoom, 'type="range" min="1" max="3" step="0.01" data-profile="zoom"')}
          ${input(`me-speaker-${i}-x`, 'Move left / right', s.x, 'type="range" min="-1" max="1" step="0.01" data-profile="x"')}
          ${input(`me-speaker-${i}-y`, 'Move up / down', s.y, 'type="range" min="-1" max="1" step="0.01" data-profile="y"')}
          <p class="field-note">Increase zoom for more room to reposition the photo.</p>` : ''}
        <button type="button" class="text-button" data-me-action="move-up"${i === 0 ? ' disabled' : ''}>Move speaker up</button>
      </fieldset>`).join('');
      const third = this.data.speakers[2];
      const retained = this.data.speakerCount === '2' && (third.photo || third.name || third.title || third.organisation);
      document.querySelector('#me-retained-speaker-note').classList.toggle('is-hidden', !retained);
    }
    switchMode() {
      const active = this.isActive();
      document.body.classList.toggle('multi-event-mode', active);
      this.host.classList.toggle('is-hidden', !active);
      if (!active) return;
      document.querySelector('#format-section-heading').textContent = 'Social format';
      this.summary.classList.remove('is-hidden');
      this.notify();
    }
    bind() {
      this.mode.addEventListener('change', () => this.switchMode());
      this.host.addEventListener('input', event => {
        const t = event.target;
        if (t.dataset.event) {
          this.data[t.dataset.event] = t.value;
          this.updateVisibility();
          if (t.dataset.event === 'speakerCount') this.renderSpeakers();
        }
        if (t.dataset.profile) {
          const s = this.data.speakers[Number(t.closest('[data-me-speaker]').dataset.meSpeaker)];
          s[t.dataset.profile] = ['zoom', 'x', 'y'].includes(t.dataset.profile) ? Number(t.value) : t.value;
        }
        this.notify();
      });
      this.host.addEventListener('change', async event => {
        if (!event.target.hasAttribute('data-me-photo')) return;
        const file = event.target.files[0]; if (!file) return;
        if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) { this.config.setStatus('Choose a PNG, JPEG or WebP photo no larger than 20 MB.'); return; }
        const s = this.data.speakers[Number(event.target.closest('[data-me-speaker]').dataset.meSpeaker)];
        const url = URL.createObjectURL(file);
        try {
          const image = await new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url; });
          s.photo = image; s.zoom = 1.16; s.x = 0; s.y = 0;
          this.renderSpeakers(); this.notify(); this.config.setStatus('Speaker photo ready.');
        } catch { this.config.setStatus('That photo could not be opened. Please choose another file.'); }
        finally { URL.revokeObjectURL(url); }
      });
      this.host.addEventListener('click', event => {
        const t = event.target.closest('[data-me-action]'); if (!t) return;
        const action = t.dataset.meAction;
        const i = Number(t.closest('[data-me-speaker]')?.dataset.meSpeaker);
        if (action === 'suggest-theme') {
          this.data.cardCaption = 'Security. Observability.\nResilience in action.';
          document.querySelector('#me-card-caption').value = this.data.cardCaption;
        }
        if (action === 'remove-photo') { this.data.speakers[i].photo = null; this.renderSpeakers(); }
        if (action === 'move-up' && i > 0) { [this.data.speakers[i - 1], this.data.speakers[i]] = [this.data.speakers[i], this.data.speakers[i - 1]]; this.renderSpeakers(); }
        if (action === 'example') {
          const populated = this.data.city || this.data.venue || this.data.cardCaption || this.data.customTitle || this.data.speakers.some(s => s.photo || s.name || s.title || s.organisation);
          if (populated && !window.confirm('Replace this multi-speaker event draft with the layout example? Other studio modes will not change.')) return;
          this.data = { ...this.data, preset: 'Splunk Experience Day', customTitle: '', city: 'Singapore', venue: 'Event venue · Singapore', dateMode: 'range', startDate: '2026-11-05', endDate: '2026-11-07', startTime: '', endTime: '', booth: '', intro: 'meet', cardCaption: 'Security. Observability.\nResilience in action.', cta: 'register', ctaNote: 'Join us in person.', speakerCount: '3', layout: 'vertical', theme: 'light-glow', speakers: ['Speaker One', 'Speaker Two', 'Speaker Three'].map(name => ({ ...newSpeaker(), name, title: 'Job title', organisation: 'Organisation' })) };
          this.renderForm();
        }
        this.notify();
      });
    }
    render() {
      const { canvas } = this.config, format = this.config.getFormat();
      if (canvas.width !== format.width || canvas.height !== format.height) { canvas.width = format.width; canvas.height = format.height; }
      const result = R.render({ ctx: canvas.getContext('2d'), width: format.width, height: format.height, data: this.snapshot(), assets: this.config.getAssets(), language: this.config.getLanguage() });
      this.result = result; this.summary.textContent = result.summary;
      this.feedback.replaceChildren();
      [...result.errors, ...result.notices].forEach(message => { const p = document.createElement('p'); p.textContent = message; this.feedback.appendChild(p); });
      this.feedback.classList.toggle('is-hidden', !result.errors.length && !result.notices.length);
      this.feedback.classList.toggle('has-errors', result.errors.length > 0);
      document.querySelector('#download-card').disabled = result.errors.length > 0;
    }
    caption() { return R.caption(this.snapshot(), this.config.getLanguage().locale); }
    async downloadCurrent() {
      await this.config.loadFont().catch(() => {}); this.render();
      if (this.result.errors.length) { this.config.setStatus('Resolve the layout notes before downloading.'); return; }
      const blob = await new Promise(resolve => this.config.canvas.toBlob(resolve, 'image/png'));
      if (!blob) { this.config.setStatus('Could not create the PNG. Please try again.'); return; }
      const slug = R.eventTitle(this.data).normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'event';
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = `${slug}-${this.data.speakerCount}-speakers-${this.data.layout}-${this.config.fields.socialFormat.value}.png`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 30000);
      this.config.setStatus('Multi-speaker event card downloaded as a PNG.');
    }
  }
  window.EventStudio = EventStudio;
})();

import { hotels } from './data.js?v=6';

export const HOTEL_NOTES_KEY = 'reisekompass-hotel-notes-v1';
let current = null;
let recording = null;
const dialog = document.createElement('dialog');
dialog.id = 'hotelNotesDialog';
dialog.className = 'dialog hotel-notes-dialog';
dialog.setAttribute('aria-labelledby', 'hotelNotesHeading');
dialog.innerHTML = `<div>
  <div class="dialog-head"><div><p class="eyebrow dark">MEINE HOTELNOTIZEN</p><h2 id="hotelNotesHeading"></h2></div><button type="button" class="icon-button" id="hotelNotesClose" aria-label="Notizen schließen">×</button></div>
  <label class="hotel-note-field">Meine Notizen<textarea id="hotelNoteText" rows="9" placeholder="Was gefällt dir? Was möchtest du vor der Buchung prüfen?"></textarea></label>
  <button type="button" class="button primary" id="hotelNoteDictate">🎙 Auf Deutsch diktieren</button>
  <p class="hotel-note-help">Änderungen werden auf diesem Gerät gespeichert. Diktat benötigt einen unterstützten Browser und eine Mikrofonfreigabe. Je nach Sprachdienst wird Audio online verarbeitet.</p>
  <div id="hotelNoteSpeechControls" class="dialog-actions" hidden><button type="button" class="button primary" id="hotelNoteStop">Fertig gesprochen</button><button type="button" class="button ghost" id="hotelNoteCancel">Diktat abbrechen</button></div>
  <p id="hotelNotePreview" aria-live="polite"></p><div id="hotelNoteAlternatives"></div>
  <p id="hotelNoteStatus" role="status" aria-live="polite"></p>
  <div class="dialog-actions"><button type="button" class="button ghost" id="hotelNoteCopy">Text kopieren</button><button type="button" class="button primary" id="hotelNoteDone">Speichern & schließen</button></div>
</div>`;
document.body.append(dialog);
const el = id => document.getElementById(id);
const field = el('hotelNoteText');
const status = text => { el('hotelNoteStatus').textContent = text; };

function readNotes() {
  const notes = JSON.parse(localStorage.getItem(HOTEL_NOTES_KEY) || '{}');
  if (!notes || typeof notes !== 'object' || Array.isArray(notes) || Object.values(notes).some(note => !note || typeof note.text !== 'string')) throw new Error('Ungültiger Notizenspeicher');
  return notes;
}
export function hotelNoteLabel(id) {
  try { return readNotes()[id]?.text.trim() ? '📝 Notizen bearbeiten' : '📝 Notizen'; }
  catch { return '📝 Notizen'; }
}
function updateButtons() {
  for (const button of document.querySelectorAll('[data-hotel-note]')) button.textContent = hotelNoteLabel(button.dataset.hotelNote);
}
function save() {
  if (!current) return false;
  try {
    const notes = readNotes();
    if ((notes[current.id]?.text || '') !== field.value) {
      if (field.value) notes[current.id] = { text: field.value, updatedAt: new Date().toISOString() };
      else delete notes[current.id];
      localStorage.setItem(HOTEL_NOTES_KEY, JSON.stringify(notes));
    }
    status('Notiz auf diesem Gerät gespeichert.');
    updateButtons();
    return true;
  } catch {
    status('Nicht gespeichert. Bitte Speicherplatz prüfen und diesen Text geöffnet lassen. Mit „Text kopieren“ kannst du ihn sichern.');
    return false;
  }
}
function speechUI() {
  field.readOnly = !!recording;
  el('hotelNoteDictate').disabled = !!recording;
  el('hotelNoteSpeechControls').hidden = !recording;
}
function cancelSpeech(message = 'Diktat abgebrochen. Vorhandener Text bleibt erhalten.') {
  if (!recording) return;
  const session = recording;
  recording = null;
  clearTimeout(session.timer);
  try { session.recognition.abort(); } catch {}
  speechUI();
  el('hotelNotePreview').textContent = '';
  status(message);
}
function finish() {
  cancelSpeech();
  if (save()) dialog.close();
}
export function openHotelNotes(id) {
  const hotel = hotels.find(hotel => hotel.id === id);
  if (!hotel) return;
  if (dialog.open) { finish(); if (dialog.open) return; }
  current = { id };
  el('hotelNotesHeading').textContent = hotel.name;
  field.value = '';
  el('hotelNoteAlternatives').replaceChildren();
  el('hotelNotePreview').textContent = '';
  try { field.value = readNotes()[id]?.text || ''; status('Notizen nur für dieses Hotel · automatische lokale Speicherung'); }
  catch { status('Die gespeicherten Notizen konnten nicht gelesen werden. Bitte Browserdaten nicht löschen. Du kannst vorhandenen Text über „Text kopieren“ sichern.'); }
  speechUI();
  dialog.showModal();
}
function startSpeech() {
  if (recording || !save()) return;
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) { status('Dieser Browser bietet kein direktes Diktat. Nutze das Mikrofon deiner Handy-Tastatur oder öffne ReiseKompass in Chrome.'); return; }
  const owner = current;
  let recognition;
  try { recognition = new Recognition(); }
  catch { status('Spracherkennung konnte nicht starten. Nutze bei Bedarf das Mikrofon deiner Tastatur.'); return; }
  const session = { recognition, owner, before: field.value, expected: field.value, start: field.selectionStart, end: field.selectionEnd, finals: [], timer: null, saved: true, started: false };
  recording = session;
  recognition.lang = 'de-DE';
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 3;
  el('hotelNoteAlternatives').replaceChildren();
  speechUI();
  status('Mikrofon wird gestartet …');
  const active = () => recording === session && current === owner && dialog.open;
  const apply = text => {
    if (current !== owner || !dialog.open || field.value !== session.expected) {
      el('hotelNoteAlternatives').replaceChildren();
      cancelSpeech('Der Text wurde inzwischen bearbeitet. Bitte direkt im Text korrigieren.');
      return false;
    }
    const left = session.before.slice(0, session.start), right = session.before.slice(session.end);
    const insert = (left && !/\s$/.test(left) ? ' ' : '') + text + (right && !/^\s/.test(right) ? ' ' : '');
    field.value = left + insert + right;
    session.expected = field.value;
    field.setSelectionRange(left.length + insert.length, left.length + insert.length);
    session.saved = save();
    return true;
  };
  recognition.onstart = () => {
    if (!active()) return;
    if (document.hidden) { cancelSpeech(); return; }
    session.started = true;
    clearTimeout(session.timer);
    session.timer = setTimeout(() => cancelSpeech('Diktat nach 90 Sekunden beendet. Bitte erneut starten.'), 90000);
    status('Du kannst jetzt auf Deutsch sprechen.');
  };
  recognition.onresult = event => {
    if (!active()) return;
    const partial = [];
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) session.finals[i] = result[0].transcript.trim();
      else partial.push(result[0].transcript);
    }
    el('hotelNotePreview').textContent = partial.join(' ');
    const text = session.finals.filter(Boolean).join(' ');
    if (!text || !apply(text)) return;
    const alternatives = el('hotelNoteAlternatives');
    alternatives.replaceChildren();
    if (event.results.length === 1 && event.results[0].isFinal && event.results[0].length > 1) {
      const choices = [...new Set(Array.from(event.results[0], result => result.transcript.trim()).filter(Boolean))];
      if (choices.length > 1) {
        const label = document.createElement('label'); label.textContent = 'Andere Erkennung wählen';
        const select = document.createElement('select'); select.setAttribute('aria-label', 'Andere Erkennung wählen');
        choices.forEach(text => select.add(new Option(text, text)));
        select.onchange = () => apply(select.value);
        label.append(select); alternatives.append(label);
      }
    }
  };
  recognition.onerror = event => {
    if (!active()) return;
    const messages = { 'not-allowed': 'Mikrofonzugriff nicht erlaubt. Bitte die Mikrofonfreigabe in den Browser-Einstellungen prüfen.', 'service-not-allowed': 'Der Browser erlaubt diesen Sprachdienst nicht. Nutze das Mikrofon deiner Tastatur.', 'audio-capture': 'Kein Mikrofon verfügbar. Bitte dein Mikrofon prüfen.', 'network': 'Der Sprachdienst ist nicht erreichbar. Bitte Internetverbindung prüfen.', 'no-speech': 'Keine Sprache erkannt. Bitte erneut versuchen.' };
    cancelSpeech(messages[event.error] || 'Diktat konnte nicht fortgesetzt werden. Vorhandener Text bleibt erhalten.');
  };
  recognition.onend = () => {
    if (!active()) return;
    recording = null;
    clearTimeout(session.timer);
    speechUI(); el('hotelNotePreview').textContent = '';
    if (session.saved) status(session.finals.some(Boolean) ? 'Diktat gespeichert. Bitte den erkannten Text prüfen.' : 'Nichts erkannt. Du kannst das Diktat erneut starten.');
  };
  session.timer = setTimeout(() => cancelSpeech('Das Mikrofon antwortet nicht. Bitte Freigabe prüfen und erneut versuchen.'), 12000);
  try { recognition.start(); } catch { cancelSpeech('Mikrofon konnte nicht starten. Bitte erneut versuchen.'); }
}
field.addEventListener('input', () => { el('hotelNoteAlternatives').replaceChildren(); save(); });
el('hotelNoteDictate').onclick = startSpeech;
el('hotelNoteStop').onclick = () => { if (recording) try { recording.recognition.stop(); } catch { cancelSpeech(); } };
el('hotelNoteCancel').onclick = () => cancelSpeech();
el('hotelNoteDone').onclick = finish;
el('hotelNotesClose').onclick = finish;
el('hotelNoteCopy').onclick = async () => {
  try { await navigator.clipboard.writeText(field.value); status('Text kopiert.'); }
  catch { field.focus(); field.select(); status('Bitte den markierten Text über das Textmenü kopieren.'); }
};
dialog.addEventListener('click', event => { if (event.target === dialog) { event.stopImmediatePropagation(); finish(); } });
dialog.addEventListener('cancel', event => { event.preventDefault(); finish(); });
dialog.addEventListener('close', () => { if (!dialog.open) { cancelSpeech(); current = null; } });
window.addEventListener('pagehide', () => { if (dialog.open) { cancelSpeech(); save(); } });
document.addEventListener('visibilitychange', () => { if (document.hidden && recording?.started) cancelSpeech(); });
document.addEventListener('click', event => { const button = event.target.closest('[data-hotel-note]'); if (button) openHotelNotes(button.dataset.hotelNote); });

/* Explicit, key-free German grammar checking via LanguageTool's public API. */
export const GRAMMAR_ENDPOINT = 'https://api.languagetool.org/v2/check';

export function correctionProposal(text, matches, protectedTerms = []) {
  const protectedRanges = [];
  for (const term of protectedTerms.filter(term => term.length >= 3)) {
    let from = 0, start;
    while ((start = text.toLocaleLowerCase('de').indexOf(term.toLocaleLowerCase('de'), from)) !== -1) {
      protectedRanges.push([start, start + term.length]); from = start + term.length;
    }
  }
  const issues = matches.filter(match => Number.isInteger(match.offset) && Number.isInteger(match.length) && match.offset >= 0 && match.length >= 0 && match.offset + match.length <= text.length && typeof match.message === 'string')
    .slice(0, 100).map(match => {
      const replacement = Array.isArray(match.replacements) ? match.replacements.find(value => typeof value?.value === 'string' && value.value.length <= 2000)?.value : undefined;
      const protectedName = protectedRanges.some(([start, end]) => match.offset < end && match.offset + Math.max(1, match.length) > start);
      return { offset: match.offset, length: match.length, message: match.message, replacement, selected: replacement !== undefined && !protectedName, protectedName };
    }).sort((a, b) => a.offset - b.offset || b.length - a.length);
  return issues;
}
export function correctedText(text, issues) {
  let result = '', cursor = 0, lastInsertion = -1;
  for (const issue of issues) {
    if (!issue.selected || typeof issue.replacement !== 'string' || issue.offset < cursor || (!issue.length && issue.offset === lastInsertion)) continue;
    result += text.slice(cursor, issue.offset) + issue.replacement;
    cursor = issue.offset + issue.length;
    lastInsertion = issue.length ? -1 : issue.offset;
  }
  return result + text.slice(cursor);
}

const dialog = document.createElement('dialog');
dialog.id = 'proofreadingDialog'; dialog.className = 'dialog hotel-notes-dialog';
dialog.setAttribute('aria-labelledby', 'proofreadingHeading'); document.body.append(dialog);
let context = null, pending = null;
const el = id => document.getElementById(id);
function stopRequest() { if (pending) { clearTimeout(pending.timer); pending.controller.abort(); pending = null; } }
function status(message) { el('proofreadingStatus').textContent = message; }
async function check() {
  const owner = context;
  if (!owner || pending) return;
  if (!owner.isCurrent()) { status('Die Notiz wurde geändert. Bitte schließen und den aktuellen Text erneut prüfen.'); return; }
  const task = {controller: new AbortController(), timer: null, timedOut: false}; pending = task;
  task.timer = setTimeout(() => { task.timedOut = true; task.controller.abort(); }, 20000);
  el('proofreadingCheck').disabled = true; el('proofreadingApply').disabled = true; el('proofreadingResult').hidden = true;
  status('Grammatik und Rechtschreibung werden geprüft …');
  try {
    const response = await fetch(GRAMMAR_ENDPOINT, {method:'POST', body:new URLSearchParams({text:owner.text, language:'de-DE'}), signal:task.controller.signal, credentials:'omit', cache:'no-store', referrerPolicy:'no-referrer'});
    if (!response.ok) throw new Error(response.status === 429 ? 'Zu viele Prüfungen. Bitte etwas warten und erneut versuchen.' : 'Der Grammatikdienst ist gerade nicht verfügbar. Bitte später erneut versuchen.');
    const result = await response.json();
    if (!Array.isArray(result.matches)) throw new Error('Die Antwort konnte nicht gelesen werden. Deine Notiz bleibt erhalten.');
    if (context !== owner || !dialog.open) return;
    if (!owner.isCurrent()) { status('Die ursprüngliche Notiz wurde geändert. Bitte mit dem aktuellen Text neu starten.'); return; }
    const issues = correctionProposal(owner.text, result.matches, owner.protectedTerms);
    if (result.matches.length && !issues.length) throw new Error('Die Hinweise konnten nicht ausgewertet werden. Bitte später erneut versuchen.');
    const area = el('proofreadingIssues'); area.replaceChildren();
    const rebuild = () => { el('proofreadingText').value = correctedText(owner.text, issues); el('proofreadingApply').disabled = el('proofreadingText').value === owner.text; };
    for (const issue of issues) {
      const label = document.createElement('label'); label.className = 'grammar-issue';
      const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = issue.selected; checkbox.disabled = issue.replacement === undefined || issue.protectedName;
      checkbox.onchange = () => { issue.selected = checkbox.checked; rebuild(); };
      const description = document.createElement('span'); description.textContent = issue.message + (issue.replacement !== undefined ? ` (${owner.text.slice(issue.offset, issue.offset + issue.length)} → ${issue.replacement || 'entfernen'})` : '') + (issue.protectedName ? ' Hotelname bitte selbst prüfen.' : '');
      label.append(checkbox, description); area.append(label);
    }
    rebuild(); el('proofreadingResult').hidden = false;
    status(issues.length ? `${issues.length} Hinweise gefunden. Prüfe den Vorschlag; du kannst ihn vor dem Übernehmen bearbeiten.` : 'Keine Korrekturen gefunden. Du kannst den Text bei Bedarf selbst bearbeiten.');
  } catch (error) {
    if (context === owner && dialog.open) status(task.timedOut ? 'Der Dienst antwortet nicht. Bitte später erneut versuchen. Deine Notiz bleibt erhalten.' : error.name === 'AbortError' ? 'Prüfung abgebrochen.' : error instanceof SyntaxError ? 'Die Antwort konnte nicht gelesen werden. Deine Notiz bleibt erhalten.' : error instanceof TypeError ? 'Keine Verbindung zum Grammatikdienst. Bitte Internetverbindung prüfen und erneut versuchen.' : error.message);
  } finally {
    clearTimeout(task.timer); if (pending === task) pending = null;
    if (context === owner && dialog.open) el('proofreadingCheck').disabled = false;
  }
}
export function openProofreading(options) {
  if (!options.text.trim()) { options.report('Bitte zuerst eine Notiz schreiben oder diktieren.'); return; }
  if (new TextEncoder().encode(options.text).length > 18000) { options.report('Bitte für die Grammatikprüfung einen kürzeren Text verwenden (höchstens 18 KB).'); return; }
  stopRequest(); if (dialog.open) dialog.close(); context = options;
  dialog.innerHTML = `<div><div class="dialog-head"><h2 id="proofreadingHeading">Grammatik & Rechtschreibung</h2><button type="button" id="proofreadingClose" class="icon-button" aria-label="Prüfung schließen">×</button></div>
    <p class="hotel-note-help">Mit „Grammatik prüfen“ wird nur diese Notiz an <a href="https://languagetool.org/de" target="_blank" rel="noopener noreferrer">LanguageTool</a> gesendet. Internet nötig, kein eigener API-Schlüssel. Hotelbezeichnungen werden nicht automatisch geändert.</p>
    <button type="button" class="button primary" id="proofreadingCheck">Grammatik prüfen</button><p id="proofreadingStatus" role="status" aria-live="polite">Dein Original bleibt bis zum Übernehmen erhalten.</p>
    <div id="proofreadingResult" hidden><details><summary>Hinweise und Korrekturen</summary><div id="proofreadingIssues"></div></details><label class="hotel-note-field">Vorschlag<textarea id="proofreadingText" rows="8"></textarea></label></div>
    <div class="dialog-actions"><button type="button" class="button ghost" id="proofreadingCancel">Schließen</button><button type="button" class="button primary" id="proofreadingApply" disabled>Vorschlag übernehmen</button></div></div>`;
  el('proofreadingCheck').onclick = check;
  el('proofreadingClose').onclick = el('proofreadingCancel').onclick = () => { stopRequest(); dialog.close(); };
  el('proofreadingText').oninput = () => { el('proofreadingApply').disabled = !el('proofreadingText').value.trim() || el('proofreadingText').value === context.text; };
  el('proofreadingApply').onclick = () => {
    if (!context || pending) return;
    if (!context.isCurrent()) { status('Die Notiz wurde inzwischen geändert. Bitte erneut prüfen.'); return; }
    const value = el('proofreadingText').value;
    if (!value.trim()) { status('Der Vorschlag darf nicht leer sein.'); return; }
    if (context.apply(value)) dialog.close(); else status('Speichern fehlgeschlagen. Der Vorschlag bleibt geöffnet. Bitte Speicherplatz prüfen.');
  };
  dialog.showModal();
}
dialog.addEventListener('close', () => { if (!dialog.open) { stopRequest(); context = null; } });
dialog.addEventListener('cancel', () => stopRequest());
window.addEventListener('pagehide', stopRequest);

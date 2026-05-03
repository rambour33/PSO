const socket = io();
const AUTHOR_KEY = 'pso_notes_author';

const authorInput = document.getElementById('notes-author');
const tagSelect   = document.getElementById('notes-tag');
const textarea    = document.getElementById('notes-input');
const sendBtn     = document.getElementById('notes-send-btn');
const listEl      = document.getElementById('notes-list');
const countEl     = document.getElementById('notes-count');
const connDot     = document.getElementById('conn-dot');
const connLabel   = document.getElementById('conn-label');

authorInput.value = localStorage.getItem(AUTHOR_KEY) || '';
authorInput.addEventListener('change', () => {
  localStorage.setItem(AUTHOR_KEY, authorInput.value.trim());
});

socket.on('connect', () => {
  connDot.className = 'conn-dot on';
  connLabel.textContent = 'Connecté';
});
socket.on('disconnect', () => {
  connDot.className = 'conn-dot off';
  connLabel.textContent = 'Déconnecté';
});

function fmt(ts) {
  return new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function renderNotes(notes) {
  if (countEl) countEl.textContent = notes.length;
  listEl.innerHTML = notes.map(n => `
    <div class="n-note note-${n.tag}">
      <div class="n-note-header">
        <span class="n-note-author">${n.author}</span>
        <span class="n-note-time">${fmt(n.ts)}</span>
      </div>
      <div class="n-note-text">${n.text.replace(/</g, '&lt;').replace(/\n/g, '<br>')}</div>
    </div>`).join('');
  if (notes.length > 0) {
    document.title = '(' + notes.length + ') Notes Régie — PSO';
  } else {
    document.title = 'Notes Régie — PSO';
  }
}

function sendNote() {
  const text = textarea.value.trim();
  if (!text) return;
  const author = authorInput.value.trim() || 'Casteur';
  localStorage.setItem(AUTHOR_KEY, author);
  authorInput.value = author;
  fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author, text, tag: tagSelect.value }),
  }).then(() => {
    textarea.value = '';
    textarea.focus();
  }).catch(console.error);
}

sendBtn.addEventListener('click', sendNote);
textarea.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    sendNote();
  }
});

socket.on('notesUpdate', notes => {
  const wasHidden = document.hidden;
  renderNotes(notes);
  if (wasHidden && notes.length > 0) {
    const prev = document.title;
    document.title = '🔔 Nouvelle note — PSO';
    setTimeout(() => { document.title = prev; }, 3000);
  }
});

fetch('/api/notes').then(r => r.json()).then(renderNotes).catch(console.error);

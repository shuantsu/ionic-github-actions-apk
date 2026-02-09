// NoteForm Component - Formulário para criar/editar notas

import { geolocation } from '../services/geolocation.js';
import { storage } from '../services/storage.js';

class NoteForm extends HTMLElement {
  constructor() {
    super();
    this.editingNote = null;
    this.setupShadowDOM();
  }

  setupShadowDOM() {
    const root = this.attachShadow({ mode: 'open' });
    
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .form-container {
          background: var(--ion-background-color);
          border: 1px solid var(--ion-border-color);
          border-radius: var(--app-border-radius);
          padding: var(--app-spacing);
          margin-bottom: var(--app-spacing);
          box-shadow: var(--app-card-shadow);
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .form-header h3 {
          margin: 0;
          color: var(--ion-color-primary);
          font-size: 1.2rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--ion-text-color);
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--ion-border-color);
          border-radius: var(--app-border-radius);
          background: var(--ion-background-color);
          color: var(--ion-text-color);
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: var(--ion-color-primary);
          box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.2);
        }

        .form-group textarea {
          min-height: 100px;
          resize: vertical;
          font-family: inherit;
        }

        .form-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--app-border-radius);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-primary {
          background: var(--ion-color-primary);
          color: var(--ion-color-primary-contrast);
        }

        .btn-primary:hover {
          background: var(--ion-color-primary-shade);
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: var(--ion-color-secondary);
          color: var(--ion-color-secondary-contrast);
        }

        .btn-secondary:hover {
          background: var(--ion-color-secondary-shade);
        }

        .location-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          background: var(--ion-color-light);
          border-radius: 6px;
          font-size: 0.875rem;
          color: var(--ion-text-color);
          margin-top: 0.5rem;
        }

        .location-loading {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--ion-color-medium);
          font-size: 0.875rem;
        }

        .char-count {
          text-align: right;
          font-size: 0.75rem;
          color: var(--ion-color-medium);
          margin-top: 0.25rem;
        }

        @media (max-width: 768px) {
          .form-actions {
            flex-direction: column;
          }
          
          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      </style>

      <div class="form-container">
        <div class="form-header">
          <h3 id="form-title">📝 Nova Nota</h3>
          <button class="btn btn-secondary" id="close-btn">
            <ion-icon name="close"></ion-icon>
          </button>
        </div>

        <form id="note-form-element">
          <div class="form-group">
            <label for="note-title">Título</label>
            <input 
              type="text" 
              id="note-title" 
              placeholder="Digite um título..." 
              maxlength="100"
              required
            />
            <div class="char-count">
              <span id="title-count">0</span>/100
            </div>
          </div>

          <div class="form-group">
            <label for="note-content">Conteúdo</label>
            <textarea 
              id="note-content" 
              placeholder="Digite sua nota..." 
              maxlength="1000"
              required
            ></textarea>
            <div class="char-count">
              <span id="content-count">0</span>/1000
            </div>
          </div>

          <div id="location-section">
            <div class="location-loading" id="location-loading">
              <ion-icon name="locate"></ion-icon>
              Obtendo localização...
            </div>
            <div class="location-info" id="location-info" style="display: none;">
              <ion-icon name="location"></ion-icon>
              <span id="location-text">Localização não disponível</span>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" id="cancel-btn">
              <ion-icon name="close"></ion-icon>
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" id="save-btn">
              <ion-icon name="save"></ion-icon>
              <span id="save-text">Salvar Nota</span>
            </button>
          </div>
        </form>
      </div>
    `;
  }

  connectedCallback() {
    this.setupEventListeners();
    this.updateCharCounts();
  }

  setupEventListeners() {
    const form = this.shadowRoot.getElementById('note-form-element');
    const titleInput = this.shadowRoot.getElementById('note-title');
    const contentInput = this.shadowRoot.getElementById('note-content');
    const closeBtn = this.shadowRoot.getElementById('close-btn');
    const cancelBtn = this.shadowRoot.getElementById('cancel-btn');

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveNote();
    });

    // Character counters
    titleInput.addEventListener('input', () => this.updateCharCounts());
    contentInput.addEventListener('input', () => this.updateCharCounts());

    // Close/Cancel buttons
    closeBtn.addEventListener('click', () => this.hide());
    cancelBtn.addEventListener('click', () => this.hide());

    // Auto-save on Ctrl/Cmd + Enter
    form.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.saveNote();
      }
    });
  }

  updateCharCounts() {
    const titleInput = this.shadowRoot.getElementById('note-title');
    const contentInput = this.shadowRoot.getElementById('note-content');
    const titleCount = this.shadowRoot.getElementById('title-count');
    const contentCount = this.shadowRoot.getElementById('content-count');

    titleCount.textContent = titleInput.value.length;
    contentCount.textContent = contentInput.value.length;
  }

  async show(note = null) {
    this.editingNote = note;
    this.style.display = 'block';
    
    const formTitle = this.shadowRoot.getElementById('form-title');
    const saveText = this.shadowRoot.getElementById('save-text');
    const titleInput = this.shadowRoot.getElementById('note-title');
    const contentInput = this.shadowRoot.getElementById('note-content');

    if (note) {
      // Editando nota existente
      formTitle.textContent = '✏️ Editar Nota';
      saveText.textContent = 'Atualizar Nota';
      titleInput.value = note.title;
      contentInput.value = note.content;
    } else {
      // Nova nota
      formTitle.textContent = '📝 Nova Nota';
      saveText.textContent = 'Salvar Nota';
      titleInput.value = '';
      contentInput.value = '';
    }

    this.updateCharCounts();
    titleInput.focus();
    
    // Obter localização
    await this.updateLocation();
  }

  hide() {
    this.style.display = 'none';
    this.editingNote = null;
    
    // Limpar formulário
    const form = this.shadowRoot.getElementById('note-form-element');
    form.reset();
    this.updateCharCounts();
  }

  async updateLocation() {
    const loadingEl = this.shadowRoot.getElementById('location-loading');
    const infoEl = this.shadowRoot.getElementById('location-info');
    const textEl = this.shadowRoot.getElementById('location-text');

    loadingEl.style.display = 'flex';
    infoEl.style.display = 'none';

    try {
      const location = await geolocation.getCurrentLocation();
      const locationText = geolocation.formatLocation(location);
      
      textEl.textContent = locationText;
      this.currentLocation = location;
    } catch (error) {
      textEl.textContent = '📍 Localização não disponível';
      this.currentLocation = null;
    } finally {
      loadingEl.style.display = 'none';
      infoEl.style.display = 'flex';
    }
  }

  async saveNote() {
    const titleInput = this.shadowRoot.getElementById('note-title');
    const contentInput = this.shadowRoot.getElementById('note-content');

    const noteData = {
      title: titleInput.value.trim(),
      content: contentInput.value.trim(),
      location: this.currentLocation
    };

    if (!noteData.title || !noteData.content) {
      this.showMessage('Por favor, preencha todos os campos', 'warning');
      return;
    }

    try {
      if (this.editingNote) {
        // Atualizar nota existente
        storage.updateNote(this.editingNote.id, noteData);
        this.showMessage('Nota atualizada com sucesso!', 'success');
      } else {
        // Criar nova nota
        storage.addNote(noteData);
        this.showMessage('Nota criada com sucesso!', 'success');
      }

      // Disparar evento para atualizar a lista
      this.dispatchEvent(new CustomEvent('note-saved', {
        detail: { note: this.editingNote || noteData }
      }));

      this.hide();
    } catch (error) {
      console.error('Erro ao salvar nota:', error);
      this.showMessage('Erro ao salvar nota', 'error');
    }
  }

  showMessage(message, type = 'info') {
    // Criar toast notification
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 3000;
    toast.position = 'bottom';
    
    if (type === 'success') {
      toast.color = 'success';
    } else if (type === 'error') {
      toast.color = 'danger';
    } else if (type === 'warning') {
      toast.color = 'warning';
    }

    document.body.appendChild(toast);
    toast.present();
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3500);
  }
}

// Registrar custom element
customElements.define('note-form', NoteForm);

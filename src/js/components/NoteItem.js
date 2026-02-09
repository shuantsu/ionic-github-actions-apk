// NoteItem Component - Exibe uma nota individual

import { storage } from '../services/storage.js';
import { geolocation } from '../services/geolocation.js';

class NoteItem extends HTMLElement {
  constructor() {
    super();
    this.note = null;
    this.setupShadowDOM();
  }

  setupShadowDOM() {
    const root = this.attachShadow({ mode: 'open' });
    
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .note-card {
          background: var(--ion-background-color);
          border: 1px solid var(--ion-border-color);
          border-radius: var(--app-border-radius);
          padding: var(--app-spacing);
          margin-bottom: var(--app-spacing);
          box-shadow: var(--app-card-shadow);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .note-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .note-title {
          margin: 0;
          color: var(--ion-color-primary);
          font-size: 1.1rem;
          font-weight: 600;
          line-height: 1.3;
          flex: 1;
          word-wrap: break-word;
        }

        .note-actions {
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .note-card:hover .note-actions {
          opacity: 1;
        }

        .action-btn {
          background: none;
          border: none;
          padding: 0.25rem;
          cursor: pointer;
          border-radius: 4px;
          color: var(--ion-color-medium);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .action-btn:hover {
          background: var(--ion-color-light);
          color: var(--ion-text-color);
        }

        .action-btn.edit:hover {
          color: var(--ion-color-primary);
        }

        .action-btn.delete:hover {
          color: var(--ion-color-danger);
        }

        .note-content {
          margin: 0 0 1rem 0;
          line-height: 1.5;
          color: var(--ion-text-color);
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 150px;
          overflow-y: auto;
        }

        .note-content.expanded {
          max-height: none;
        }

        .note-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: var(--ion-color-medium);
          padding-top: 0.75rem;
          border-top: 1px solid var(--ion-border-color);
        }

        .note-dates {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .note-date {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .note-location {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .note-location:hover {
          color: var(--ion-color-primary);
        }

        .expand-btn {
          background: none;
          border: none;
          color: var(--ion-color-primary);
          cursor: pointer;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .expand-btn:hover {
          background: var(--ion-color-light);
        }

        .location-badge {
          background: var(--ion-color-light);
          color: var(--ion-text-color);
          padding: 0.25rem 0.5rem;
          border-radius: 12px;
          font-size: 0.75rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        @media (max-width: 768px) {
          .note-header {
            flex-direction: column;
            gap: 0.5rem;
          }

          .note-actions {
            opacity: 1;
            align-self: flex-end;
          }

          .note-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
        }

        /* Animations */
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .note-card {
          animation: slideIn 0.3s ease;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .note-card.deleting {
          animation: shake 0.3s ease;
        }
      </style>

      <div class="note-card">
        <div class="note-header">
          <h3 class="note-title"></h3>
          <div class="note-actions">
            <button class="action-btn edit" title="Editar">
              <ion-icon name="create-outline"></ion-icon>
            </button>
            <button class="action-btn delete" title="Excluir">
              <ion-icon name="trash-outline"></ion-icon>
            </button>
          </div>
        </div>

        <div class="note-content"></div>
        
        <div class="note-meta">
          <div class="note-dates">
            <div class="note-date">
              <ion-icon name="time-outline"></ion-icon>
              <span class="created-date"></span>
            </div>
            <div class="note-date" style="display: none;">
              <ion-icon name="refresh-outline"></ion-icon>
              <span class="updated-date"></span>
            </div>
          </div>
          
          <div class="note-location" style="display: none;">
            <ion-icon name="location-outline"></ion-icon>
            <span class="location-text"></span>
          </div>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    const editBtn = this.shadowRoot.querySelector('.action-btn.edit');
    const deleteBtn = this.shadowRoot.querySelector('.action-btn.delete');
    const locationEl = this.shadowRoot.querySelector('.note-location');

    editBtn.addEventListener('click', () => this.editNote());
    deleteBtn.addEventListener('click', () => this.deleteNote());
    locationEl.addEventListener('click', () => this.showLocationDetails());
  }

  setNote(note) {
    this.note = note;
    this.render();
  }

  render() {
    if (!this.note) return;

    const card = this.shadowRoot.querySelector('.note-card');
    const titleEl = this.shadowRoot.querySelector('.note-title');
    const contentEl = this.shadowRoot.querySelector('.note-content');
    const createdDateEl = this.shadowRoot.querySelector('.created-date');
    const updatedDateEl = this.shadowRoot.querySelector('.updated-date');
    const locationEl = this.shadowRoot.querySelector('.note-location');
    const locationTextEl = this.shadowRoot.querySelector('.location-text');

    // Título
    titleEl.textContent = this.note.title;

    // Conteúdo
    contentEl.textContent = this.note.content;
    
    // Adicionar botão expandir se conteúdo for muito longo
    if (this.note.content.length > 200) {
      if (!contentEl.querySelector('.expand-btn')) {
        const expandBtn = document.createElement('button');
        expandBtn.className = 'expand-btn';
        expandBtn.textContent = 'Ver mais';
        expandBtn.addEventListener('click', () => this.toggleContent());
        contentEl.parentNode.insertBefore(expandBtn, contentEl.nextSibling);
      }
    }

    // Datas
    createdDateEl.textContent = this.formatDate(this.note.createdAt);
    
    if (this.note.updatedAt && this.note.updatedAt !== this.note.createdAt) {
      const updatedDateContainer = this.shadowRoot.querySelector('.note-date:nth-child(2)');
      updatedDateContainer.style.display = 'flex';
      updatedDateEl.textContent = this.formatDate(this.note.updatedAt);
    }

    // Localização
    if (this.note.location) {
      locationEl.style.display = 'flex';
      locationTextEl.textContent = geolocation.formatLocation(this.note.location);
    }

    // Adicionar ID ao card para referência
    card.dataset.noteId = this.note.id;
  }

  toggleContent() {
    const contentEl = this.shadowRoot.querySelector('.note-content');
    const expandBtn = this.shadowRoot.querySelector('.expand-btn');
    
    contentEl.classList.toggle('expanded');
    expandBtn.textContent = contentEl.classList.contains('expanded') ? 'Ver menos' : 'Ver mais';
  }

  editNote() {
    // Disparar evento para o formulário editar
    this.dispatchEvent(new CustomEvent('edit-note', {
      detail: { note: this.note }
    }));
  }

  async deleteNote() {
    const card = this.shadowRoot.querySelector('.note-card');
    card.classList.add('deleting');

    // Confirmar exclusão
    const confirmed = await this.confirmDelete();
    
    if (confirmed) {
      try {
        storage.deleteNote(this.note.id);
        
        // Disparar evento para atualizar lista
        this.dispatchEvent(new CustomEvent('note-deleted', {
          detail: { noteId: this.note.id }
        }));

        // Animar remoção
        card.style.opacity = '0';
        card.style.transform = 'translateX(-100%)';
        
        setTimeout(() => {
          this.remove();
        }, 300);
      } catch (error) {
        console.error('Erro ao excluir nota:', error);
        this.showToast('Erro ao excluir nota', 'danger');
      }
    } else {
      card.classList.remove('deleting');
    }
  }

  async confirmDelete() {
    return new Promise((resolve) => {
      const alert = document.createElement('ion-alert');
      alert.header = 'Confirmar Exclusão';
      alert.message = 'Tem certeza que deseja excluir esta nota?';
      alert.buttons = [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => resolve(false)
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => resolve(true)
        }
      ];

      document.body.appendChild(alert);
      alert.present();
      
      setTimeout(() => {
        document.body.removeChild(alert);
      }, 100);
    });
  }

  showLocationDetails() {
    if (!this.note.location) return;

    const location = this.note.location;
    const locationText = geolocation.formatLocation(location);
    
    const alert = document.createElement('ion-alert');
    alert.header = '📍 Detalhes da Localização';
    alert.message = `
      <p><strong>Localização:</strong> ${locationText}</p>
      <p><strong>Fonte:</strong> ${this.getLocationSource(location.source)}</p>
      <p><strong>Precisão:</strong> ${location.accuracy ? location.accuracy.toFixed(1) + 'm' : 'N/A'}</p>
      <p><strong>Data:</strong> ${this.formatDate(location.timestamp)}</p>
    `;
    alert.buttons = ['OK'];

    document.body.appendChild(alert);
    alert.present();
    
    setTimeout(() => {
      document.body.removeChild(alert);
    }, 100);
  }

  getLocationSource(source) {
    const sources = {
      'capacitor': 'GPS (Dispositivo)',
      'browser': 'GPS (Navegador)',
      'mock': 'Simulado (Desenvolvimento)'
    };
    return sources[source] || 'Desconhecido';
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    if (diffHours < 24) return `há ${diffHours}h`;
    if (diffDays < 7) return `há ${diffDays} dias`;

    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  showToast(message, color = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 2000;
    toast.position = 'bottom';
    toast.color = color;

    document.body.appendChild(toast);
    toast.present();
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 2500);
  }
}

// Registrar custom element
customElements.define('note-item', NoteItem);

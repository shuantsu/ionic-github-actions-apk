// NoteList Component - Lista de notas com busca e filtros

import { storage } from '../services/storage.js';

class NoteList extends HTMLElement {
  constructor() {
    super();
    this.notes = [];
    this.filteredNotes = [];
    this.searchQuery = '';
    this.setupShadowDOM();
  }

  setupShadowDOM() {
    const root = this.attachShadow({ mode: 'open' });
    
    root.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .list-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--app-spacing);
          flex-wrap: wrap;
          gap: 1rem;
        }

        .search-container {
          flex: 1;
          min-width: 200px;
          max-width: 400px;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--ion-border-color);
          border-radius: var(--app-border-radius);
          background: var(--ion-background-color);
          color: var(--ion-text-color);
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: var(--ion-color-primary);
          box-shadow: 0 0 0 2px rgba(var(--ion-color-primary-rgb), 0.2);
        }

        .list-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .stats {
          font-size: 0.875rem;
          color: var(--ion-color-medium);
          padding: 0.5rem;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: var(--app-border-radius);
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary {
          background: var(--ion-color-secondary);
          color: var(--ion-color-secondary-contrast);
        }

        .btn-secondary:hover {
          background: var(--ion-color-secondary-shade);
          transform: translateY(-1px);
        }

        .btn-danger {
          background: var(--ion-color-danger);
          color: var(--ion-color-danger-contrast);
        }

        .btn-danger:hover {
          background: var(--ion-color-danger-shade);
          transform: translateY(-1px);
        }

        .notes-container {
          min-height: 200px;
        }

        .empty-state {
          text-align: center;
          padding: 3rem var(--app-spacing);
          color: var(--ion-color-medium);
        }

        .empty-state ion-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.4;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: var(--ion-text-color);
        }

        .empty-state p {
          margin: 0;
          font-size: 0.875rem;
        }

        .search-results {
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: var(--ion-color-light);
          border-radius: 6px;
          font-size: 0.875rem;
          color: var(--ion-text-color);
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          color: var(--ion-color-medium);
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--ion-color-light);
          border-top: 2px solid var(--ion-color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .sort-options {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .sort-btn {
          background: none;
          border: 1px solid var(--ion-border-color);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
          cursor: pointer;
          color: var(--ion-text-color);
          transition: all 0.2s ease;
        }

        .sort-btn:hover {
          background: var(--ion-color-light);
        }

        .sort-btn.active {
          background: var(--ion-color-primary);
          color: var(--ion-color-primary-contrast);
          border-color: var(--ion-color-primary);
        }

        @media (max-width: 768px) {
          .list-header {
            flex-direction: column;
            align-items: stretch;
          }

          .search-container {
            max-width: none;
          }

          .list-actions {
            justify-content: space-between;
          }

          .sort-options {
            flex-wrap: wrap;
          }
        }
      </style>

      <div class="list-header">
        <div class="search-container">
          <input 
            type="text" 
            class="search-input" 
            placeholder="🔍 Buscar notas..."
            id="search-input"
          />
        </div>
        
        <div class="list-actions">
          <div class="sort-options">
            <button class="sort-btn active" data-sort="date">Data</button>
            <button class="sort-btn" data-sort="title">Título</button>
          </div>
          
          <div class="stats" id="stats">
            <span id="note-count">0</span> notas
          </div>
          
          <div class="actions">
            <button class="btn btn-secondary" id="export-btn" title="Exportar notas">
              <ion-icon name="download-outline"></ion-icon>
            </button>
            <button class="btn btn-danger" id="clear-btn" title="Limpar todas">
              <ion-icon name="trash-outline"></ion-icon>
            </button>
          </div>
        </div>
      </div>

      <div class="search-results" id="search-results" style="display: none;">
        <span id="search-text"></span>
      </div>

      <div class="notes-container" id="notes-container">
        <div class="empty-state">
          <ion-icon name="document-text-outline"></ion-icon>
          <h3>Nenhuma nota ainda</h3>
          <p>Clique no botão + para criar sua primeira nota</p>
        </div>
      </div>
    `;
  }

  connectedCallback() {
    this.setupEventListeners();
    this.loadNotes();
  }

  setupEventListeners() {
    const searchInput = this.shadowRoot.getElementById('search-input');
    const exportBtn = this.shadowRoot.getElementById('export-btn');
    const clearBtn = this.shadowRoot.getElementById('clear-btn');
    const sortBtns = this.shadowRoot.querySelectorAll('.sort-btn');

    // Search
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.filterNotes();
    });

    // Export
    exportBtn.addEventListener('click', () => this.exportNotes());

    // Clear all
    clearBtn.addEventListener('click', () => this.clearAllNotes());

    // Sort
    sortBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sortBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.sortNotes(btn.dataset.sort);
      });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + F para focar busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
      }
      
      // ESC para limpar busca
      if (e.key === 'Escape' && this.searchQuery) {
        searchInput.value = '';
        this.searchQuery = '';
        this.filterNotes();
      }
    });
  }

  loadNotes() {
    this.notes = storage.getAllNotes();
    this.filteredNotes = [...this.notes];
    this.render();
  }

  filterNotes() {
    if (this.searchQuery.trim()) {
      this.filteredNotes = storage.searchNotes(this.searchQuery);
    } else {
      this.filteredNotes = [...this.notes];
    }
    
    this.render();
    this.updateSearchResults();
  }

  sortNotes(sortBy) {
    switch (sortBy) {
      case 'date':
        this.filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'title':
        this.filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    this.render();
  }

  render() {
    const container = this.shadowRoot.getElementById('notes-container');
    const noteCount = this.shadowRoot.getElementById('note-count');
    
    // Atualizar contador
    noteCount.textContent = this.filteredNotes.length;

    if (this.filteredNotes.length === 0) {
      // Empty state
      container.innerHTML = `
        <div class="empty-state">
          <ion-icon name="document-text-outline"></ion-icon>
          <h3>${this.searchQuery ? 'Nenhuma nota encontrada' : 'Nenhuma nota ainda'}</h3>
          <p>${this.searchQuery ? 'Tente buscar com outros termos' : 'Clique no botão + para criar sua primeira nota'}</p>
        </div>
      `;
      return;
    }

    // Renderizar notas
    container.innerHTML = '';
    this.filteredNotes.forEach(note => {
      const noteItem = document.createElement('note-item');
      noteItem.setNote(note);
      
      // Event listeners
      noteItem.addEventListener('edit-note', (e) => {
        this.dispatchEvent(new CustomEvent('edit-note', e.detail));
      });
      
      noteItem.addEventListener('note-deleted', (e) => {
        this.loadNotes(); // Recarregar lista
      });
      
      container.appendChild(noteItem);
    });
  }

  updateSearchResults() {
    const searchResults = this.shadowRoot.getElementById('search-results');
    const searchText = this.shadowRoot.getElementById('search-text');
    
    if (this.searchQuery.trim()) {
      searchResults.style.display = 'block';
      searchText.textContent = `${this.filteredNotes.length} resultado(s) para "${this.searchQuery}"`;
    } else {
      searchResults.style.display = 'none';
    }
  }

  async exportNotes() {
    if (this.notes.length === 0) {
      this.showToast('Nenhuma nota para exportar', 'warning');
      return;
    }

    try {
      storage.exportNotes();
      this.showToast('Notas exportadas com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao exportar notas:', error);
      this.showToast('Erro ao exportar notas', 'danger');
    }
  }

  async clearAllNotes() {
    if (this.notes.length === 0) {
      this.showToast('Nenhuma nota para limpar', 'warning');
      return;
    }

    const confirmed = await this.confirmClearAll();
    
    if (confirmed) {
      try {
        storage.clearAllNotes();
        this.loadNotes();
        this.showToast('Todas as notas foram excluídas', 'success');
      } catch (error) {
        console.error('Erro ao limpar notas:', error);
        this.showToast('Erro ao limpar notas', 'danger');
      }
    }
  }

  async confirmClearAll() {
    return new Promise((resolve) => {
      const alert = document.createElement('ion-alert');
      alert.header = '⚠️ Confirmar Limpeza';
      alert.message = `Tem certeza que deseja excluir todas as ${this.notes.length} notas? Esta ação não pode ser desfeita.`;
      alert.buttons = [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => resolve(false)
        },
        {
          text: 'Excluir Tudo',
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

  showToast(message, color = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 3000;
    toast.position = 'bottom';
    toast.color = color;

    document.body.appendChild(toast);
    toast.present();
    
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3500);
  }

  refresh() {
    this.loadNotes();
  }
}

// Registrar custom element
customElements.define('note-list', NoteList);

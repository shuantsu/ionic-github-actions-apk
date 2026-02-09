// Storage Service - Gerencia persistência local de notas

class StorageService {
  constructor() {
    this.STORAGE_KEY = 'quick-notes';
    this.notes = [];
    this.loadNotes();
  }

  // Carregar notas do localStorage
  loadNotes() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.notes = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar notas:', error);
      this.notes = [];
    }
  }

  // Salvar notas no localStorage
  saveNotes() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.notes));
      return true;
    } catch (error) {
      console.error('Erro ao salvar notas:', error);
      return false;
    }
  }

  // Adicionar nova nota
  addNote(noteData) {
    const note = {
      id: Date.now().toString(),
      title: noteData.title || 'Sem título',
      content: noteData.content || '',
      location: noteData.location || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.notes.unshift(note); // Adiciona no início
    this.saveNotes();
    return note;
  }

  // Atualizar nota existente
  updateNote(id, noteData) {
    const index = this.notes.findIndex(note => note.id === id);
    if (index !== -1) {
      this.notes[index] = {
        ...this.notes[index],
        ...noteData,
        updatedAt: new Date().toISOString()
      };
      this.saveNotes();
      return this.notes[index];
    }
    return null;
  }

  // Remover nota
  deleteNote(id) {
    const index = this.notes.findIndex(note => note.id === id);
    if (index !== -1) {
      const deleted = this.notes.splice(index, 1)[0];
      this.saveNotes();
      return deleted;
    }
    return null;
  }

  // Buscar nota por ID
  getNote(id) {
    return this.notes.find(note => note.id === id) || null;
  }

  // Listar todas as notas
  getAllNotes() {
    return [...this.notes]; // Retorna cópia
  }

  // Buscar notas por texto
  searchNotes(query) {
    const searchTerm = query.toLowerCase().trim();
    if (!searchTerm) return this.getAllNotes();

    return this.notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm) ||
      note.content.toLowerCase().includes(searchTerm)
    );
  }

  // Limpar todas as notas
  clearAllNotes() {
    this.notes = [];
    this.saveNotes();
  }

  // Exportar notas
  exportNotes() {
    const dataStr = JSON.stringify(this.notes, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }

  // Importar notas
  importNotes(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedNotes = JSON.parse(e.target.result);
          if (Array.isArray(importedNotes)) {
            // Mesclar com notas existentes (evitar duplicados por ID)
            const existingIds = new Set(this.notes.map(n => n.id));
            const newNotes = importedNotes.filter(note => !existingIds.has(note.id));
            
            this.notes = [...newNotes, ...this.notes];
            this.saveNotes();
            resolve(newNotes.length);
          } else {
            reject('Formato inválido');
          }
        } catch (error) {
          reject('Erro ao ler arquivo');
        }
      };
      reader.onerror = () => reject('Erro ao ler arquivo');
      reader.readAsText(file);
    });
  }
}

// Exportar singleton
export const storage = new StorageService();

// App Main - Orquestração principal do aplicativo

import { SplashScreen } from '@capacitor/splash-screen';
import { storage } from './services/storage.js';
import { geolocation } from './services/geolocation.js';

class NotesApp {
  constructor() {
    this.noteForm = null;
    this.noteList = null;
    this.isInitialized = false;
  }

  async init() {
    try {
      // Esconder splash screen (se existir)
      await SplashScreen.hide();
      
      // Inicializar componentes
      this.setupComponents();
      this.setupEventListeners();
      this.setupKeyboardShortcuts();
      
      // Carregar dados iniciais
      await this.loadInitialData();
      
      // Verificar permissões (mobile)
      await this.checkPermissions();
      
      this.isInitialized = true;
      console.log('📝 Notas Rápidas inicializado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
      this.showError('Erro ao inicializar aplicativo');
    }
  }

  setupComponents() {
    // Obter referências aos componentes
    this.noteForm = document.getElementById('note-form');
    this.noteList = document.getElementById('note-list');
    this.addNoteBtn = document.getElementById('add-note-btn');
    
    // Setup event listeners dos componentes
    this.setupComponentEvents();
  }

  setupComponentEvents() {
    // Eventos do formulário
    if (this.noteForm) {
      this.noteForm.addEventListener('note-saved', () => {
        this.noteList.refresh();
        this.showSuccess('Nota salva com sucesso!');
      });
    }

    // Eventos da lista
    if (this.noteList) {
      this.noteList.addEventListener('edit-note', (e) => {
        this.editNote(e.detail.note);
      });
    }

    // Botão adicionar nota
    if (this.addNoteBtn) {
      this.addNoteBtn.addEventListener('click', () => {
        this.showNoteForm();
      });
    }
  }

  setupEventListeners() {
    // Theme detection
    this.setupThemeDetection();
    
    // Online/Offline detection
    this.setupConnectivityDetection();
    
    // Prevent back navigation issues
    this.setupNavigationHandling();
  }

  setupThemeDetection() {
    // Detectar mudança de tema do sistema
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    darkModeQuery.addEventListener('change', (e) => {
      document.body.classList.toggle('dark', e.matches);
      this.showInfo(`Tema alterado para ${e.matches ? 'escuro' : 'claro'}`);
    });

    // Aplicar tema inicial
    document.body.classList.toggle('dark', darkModeQuery.matches);
  }

  setupConnectivityDetection() {
    const updateOnlineStatus = () => {
      const isOnline = navigator.onLine;
      if (!isOnline) {
        this.showWarning('Você está offline. As notas serão salvas localmente.');
      } else {
        this.showSuccess('Conexão restaurada!');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Status inicial
    updateOnlineStatus();
  }

  setupNavigationHandling() {
    // Prevenir navegação acidental
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    });

    // Handle mobile back button
    if (window.Capacitor) {
      // Adicionar lógica para back button do Android aqui
    }
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + N: Nova nota
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.showNoteForm();
      }
      
      // Ctrl/Cmd + E: Exportar
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        this.noteList?.exportNotes();
      }
      
      // Ctrl/Cmd + Shift + C: Limpar tudo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.noteList?.clearAllNotes();
      }
    });
  }

  async loadInitialData() {
    try {
      // Carregar notas (já feito no storage service)
      const notes = storage.getAllNotes();
      console.log(`📋 ${notes.length} notas carregadas`);
      
      // Atualizar UI
      if (this.noteList) {
        this.noteList.refresh();
      }
      
      // Mostrar dica se for primeira vez
      if (notes.length === 0) {
        setTimeout(() => {
          this.showInfo('Bem-vindo! Clique no botão + para criar sua primeira nota.');
        }, 1000);
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      this.showError('Erro ao carregar suas notas');
    }
  }

  async checkPermissions() {
    if (!window.Capacitor) {
      console.log('🌐 Rodando no navegador');
      return;
    }

    try {
      // Verificar permissão de geolocalização
      const hasLocation = await geolocation.checkAvailability();
      if (!hasLocation) {
        console.log('📍 Geolocalização não disponível');
      }
      
      console.log('📱 Rodando em dispositivo móvel');
    } catch (error) {
      console.log('❌ Erro ao verificar permissões:', error);
    }
  }

  showNoteForm(note = null) {
    if (this.noteForm) {
      this.noteForm.show(note);
    }
  }

  editNote(note) {
    this.showNoteForm(note);
  }

  hasUnsavedChanges() {
    // Verificar se há mudanças não salvas no formulário
    if (!this.noteForm) return false;
    
    const titleInput = this.noteForm.shadowRoot?.getElementById('note-title');
    const contentInput = this.noteForm.shadowRoot?.getElementById('note-content');
    
    if (!titleInput || !contentInput) return false;
    
    return titleInput.value.trim() || contentInput.value.trim();
  }

  // Métodos de notificação
  showSuccess(message) {
    this.showToast(message, 'success');
  }

  showError(message) {
    this.showToast(message, 'danger');
  }

  showWarning(message) {
    this.showToast(message, 'warning');
  }

  showInfo(message) {
    this.showToast(message, 'primary');
  }

  showToast(message, color = 'primary') {
    const toast = document.createElement('ion-toast');
    toast.message = message;
    toast.duration = 3000;
    toast.position = 'bottom';
    toast.color = color;
    toast.swipeGesture = 'vertical';

    document.body.appendChild(toast);
    toast.present();
    
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 3500);
  }

  // Métodos utilitários
  async requestLocationPermission() {
    try {
      const granted = await geolocation.requestPermissions();
      if (granted) {
        this.showSuccess('Permissão de localização concedida!');
      } else {
        this.showWarning('Permissão de localização negada');
      }
      return granted;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      this.showError('Erro ao solicitar permissão de localização');
      return false;
    }
  }

  // Debug e desenvolvimento
  enableDebugMode() {
    window.notesApp = this;
    window.storage = storage;
    window.geolocation = geolocation;
    
    console.log('🐛 Debug mode enabled!');
    console.log('Available commands:');
    console.log('- notesApp: App instance');
    console.log('- storage: Storage service');
    console.log('- geolocation: Geolocation service');
    console.log('- storage.getAllNotes(): List all notes');
    console.log('- storage.clearAllNotes(): Clear all notes');
  }

  // Performance monitoring
  logPerformance() {
    if ('performance' in window) {
      const perfData = performance.getEntriesByType('navigation')[0];
      console.log('📊 Performance metrics:');
      console.log(`- Load time: ${perfData.loadEventEnd - perfData.loadEventStart}ms`);
      console.log(`- DOM interactive: ${perfData.domInteractive - perfData.loadEventStart}ms`);
    }
  }
}

// Inicializar app quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', async () => {
  const app = new NotesApp();
  await app.init();
  
  // Habilitar debug em desenvolvimento
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    app.enableDebugMode();
    app.logPerformance();
  }
  
  // Expor globalmente para debugging
  window.NotesApp = NotesApp;
  window.app = app;
});

// Handle PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostrar botão de instalação (opcional)
  console.log('📱 PWA install prompt available');
});

window.addEventListener('appinstalled', () => {
  console.log('📱 PWA installed successfully!');
  if (window.app) {
    window.app.showSuccess('App instalado com sucesso!');
  }
});

// Exportar para uso em módulos
export default NotesApp;

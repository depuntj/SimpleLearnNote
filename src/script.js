// Import CSS and components
import './style.css';
import './component.js';

// Import utilities
import {
  formatDate,
  showLoading,
  hideLoading,
  showToast,
  debounce,
} from './utils.js';

// API Base URL
const API_BASE_URL = 'https://notes-api.dicoding.dev/v2';

// Prevent multiple app instances
let appInstance = null;

// API functions with better error handling and caching
const api = {
  cache: new Map(),
  requestAbortController: null,

  // Create abort controller for each request
  createAbortController() {
    if (this.requestAbortController) {
      this.requestAbortController.abort();
    }
    this.requestAbortController = new AbortController();
    return this.requestAbortController.signal;
  },

  async getAllNotes() {
    try {
      const cacheKey = 'active-notes';
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < 30000) {
        return cached.data;
      }

      const signal = this.createAbortController();
      const response = await fetch(`${API_BASE_URL}/notes`, { signal });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const notes = data.status === 'success' ? data.data : [];

      this.cache.set(cacheKey, { data: notes, timestamp: Date.now() });
      return notes;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return [];
      }
      console.error('Error fetching notes:', error);
      throw new Error('Gagal mengambil catatan aktif');
    }
  },

  async getArchivedNotes() {
    try {
      const cacheKey = 'archived-notes';
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < 30000) {
        return cached.data;
      }

      const signal = this.createAbortController();
      const response = await fetch(`${API_BASE_URL}/notes/archived`, {
        signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const notes = data.status === 'success' ? data.data : [];

      this.cache.set(cacheKey, { data: notes, timestamp: Date.now() });
      return notes;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return [];
      }
      console.error('Error fetching archived notes:', error);
      throw new Error('Gagal mengambil catatan arsip');
    }
  },

  async createNote(title, body) {
    try {
      const signal = this.createAbortController();
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim() }),
        signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message);

      this.cache.delete('active-notes');
      return data.data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return null;
      }
      console.error('Error creating note:', error);
      throw new Error('Gagal membuat catatan baru');
    }
  },

  async deleteNote(noteId) {
    try {
      const signal = this.createAbortController();
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
        signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      this.cache.delete('active-notes');
      this.cache.delete('archived-notes');
      return data.status === 'success';
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return false;
      }
      console.error('Error deleting note:', error);
      throw new Error('Gagal menghapus catatan');
    }
  },

  async archiveNote(noteId) {
    try {
      const signal = this.createAbortController();
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}/archive`, {
        method: 'POST',
        signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      this.cache.delete('active-notes');
      this.cache.delete('archived-notes');
      return data.status === 'success';
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return false;
      }
      console.error('Error archiving note:', error);
      throw new Error('Gagal mengarsipkan catatan');
    }
  },

  async unarchiveNote(noteId) {
    try {
      const signal = this.createAbortController();
      const response = await fetch(
        `${API_BASE_URL}/notes/${noteId}/unarchive`,
        {
          method: 'POST',
          signal,
        }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      this.cache.delete('active-notes');
      this.cache.delete('archived-notes');
      return data.status === 'success';
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
        return false;
      }
      console.error('Error unarchiving note:', error);
      throw new Error('Gagal memindahkan catatan dari arsip');
    }
  },
};

// Notes App Class with stability fixes
class NotesApp {
  constructor() {
    // Prevent multiple instances
    if (appInstance) {
      console.warn('NotesApp instance already exists');
      return appInstance;
    }

    this.activeTab = 'active';
    this.currentSearch = '';
    this.activeNotes = [];
    this.archivedNotes = [];
    this.isLoading = false;
    this.isDestroyed = false;

    // Cache DOM elements
    this.elements = {};

    // Track timeouts and intervals for cleanup
    this.timeouts = new Set();
    this.intervals = new Set();

    // Bind methods to prevent context loss
    this.handleNoteSubmit = this.handleNoteSubmit.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleButtonClick = this.handleButtonClick.bind(this);

    appInstance = this;
    this.init();
  }

  // Safe timeout wrapper
  safeSetTimeout(callback, delay) {
    const timeoutId = setTimeout(() => {
      this.timeouts.delete(timeoutId);
      if (!this.isDestroyed) {
        callback();
      }
    }, delay);
    this.timeouts.add(timeoutId);
    return timeoutId;
  }

  // Safe interval wrapper
  safeSetInterval(callback, delay) {
    const intervalId = setInterval(() => {
      if (!this.isDestroyed) {
        callback();
      } else {
        clearInterval(intervalId);
        this.intervals.delete(intervalId);
      }
    }, delay);
    this.intervals.add(intervalId);
    return intervalId;
  }

  async init() {
    try {
      // Prevent initialization if already destroyed
      if (this.isDestroyed) return;

      hideLoading();

      this.cacheElements();
      this.setupEventListeners();
      this.updateTabCounts();

      // Load data with error boundary
      this.safeSetTimeout(() => {
        if (!this.isDestroyed) {
          this.loadInitialData().catch((error) => {
            console.error('Failed to load initial data:', error);
            this.renderErrorState();
          });
        }
      }, 100);
    } catch (error) {
      console.error('Error during app initialization:', error);
      this.handleCriticalError(error);
    }
  }

  cacheElements() {
    try {
      this.elements = {
        notesList: document.getElementById('notes-list'),
        searchInput: document.getElementById('search-notes'),
        tabs: document.querySelectorAll('.tab'),
        activeTab: document.getElementById('active-tab'),
        archivedTab: document.getElementById('archived-tab'),
      };

      // Validate that elements exist
      if (!this.elements.notesList) {
        throw new Error('Required DOM elements not found');
      }
    } catch (error) {
      console.error('Error caching elements:', error);
      this.handleCriticalError(error);
    }
  }

  async loadInitialData() {
    if (this.isLoading || this.isDestroyed) return;

    this.isLoading = true;
    this.showInlineLoading();

    try {
      const [activeResult, archivedResult] = await Promise.allSettled([
        api.getAllNotes(),
        api.getArchivedNotes(),
      ]);

      // Check if component was destroyed during async operation
      if (this.isDestroyed) return;

      this.activeNotes =
        activeResult.status === 'fulfilled' ? activeResult.value || [] : [];
      this.archivedNotes =
        archivedResult.status === 'fulfilled' ? archivedResult.value || [] : [];

      this.safeRender(() => {
        this.renderNotes();
        this.updateTabCounts();
      });

      if (this.activeNotes.length > 0 || this.archivedNotes.length > 0) {
        showToast('🎉 Catatan berhasil dimuat!', 'success', 2000);
      }
    } catch (error) {
      if (!this.isDestroyed) {
        console.error('Error loading data:', error);
        this.renderErrorState();
        showToast('❌ Gagal memuat catatan', 'error');
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Safe render wrapper
  safeRender(renderFunction) {
    if (this.isDestroyed) return;

    try {
      if ('requestAnimationFrame' in window) {
        requestAnimationFrame(() => {
          if (!this.isDestroyed) {
            renderFunction();
          }
        });
      } else {
        renderFunction();
      }
    } catch (error) {
      console.error('Error during render:', error);
      this.handleCriticalError(error);
    }
  }

  showInlineLoading() {
    if (!this.elements.notesList || this.isDestroyed) return;

    try {
      this.elements.notesList.innerHTML = `
        <div class="inline-loading" style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px;
          color: #718096;
        ">
          <div style="
            width: 24px;
            height: 24px;
            border: 2px solid #e2e8f0;
            border-top: 2px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 12px;
          "></div>
          <p style="font-size: 0.9rem;">Memuat catatan...</p>
        </div>
      `;
    } catch (error) {
      console.error('Error showing loading:', error);
    }
  }

  renderErrorState() {
    if (!this.elements.notesList || this.isDestroyed) return;

    try {
      this.elements.notesList.innerHTML = `
        <div class="error-state" style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 40px 20px;
          color: #f56565;
        ">
          <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
          <h3 style="margin-bottom: 6px; color: #2d3748; font-size: 1.1rem;">Gagal memuat catatan</h3>
          <p style="color: #718096; margin-bottom: 16px; font-size: 0.9rem;">Terjadi kesalahan saat memuat data</p>
          <button onclick="window.location.reload()" style="
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
          ">🔄 Muat Ulang</button>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering error state:', error);
    }
  }

  updateTabCounts() {
    if (this.isDestroyed) return;

    try {
      const activeCount = this.activeNotes.length;
      const archivedCount = this.archivedNotes.length;

      if (this.elements.activeTab) {
        this.elements.activeTab.innerHTML = `📝 Catatan Aktif <span style="background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 4px;">${activeCount}</span>`;
      }

      if (this.elements.archivedTab) {
        this.elements.archivedTab.innerHTML = `📚 Arsip <span style="background: rgba(255,255,255,0.2); padding: 1px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 4px;">${archivedCount}</span>`;
      }
    } catch (error) {
      console.error('Error updating tab counts:', error);
    }
  }

  getCurrentNotes() {
    return this.activeTab === 'active' ? this.activeNotes : this.archivedNotes;
  }

  getFilteredNotes() {
    try {
      const notes = this.getCurrentNotes();
      if (!this.currentSearch) return notes;

      const searchLower = this.currentSearch.toLowerCase();
      return notes.filter(
        (note) =>
          note.title.toLowerCase().includes(searchLower) ||
          note.body.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error filtering notes:', error);
      return [];
    }
  }

  renderNotes() {
    if (!this.elements.notesList || this.isDestroyed) return;

    try {
      this.elements.notesList.innerHTML = '';
      const filteredNotes = this.getFilteredNotes();

      if (filteredNotes.length === 0) {
        this.renderEmptyState();
        return;
      }

      // Limit rendering to prevent overwhelming the DOM
      const maxNotes = 50;
      const notesToRender = filteredNotes.slice(0, maxNotes);

      const fragment = document.createDocumentFragment();

      notesToRender.forEach((note, index) => {
        if (this.isDestroyed) return;

        const noteItem = this.createNoteElement(note);
        fragment.appendChild(noteItem);
      });

      this.elements.notesList.appendChild(fragment);

      // Show message if there are more notes
      if (filteredNotes.length > maxNotes) {
        const moreMessage = document.createElement('div');
        moreMessage.style.cssText = `
          grid-column: 1 / -1;
          text-align: center;
          padding: 20px;
          color: #718096;
          font-style: italic;
        `;
        moreMessage.textContent = `Menampilkan ${maxNotes} dari ${filteredNotes.length} catatan`;
        this.elements.notesList.appendChild(moreMessage);
      }
    } catch (error) {
      console.error('Error rendering notes:', error);
      this.renderErrorState();
    }
  }

  renderEmptyState() {
    if (!this.elements.notesList || this.isDestroyed) return;

    try {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';

      if (this.currentSearch) {
        emptyMessage.innerHTML = `
          <p>🔍 Tidak ada catatan yang cocok dengan pencarian "<strong>${this.currentSearch}</strong>"</p>
          <p style="font-size: 0.85rem;">Coba gunakan kata kunci yang berbeda.</p>
        `;
      } else {
        const isArchived = this.activeTab === 'archived';
        emptyMessage.innerHTML = `
          <p>${isArchived ? '📚' : '📝'} Belum ada ${isArchived ? 'catatan diarsipkan' : 'catatan aktif'}</p>
          <p style="font-size: 0.85rem;">${isArchived ? 'Arsipkan catatan untuk menyimpannya di sini.' : 'Buat catatan pertama Anda sekarang!'}</p>
        `;
      }

      this.elements.notesList.appendChild(emptyMessage);
    } catch (error) {
      console.error('Error rendering empty state:', error);
    }
  }

  createNoteElement(note) {
    try {
      const noteItem = document.createElement('note-item');

      const attributes = {
        title: note.title || '',
        date: formatDate(note.createdAt),
        body: note.body || '',
        archived: note.archived.toString(),
        'data-id': note.id,
      };

      Object.entries(attributes).forEach(([key, value]) => {
        noteItem.setAttribute(key, value);
      });

      const buttonContainer = document.createElement('div');
      buttonContainer.style.cssText =
        'display: flex; gap: 8px; justify-content: flex-end;';

      const archiveButton = document.createElement('button');
      archiveButton.className = 'btn-archive';
      archiveButton.textContent = note.archived
        ? '📤 Pindahkan'
        : '📥 Arsipkan';
      archiveButton.dataset.action = 'toggle-archive';
      archiveButton.dataset.id = note.id;
      archiveButton.dataset.shouldArchive = (!note.archived).toString();

      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn-delete';
      deleteButton.textContent = '🗑️ Hapus';
      deleteButton.dataset.action = 'delete';
      deleteButton.dataset.id = note.id;

      buttonContainer.appendChild(archiveButton);
      buttonContainer.appendChild(deleteButton);
      noteItem.appendChild(buttonContainer);

      return noteItem;
    } catch (error) {
      console.error('Error creating note element:', error);
      return document.createElement('div');
    }
  }

  // Event handlers with error boundaries
  handleNoteSubmit(event) {
    try {
      const { title, body } = event.detail;
      if (title && body && !this.isDestroyed) {
        this.addNote(title, body);
      }
    } catch (error) {
      console.error('Error handling note submit:', error);
      showToast('❌ Gagal menambah catatan', 'error');
    }
  }

  handleSearch(event) {
    try {
      if (!this.isDestroyed) {
        this.searchNotes(event.target.value);
      }
    } catch (error) {
      console.error('Error handling search:', error);
    }
  }

  handleTabClick(event) {
    try {
      const tabName = event.target.getAttribute('data-tab');
      if (tabName && !this.isDestroyed) {
        this.switchTab(tabName);
      }
    } catch (error) {
      console.error('Error handling tab click:', error);
    }
  }

  handleButtonClick(event) {
    try {
      const button = event.target.closest('button[data-action]');
      if (!button || this.isDestroyed) return;

      const action = button.dataset.action;
      const id = button.dataset.id;

      if (action === 'delete') {
        this.deleteNote(id);
      } else if (action === 'toggle-archive') {
        const shouldArchive = button.dataset.shouldArchive === 'true';
        this.toggleArchiveNote(id, shouldArchive);
      }
    } catch (error) {
      console.error('Error handling button click:', error);
      showToast('❌ Operasi gagal', 'error');
    }
  }

  async addNote(title, body) {
    if (this.isLoading || this.isDestroyed) return;

    this.isLoading = true;

    try {
      const newNote = await api.createNote(title, body);
      if (newNote && !this.isDestroyed) {
        this.activeNotes.unshift(newNote);

        this.safeRender(() => {
          this.renderNotes();
          this.updateTabCounts();
        });

        showToast('✅ Catatan berhasil ditambahkan!', 'success');

        if (this.activeTab !== 'active') {
          this.switchTab('active');
        }
      }
    } catch (error) {
      if (!this.isDestroyed) {
        console.error('Error adding note:', error);
        showToast('❌ Gagal menambah catatan', 'error');
      }
    } finally {
      this.isLoading = false;
    }
  }

  async deleteNote(id) {
    if (this.isLoading || this.isDestroyed) return;

    try {
      const confirmMessage =
        '🗑️ Apakah Anda yakin ingin menghapus catatan ini?';
      if (!confirm(confirmMessage)) return;

      this.isLoading = true;

      const success = await api.deleteNote(id);
      if (success && !this.isDestroyed) {
        this.activeNotes = this.activeNotes.filter((note) => note.id !== id);
        this.archivedNotes = this.archivedNotes.filter(
          (note) => note.id !== id
        );

        this.safeRender(() => {
          this.renderNotes();
          this.updateTabCounts();
        });

        showToast('🗑️ Catatan berhasil dihapus!', 'success');
      }
    } catch (error) {
      if (!this.isDestroyed) {
        console.error('Error deleting note:', error);
        showToast('❌ Gagal menghapus catatan', 'error');
      }
    } finally {
      this.isLoading = false;
    }
  }

  async toggleArchiveNote(id, shouldArchive) {
    if (this.isLoading || this.isDestroyed) return;

    this.isLoading = true;

    try {
      const success = shouldArchive
        ? await api.archiveNote(id)
        : await api.unarchiveNote(id);

      if (success && !this.isDestroyed) {
        if (shouldArchive) {
          const noteIndex = this.activeNotes.findIndex(
            (note) => note.id === id
          );
          if (noteIndex !== -1) {
            const note = this.activeNotes.splice(noteIndex, 1)[0];
            note.archived = true;
            this.archivedNotes.unshift(note);
          }
        } else {
          const noteIndex = this.archivedNotes.findIndex(
            (note) => note.id === id
          );
          if (noteIndex !== -1) {
            const note = this.archivedNotes.splice(noteIndex, 1)[0];
            note.archived = false;
            this.activeNotes.unshift(note);
          }
        }

        this.safeRender(() => {
          this.renderNotes();
          this.updateTabCounts();
        });

        const message = shouldArchive
          ? '📥 Catatan berhasil diarsipkan!'
          : '📤 Catatan berhasil dipindahkan!';
        showToast(message, 'success');
      }
    } catch (error) {
      if (!this.isDestroyed) {
        console.error('Error toggling archive:', error);
        showToast('❌ Gagal mengubah status arsip', 'error');
      }
    } finally {
      this.isLoading = false;
    }
  }

  switchTab(tabName) {
    if (this.isDestroyed) return;

    try {
      this.activeTab = tabName;

      this.elements.tabs.forEach((tab) => {
        const isActive = tab.getAttribute('data-tab') === tabName;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive.toString());
      });

      if (this.elements.searchInput) {
        this.elements.searchInput.value = '';
        this.currentSearch = '';
      }

      this.safeRender(() => this.renderNotes());
    } catch (error) {
      console.error('Error switching tab:', error);
    }
  }

  searchNotes(query) {
    if (this.isDestroyed) return;

    try {
      this.currentSearch = query.trim();
      this.safeRender(() => this.renderNotes());
    } catch (error) {
      console.error('Error searching notes:', error);
    }
  }

  setupEventListeners() {
    try {
      // Remove existing listeners first
      this.removeEventListeners();

      // Event delegation for notes list
      if (this.elements.notesList) {
        this.elements.notesList.addEventListener(
          'click',
          this.handleButtonClick
        );
      }

      // Note form submission
      document.addEventListener('note-submit', this.handleNoteSubmit);

      // Search with debouncing
      if (this.elements.searchInput) {
        const debouncedSearch = debounce(this.handleSearch, 300);
        this.elements.searchInput.addEventListener('input', debouncedSearch);

        this.elements.searchInput.addEventListener('keydown', (event) => {
          if (event.key === 'Escape' && !this.isDestroyed) {
            event.target.value = '';
            this.searchNotes('');
          }
        });
      }

      // Tab switching
      this.elements.tabs.forEach((tab) => {
        tab.addEventListener('click', this.handleTabClick);
      });

      // Network status monitoring
      window.addEventListener('online', () => {
        if (!this.isDestroyed) {
          showToast('🌐 Koneksi tersambung kembali', 'success', 2000);
          api.cache.clear();
          this.loadInitialData();
        }
      });

      window.addEventListener('offline', () => {
        if (!this.isDestroyed) {
          showToast('📱 Koneksi terputus', 'error', 3000);
        }
      });

      // Cleanup on page unload
      window.addEventListener('beforeunload', () => {
        this.destroy();
      });

      // Error boundary
      window.addEventListener('error', (event) => {
        console.error('Global error:', event.error);
        this.handleCriticalError(event.error);
      });

      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        this.handleCriticalError(event.reason);
      });
    } catch (error) {
      console.error('Error setting up event listeners:', error);
      this.handleCriticalError(error);
    }
  }

  removeEventListeners() {
    try {
      if (this.elements.notesList) {
        this.elements.notesList.removeEventListener(
          'click',
          this.handleButtonClick
        );
      }

      document.removeEventListener('note-submit', this.handleNoteSubmit);

      if (this.elements.searchInput) {
        this.elements.searchInput.removeEventListener(
          'input',
          this.handleSearch
        );
      }

      this.elements.tabs.forEach((tab) => {
        tab.removeEventListener('click', this.handleTabClick);
      });
    } catch (error) {
      console.error('Error removing event listeners:', error);
    }
  }

  handleCriticalError(error) {
    console.error('Critical error in NotesApp:', error);

    // Prevent infinite loops
    if (this.isDestroyed) return;

    // Show user-friendly error message
    showToast(
      '❌ Terjadi kesalahan aplikasi. Halaman akan dimuat ulang.',
      'error',
      5000
    );

    // Cleanup and reload after delay
    this.safeSetTimeout(() => {
      this.destroy();
      window.location.reload();
    }, 3000);
  }

  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    try {
      // Abort any pending requests
      if (api.requestAbortController) {
        api.requestAbortController.abort();
      }

      // Clear timeouts and intervals
      this.timeouts.forEach((id) => clearTimeout(id));
      this.intervals.forEach((id) => clearInterval(id));
      this.timeouts.clear();
      this.intervals.clear();

      // Remove event listeners
      this.removeEventListeners();

      // Clear references
      this.elements = {};
      this.activeNotes = [];
      this.archivedNotes = [];

      // Reset singleton
      if (appInstance === this) {
        appInstance = null;
      }

      console.log('NotesApp destroyed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Initialize app with error boundary
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Prevent multiple initializations
    if (appInstance) {
      console.warn('App already initialized');
      return;
    }

    // Initialize with delay to ensure DOM is ready
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        try {
          new NotesApp();
        } catch (error) {
          console.error('Error initializing app:', error);
          showToast('❌ Gagal memuat aplikasi', 'error');
        }
      });
    } else {
      setTimeout(() => {
        try {
          new NotesApp();
        } catch (error) {
          console.error('Error initializing app:', error);
          showToast('❌ Gagal memuat aplikasi', 'error');
        }
      }, 100);
    }

    // Performance monitoring
    if (window.performance && window.performance.now) {
      const loadTime = window.performance.now();
      console.log(`✨ App loaded in ${Math.round(loadTime)}ms`);
    }
  } catch (error) {
    console.error('Critical error during app initialization:', error);
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        text-align: center;
        color: #f56565;
        font-family: system-ui;
      ">
        <div>
          <h2>❌ Aplikasi Gagal Dimuat</h2>
          <p>Terjadi kesalahan saat memuat aplikasi.</p>
          <button onclick="window.location.reload()" style="
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 16px;
          ">🔄 Muat Ulang</button>
        </div>
      </div>
    `;
  }
});

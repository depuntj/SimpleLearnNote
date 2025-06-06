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

// API functions with loading indicators
const api = {
  cache: new Map(),
  requestAbortController: null,

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

// Notes App Class with enhanced loading indicators
class NotesApp {
  constructor() {
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

    this.elements = {};
    this.timeouts = new Set();
    this.intervals = new Set();

    // Bind methods
    this.handleNoteSubmit = this.handleNoteSubmit.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleTabClick = this.handleTabClick.bind(this);
    this.handleButtonClick = this.handleButtonClick.bind(this);

    appInstance = this;
    this.init();
  }

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

  async init() {
    try {
      if (this.isDestroyed) return;

      // Show initial loading for better UX
      this.showAppLoading();

      this.cacheElements();
      this.setupEventListeners();
      this.updateTabCounts();

      // Load data with visible loading
      this.safeSetTimeout(async () => {
        if (!this.isDestroyed) {
          try {
            await this.loadInitialData();
          } catch (error) {
            console.error('Failed to load initial data:', error);
            this.renderErrorState();
          } finally {
            this.hideAppLoading();
          }
        }
      }, 300); // Small delay to show loading
    } catch (error) {
      console.error('Error during app initialization:', error);
      this.handleCriticalError(error);
    }
  }

  // Enhanced loading indicators
  showAppLoading() {
    try {
      const loadingOverlay = document.getElementById('loading-indicator');
      if (loadingOverlay) {
        loadingOverlay.classList.remove('hidden');
        loadingOverlay.style.display = 'flex';
        loadingOverlay.style.opacity = '1';
      }

      // Also show inline loading in notes area
      if (this.elements.notesList) {
        this.showInlineLoading();
      }
    } catch (error) {
      console.error('Error showing app loading:', error);
    }
  }

  hideAppLoading() {
    try {
      const loadingOverlay = document.getElementById('loading-indicator');
      if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';

        this.safeSetTimeout(() => {
          if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
            loadingOverlay.style.display = 'none';
          }
        }, 300);
      }
    } catch (error) {
      console.error('Error hiding app loading:', error);
    }
  }

  showInlineLoading() {
    if (!this.elements.notesList || this.isDestroyed) return;

    try {
      this.elements.notesList.innerHTML = `
        <div class="inline-loading" style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #667eea;
          animation: fadeIn 0.3s ease;
        ">
          <div class="loading-spinner-container">
            <div style="
              width: 32px;
              height: 32px;
              border: 3px solid #e2e8f0;
              border-top: 3px solid #667eea;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 16px;
            "></div>
            <p style="font-size: 0.95rem; font-weight: 500; margin-bottom: 8px;">Memuat catatan...</p>
            <p style="font-size: 0.8rem; opacity: 0.7;">Silakan tunggu sebentar</p>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error showing inline loading:', error);
    }
  }

  showButtonLoading(button, originalText) {
    try {
      if (!button) return;

      button.disabled = true;
      button.innerHTML = `
        <span style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
        ">
          <span style="
            width: 14px;
            height: 14px;
            border: 2px solid rgba(255,255,255,0.3);
            border-top: 2px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></span>
          Memproses...
        </span>
      `;

      return {
        restore: () => {
          if (button) {
            button.disabled = false;
            button.innerHTML = originalText;
          }
        },
      };
    } catch (error) {
      console.error('Error showing button loading:', error);
      return { restore: () => {} };
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

    try {
      // Show loading toast
      const loadingToastId = showToast(
        '📥 Memuat catatan dari server...',
        'info',
        10000
      );

      const [activeResult, archivedResult] = await Promise.allSettled([
        api.getAllNotes(),
        api.getArchivedNotes(),
      ]);

      // Hide loading toast
      const loadingToast = document.getElementById(`toast-${loadingToastId}`);
      if (loadingToast) loadingToast.remove();

      if (this.isDestroyed) return;

      this.activeNotes =
        activeResult.status === 'fulfilled' ? activeResult.value || [] : [];
      this.archivedNotes =
        archivedResult.status === 'fulfilled' ? archivedResult.value || [] : [];

      this.safeRender(() => {
        this.renderNotes();
        this.updateTabCounts();
      });

      // Show success feedback
      const totalNotes = this.activeNotes.length + this.archivedNotes.length;
      if (totalNotes > 0) {
        showToast(`✅ ${totalNotes} catatan berhasil dimuat!`, 'success', 3000);
      } else {
        showToast(
          '📝 Belum ada catatan. Buat catatan pertama Anda!',
          'info',
          3000
        );
      }
    } catch (error) {
      if (!this.isDestroyed) {
        console.error('Error loading data:', error);
        this.renderErrorState();
        showToast('❌ Gagal memuat catatan dari server', 'error', 5000);
      }
    } finally {
      this.isLoading = false;
    }
  }

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

  renderErrorState() {
    if (!this.elements.notesList || this.isDestroyed) return;

    try {
      this.elements.notesList.innerHTML = `
        <div class="error-state" style="
          grid-column: 1 / -1;
          text-align: center;
          padding: 60px 20px;
          color: #f56565;
          animation: fadeIn 0.3s ease;
        ">
          <div style="font-size: 48px; margin-bottom: 16px; animation: bounce 2s infinite;">⚠️</div>
          <h3 style="margin-bottom: 8px; color: #2d3748; font-size: 1.2rem;">Gagal memuat catatan</h3>
          <p style="color: #718096; margin-bottom: 20px; font-size: 0.9rem;">Terjadi kesalahan saat mengambil data dari server</p>
          <button onclick="window.location.reload()" style="
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.9rem;
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(102, 126, 234, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'">
            🔄 Muat Ulang Halaman
          </button>
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
        this.elements.activeTab.innerHTML = `📝 Catatan Aktif <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 4px; font-weight: 600;">${activeCount}</span>`;
      }

      if (this.elements.archivedTab) {
        this.elements.archivedTab.innerHTML = `📚 Arsip <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 4px; font-weight: 600;">${archivedCount}</span>`;
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

      const maxNotes = 50;
      const notesToRender = filteredNotes.slice(0, maxNotes);

      const fragment = document.createDocumentFragment();

      notesToRender.forEach((note, index) => {
        if (this.isDestroyed) return;

        const noteItem = this.createNoteElement(note);
        fragment.appendChild(noteItem);
      });

      this.elements.notesList.appendChild(fragment);

      if (filteredNotes.length > maxNotes) {
        const moreMessage = document.createElement('div');
        moreMessage.style.cssText = `
          grid-column: 1 / -1;
          text-align: center;
          padding: 20px;
          color: #718096;
          font-style: italic;
          background: rgba(255,255,255,0.5);
          border-radius: 8px;
          margin-top: 10px;
        `;
        moreMessage.innerHTML = `
          <p style="margin: 0; font-size: 0.9rem;">
            📄 Menampilkan ${maxNotes} dari ${filteredNotes.length} catatan
          </p>
          <p style="margin: 8px 0 0 0; font-size: 0.8rem; opacity: 0.8;">
            Gunakan pencarian untuk menemukan catatan spesifik
          </p>
        `;
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
      emptyMessage.style.animation = 'fadeIn 0.3s ease';

      if (this.currentSearch) {
        emptyMessage.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
            <h3 style="margin-bottom: 8px; color: #4a5568;">Pencarian tidak ditemukan</h3>
            <p style="margin-bottom: 16px; color: #718096;">Tidak ada catatan yang cocok dengan "<strong>${this.currentSearch}</strong>"</p>
            <button onclick="document.getElementById('search-notes').value=''; document.getElementById('search-notes').dispatchEvent(new Event('input'))" style="
              background: #667eea;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 0.85rem;
            ">✨ Hapus Pencarian</button>
          </div>
        `;
      } else {
        const isArchived = this.activeTab === 'archived';
        emptyMessage.innerHTML = `
          <div style="text-align: center; padding: 40px;">
            <div style="font-size: 48px; margin-bottom: 16px; animation: bounce 2s infinite;">${isArchived ? '📚' : '📝'}</div>
            <h3 style="margin-bottom: 8px; color: #4a5568;">${isArchived ? 'Belum ada catatan diarsipkan' : 'Belum ada catatan aktif'}</h3>
            <p style="color: #718096; font-size: 0.9rem;">${isArchived ? 'Arsipkan catatan untuk menyimpannya di sini.' : 'Buat catatan pertama Anda sekarang!'}</p>
          </div>
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

  // Event handlers with loading indicators
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
        // Show search loading for long queries
        if (event.target.value.length > 2) {
          showToast('🔍 Mencari catatan...', 'info', 1000);
        }
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
        // Show loading feedback for tab switch
        showToast('🔄 Memuat tab...', 'info', 500);
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
        this.deleteNote(id, button);
      } else if (action === 'toggle-archive') {
        const shouldArchive = button.dataset.shouldArchive === 'true';
        this.toggleArchiveNote(id, shouldArchive, button);
      }
    } catch (error) {
      console.error('Error handling button click:', error);
      showToast('❌ Operasi gagal', 'error');
    }
  }

  async addNote(title, body) {
    if (this.isLoading || this.isDestroyed) return;

    this.isLoading = true;

    // Show loading toast
    const loadingToastId = showToast(
      '💾 Menyimpan catatan baru...',
      'info',
      10000
    );

    try {
      const newNote = await api.createNote(title, body);

      // Hide loading toast
      const loadingToast = document.getElementById(`toast-${loadingToastId}`);
      if (loadingToast) loadingToast.remove();

      if (newNote && !this.isDestroyed) {
        this.activeNotes.unshift(newNote);

        this.safeRender(() => {
          this.renderNotes();
          this.updateTabCounts();
        });

        showToast('✅ Catatan berhasil ditambahkan!', 'success', 3000);

        if (this.activeTab !== 'active') {
          this.switchTab('active');
        }
      }
    } catch (error) {
      // Hide loading toast
      const loadingToast = document.getElementById(`toast-${loadingToastId}`);
      if (loadingToast) loadingToast.remove();

      if (!this.isDestroyed) {
        console.error('Error adding note:', error);
        showToast('❌ Gagal menyimpan catatan', 'error', 5000);
      }
    } finally {
      this.isLoading = false;
    }
  }

  async deleteNote(id, button) {
    if (this.isLoading || this.isDestroyed) return;

    try {
      const confirmMessage =
        '🗑️ Apakah Anda yakin ingin menghapus catatan ini?\n\nCatatan yang dihapus tidak dapat dikembalikan.';
      if (!confirm(confirmMessage)) return;

      this.isLoading = true;

      // Show button loading
      const originalText = button ? button.innerHTML : '';
      const buttonLoader = button
        ? this.showButtonLoading(button, originalText)
        : { restore: () => {} };

      // Show toast loading
      const loadingToastId = showToast(
        '🗑️ Menghapus catatan...',
        'info',
        10000
      );

      const success = await api.deleteNote(id);

      // Hide loading
      const loadingToast = document.getElementById(`toast-${loadingToastId}`);
      if (loadingToast) loadingToast.remove();
      buttonLoader.restore();

      if (success && !this.isDestroyed) {
        this.activeNotes = this.activeNotes.filter((note) => note.id !== id);
        this.archivedNotes = this.archivedNotes.filter(
          (note) => note.id !== id
        );

        this.safeRender(() => {
          this.renderNotes();
          this.updateTabCounts();
        });

        showToast('🗑️ Catatan berhasil dihapus!', 'success', 3000);
      }
    } catch (error) {
      if (!this.isDestroyed) {
        console.error('Error deleting note:', error);
        showToast('❌ Gagal menghapus catatan', 'error', 5000);
      }
    } finally {
      this.isLoading = false;
    }
  }

  async toggleArchiveNote(id, shouldArchive, button) {
    if (this.isLoading || this.isDestroyed) return;

    this.isLoading = true;

    try {
      // Show button loading
      const originalText = button ? button.innerHTML : '';
      const buttonLoader = button
        ? this.showButtonLoading(button, originalText)
        : { restore: () => {} };

      // Show toast loading
      const action = shouldArchive ? 'Mengarsipkan' : 'Memindahkan';
      const loadingToastId = showToast(
        `📦 ${action} catatan...`,
        'info',
        10000
      );

      const success = shouldArchive
        ? await api.archiveNote(id)
        : await api.unarchiveNote(id);

      // Hide loading
      const loadingToast = document.getElementById(`toast-${loadingToastId}`);
      if (loadingToast) loadingToast.remove();
      buttonLoader.restore();

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
        showToast(message, 'success', 3000);
      }
    } catch (error) {
      if (!this.isDestroyed) {
        console.error('Error toggling archive:', error);
        showToast('❌ Gagal mengubah status arsip', 'error', 5000);
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
      this.removeEventListeners();

      if (this.elements.notesList) {
        this.elements.notesList.addEventListener(
          'click',
          this.handleButtonClick
        );
      }

      document.addEventListener('note-submit', this.handleNoteSubmit);

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

      this.elements.tabs.forEach((tab) => {
        tab.addEventListener('click', this.handleTabClick);
      });

      window.addEventListener('online', () => {
        if (!this.isDestroyed) {
          showToast('🌐 Koneksi tersambung kembali', 'success', 3000);
          api.cache.clear();
          this.loadInitialData();
        }
      });

      window.addEventListener('offline', () => {
        if (!this.isDestroyed) {
          showToast('📱 Koneksi terputus', 'error', 5000);
        }
      });

      window.addEventListener('beforeunload', () => {
        this.destroy();
      });

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

    if (this.isDestroyed) return;

    showToast(
      '❌ Terjadi kesalahan aplikasi. Halaman akan dimuat ulang dalam 5 detik.',
      'error',
      6000
    );

    this.safeSetTimeout(() => {
      this.destroy();
      window.location.reload();
    }, 5000);
  }

  destroy() {
    if (this.isDestroyed) return;

    this.isDestroyed = true;

    try {
      if (api.requestAbortController) {
        api.requestAbortController.abort();
      }

      this.timeouts.forEach((id) => clearTimeout(id));
      this.intervals.forEach((id) => clearInterval(id));
      this.timeouts.clear();
      this.intervals.clear();

      this.removeEventListeners();

      this.elements = {};
      this.activeNotes = [];
      this.archivedNotes = [];

      if (appInstance === this) {
        appInstance = null;
      }

      console.log('NotesApp destroyed successfully');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Initialize app with enhanced loading
document.addEventListener('DOMContentLoaded', () => {
  try {
    if (appInstance) {
      console.warn('App already initialized');
      return;
    }

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
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      ">
        <div style="
          background: white;
          padding: 40px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 400px;
        ">
          <div style="font-size: 48px; margin-bottom: 16px;">❌</div>
          <h2 style="margin-bottom: 16px; color: #2d3748;">Aplikasi Gagal Dimuat</h2>
          <p style="margin-bottom: 24px; color: #4a5568;">Terjadi kesalahan saat memuat aplikasi catatan.</p>
          <button onclick="window.location.reload()" style="
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          ">🔄 Muat Ulang Aplikasi</button>
        </div>
      </div>
    `;
  }
});

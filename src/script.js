import './style.css';
import './component.js';
import NotesAPI from './api.js';
import {
  formatDate,
  showLoading,
  hideLoading,
  showToast,
  debounce,
} from './utils.js';

class NotesApp {
  constructor() {
    this.activeTab = 'active';
    this.currentSearch = '';
    this.activeNotes = [];
    this.archivedNotes = [];
    this.isLoading = false;

    this.elements = {};

    console.log('🚀 NotesApp initialized');
    this.init();
  }

  async init() {
    try {
      console.log('📋 Starting app initialization...');

      this.cacheElements();
      this.setupEventListeners();

      console.log('📡 Loading notes from API...');
      await this.loadNotesFromAPI();

      console.log('✅ App initialization completed');
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      this.showErrorState();
    }
  }

  cacheElements() {
    this.elements = {
      notesList: document.getElementById('notes-list'),
      searchInput: document.getElementById('search-notes'),
      activeTab: document.getElementById('active-tab'),
      archivedTab: document.getElementById('archived-tab'),
      tabs: document.querySelectorAll('.tab'),
    };

    console.log('📦 Elements cached:', {
      notesList: !!this.elements.notesList,
      searchInput: !!this.elements.searchInput,
      activeTab: !!this.elements.activeTab,
      archivedTab: !!this.elements.archivedTab,
      tabs: this.elements.tabs.length,
    });
  }

  async loadNotesFromAPI() {
    if (this.isLoading) {
      console.log('⏳ Already loading, skipping...');
      return;
    }

    this.isLoading = true;
    showLoading();

    console.log('📡 Fetching data from API...');
    console.log('🌐 API Base URL:', 'https://notes-api.dicoding.dev/v2');

    try {
      console.log('📥 Calling getAllNotes...');
      const activeNotesPromise = NotesAPI.getAllNotes();

      console.log('📚 Calling getArchivedNotes...');
      const archivedNotesPromise = NotesAPI.getArchivedNotes();

      const [activeNotes, archivedNotes] = await Promise.all([
        activeNotesPromise,
        archivedNotesPromise,
      ]);

      console.log('📊 API Response received:');
      console.log('  - Active notes:', activeNotes?.length || 0, activeNotes);
      console.log(
        '  - Archived notes:',
        archivedNotes?.length || 0,
        archivedNotes
      );

      this.activeNotes = activeNotes || [];
      this.archivedNotes = archivedNotes || [];

      console.log('🎨 Rendering notes...');
      this.renderNotes();
      this.updateTabCounts();

      const totalNotes = this.activeNotes.length + this.archivedNotes.length;
      console.log(`✅ Successfully loaded ${totalNotes} notes total`);

      if (totalNotes > 0) {
        showToast(
          `✅ ${totalNotes} catatan berhasil dimuat dari API!`,
          'success'
        );
      } else {
        showToast('📝 Belum ada catatan. Buat catatan pertama Anda!', 'info');
        console.log('ℹ️ No notes found, showing empty state');
      }
    } catch (error) {
      console.error('❌ Error loading notes from API:', error);
      console.error('🔍 Error details:', {
        message: error.message,
        stack: error.stack,
      });

      showToast('❌ Gagal memuat catatan dari server', 'error');
      this.showErrorState();
    } finally {
      this.isLoading = false;
      hideLoading();
      console.log('🏁 Loading completed');
    }
  }

  renderNotes() {
    if (!this.elements.notesList) {
      console.error('❌ notesList element not found!');
      return;
    }

    const filteredNotes = this.getFilteredNotes();
    console.log('🎨 Rendering notes:', {
      activeTab: this.activeTab,
      totalFiltered: filteredNotes.length,
      currentSearch: this.currentSearch,
    });

    this.elements.notesList.innerHTML = '';

    if (filteredNotes.length === 0) {
      console.log('📭 No notes to display, showing empty state');
      this.showEmptyState();
      return;
    }

    const fragment = document.createDocumentFragment();

    filteredNotes.forEach((note, index) => {
      console.log(`🏷️ Creating note element ${index + 1}:`, {
        id: note.id,
        title: note.title,
        archived: note.archived,
      });

      const noteItem = this.createNoteElement(note);
      fragment.appendChild(noteItem);
    });

    this.elements.notesList.appendChild(fragment);
    console.log(`✅ Successfully rendered ${filteredNotes.length} notes`);
  }

  createNoteElement(note) {
    const noteItem = document.createElement('note-item');

    noteItem.setAttribute('title', note.title || '');
    noteItem.setAttribute('date', formatDate(note.createdAt));
    noteItem.setAttribute('body', note.body || '');
    noteItem.setAttribute('archived', note.archived.toString());
    noteItem.setAttribute('data-id', note.id);

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText =
      'display: flex; gap: 8px; justify-content: flex-end;';

    const archiveButton = document.createElement('button');
    archiveButton.className = 'btn-archive';
    archiveButton.textContent = note.archived ? '📤 Pindahkan' : '📥 Arsipkan';
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
  }

  getCurrentNotes() {
    const notes =
      this.activeTab === 'active' ? this.activeNotes : this.archivedNotes;
    console.log(
      `📋 Getting current notes for tab "${this.activeTab}":`,
      notes.length
    );
    return notes;
  }

  getFilteredNotes() {
    const notes = this.getCurrentNotes();
    if (!this.currentSearch) return notes;

    const searchLower = this.currentSearch.toLowerCase();
    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchLower) ||
        note.body.toLowerCase().includes(searchLower)
    );

    console.log(`🔍 Filtered notes with search "${this.currentSearch}":`, {
      total: notes.length,
      filtered: filtered.length,
    });

    return filtered;
  }

  updateTabCounts() {
    console.log('🔢 Updating tab counts:', {
      active: this.activeNotes.length,
      archived: this.archivedNotes.length,
    });

    if (this.elements.activeTab) {
      this.elements.activeTab.innerHTML = `📝 Catatan Aktif <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 4px; font-weight: 600;">${this.activeNotes.length}</span>`;
    }

    if (this.elements.archivedTab) {
      this.elements.archivedTab.innerHTML = `📚 Arsip <span style="background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 10px; font-size: 0.75em; margin-left: 4px; font-weight: 600;">${this.archivedNotes.length}</span>`;
    }
  }

  showEmptyState() {
    const emptyMessage = document.createElement('div');
    emptyMessage.className = 'empty-message';

    if (this.currentSearch) {
      emptyMessage.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">🔍</div>
          <h3 style="margin-bottom: 8px; color: #4a5568;">Pencarian tidak ditemukan</h3>
          <p style="margin-bottom: 16px; color: #718096;">Tidak ada catatan yang cocok dengan "<strong>${this.currentSearch}</strong>"</p>
          <button onclick="document.getElementById('search-notes').value=''; document.getElementById('search-notes').dispatchEvent(new Event('input'))" style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem;">✨ Hapus Pencarian</button>
        </div>
      `;
    } else {
      const isArchived = this.activeTab === 'archived';
      emptyMessage.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">${isArchived ? '📚' : '📝'}</div>
          <h3 style="margin-bottom: 8px; color: #4a5568;">${isArchived ? 'Belum ada catatan diarsipkan' : 'Belum ada catatan aktif'}</h3>
          <p style="color: #718096; font-size: 0.9rem;">${isArchived ? 'Arsipkan catatan untuk menyimpannya di sini.' : 'Buat catatan pertama Anda sekarang!'}</p>
        </div>
      `;
    }

    this.elements.notesList.appendChild(emptyMessage);
  }

  showErrorState() {
    if (!this.elements.notesList) return;

    this.elements.notesList.innerHTML = `
      <div class="error-state" style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #f56565;">
        <div style="font-size: 48px; margin-bottom: 16px;">⚠️</div>
        <h3 style="margin-bottom: 8px; color: #2d3748; font-size: 1.2rem;">Gagal memuat catatan dari API</h3>
        <p style="color: #718096; margin-bottom: 20px; font-size: 0.9rem;">Periksa koneksi internet dan coba lagi</p>
        <button onclick="window.location.reload()" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);">🔄 Muat Ulang Halaman</button>
      </div>
    `;
  }

  async addNote(title, body) {
    if (this.isLoading) return;

    console.log('➕ Adding new note:', { title, body });
    this.isLoading = true;
    showLoading();

    try {
      const newNote = await NotesAPI.createNote(title, body);
      console.log('✅ Note created successfully:', newNote);

      if (newNote) {
        this.activeNotes.unshift(newNote);
        this.renderNotes();
        this.updateTabCounts();
        showToast('✅ Catatan berhasil ditambahkan!', 'success');

        if (this.activeTab !== 'active') {
          this.switchTab('active');
        }
      }
    } catch (error) {
      console.error('❌ Error adding note:', error);
      showToast('❌ Gagal menyimpan catatan', 'error');
    } finally {
      this.isLoading = false;
      hideLoading();
    }
  }

  async deleteNote(id) {
    if (this.isLoading) return;

    if (
      !confirm(
        '🗑️ Apakah Anda yakin ingin menghapus catatan ini?\n\nCatatan yang dihapus tidak dapat dikembalikan.'
      )
    ) {
      return;
    }

    console.log('🗑️ Deleting note:', id);
    this.isLoading = true;
    showLoading();

    try {
      const success = await NotesAPI.deleteNote(id);
      console.log('✅ Note deleted successfully:', success);

      if (success) {
        this.activeNotes = this.activeNotes.filter((note) => note.id !== id);
        this.archivedNotes = this.archivedNotes.filter(
          (note) => note.id !== id
        );

        this.renderNotes();
        this.updateTabCounts();
        showToast('🗑️ Catatan berhasil dihapus!', 'success');
      }
    } catch (error) {
      console.error('❌ Error deleting note:', error);
      showToast('❌ Gagal menghapus catatan', 'error');
    } finally {
      this.isLoading = false;
      hideLoading();
    }
  }

  async toggleArchiveNote(id, shouldArchive) {
    if (this.isLoading) return;

    console.log('📦 Toggling archive for note:', { id, shouldArchive });
    this.isLoading = true;
    showLoading();

    try {
      const success = shouldArchive
        ? await NotesAPI.archiveNote(id)
        : await NotesAPI.unarchiveNote(id);

      console.log('✅ Archive toggle successful:', success);

      if (success) {
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

        this.renderNotes();
        this.updateTabCounts();

        const message = shouldArchive
          ? '📥 Catatan berhasil diarsipkan!'
          : '📤 Catatan berhasil dipindahkan!';
        showToast(message, 'success');
      }
    } catch (error) {
      console.error('❌ Error toggling archive:', error);
      showToast('❌ Gagal mengubah status arsip', 'error');
    } finally {
      this.isLoading = false;
      hideLoading();
    }
  }

  switchTab(tabName) {
    console.log('🔄 Switching tab to:', tabName);
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

    this.renderNotes();
  }

  searchNotes(query) {
    console.log('🔍 Searching notes with query:', query);
    this.currentSearch = query.trim();
    this.renderNotes();
  }

  handleNoteSubmit(event) {
    console.log('📝 Note submit event received:', event.detail);
    const { title, body } = event.detail;
    if (title && body) {
      this.addNote(title, body);
    }
  }

  handleSearch(event) {
    this.searchNotes(event.target.value);
  }

  handleTabClick(event) {
    const tabName = event.target.getAttribute('data-tab');
    if (tabName) {
      this.switchTab(tabName);
    }
  }

  handleButtonClick(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    console.log('🔘 Button clicked:', { action, id });

    if (action === 'delete') {
      this.deleteNote(id);
    } else if (action === 'toggle-archive') {
      const shouldArchive = button.dataset.shouldArchive === 'true';
      this.toggleArchiveNote(id, shouldArchive);
    }
  }

  setupEventListeners() {
    console.log('🔗 Setting up event listeners...');

    document.addEventListener('note-submit', (event) =>
      this.handleNoteSubmit(event)
    );

    if (this.elements.notesList) {
      this.elements.notesList.addEventListener('click', (event) =>
        this.handleButtonClick(event)
      );
    }

    if (this.elements.searchInput) {
      const debouncedSearch = debounce(
        (event) => this.handleSearch(event),
        300
      );
      this.elements.searchInput.addEventListener('input', debouncedSearch);

      this.elements.searchInput.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.target.value = '';
          this.searchNotes('');
        }
      });
    }

    this.elements.tabs.forEach((tab) => {
      tab.addEventListener('click', (event) => this.handleTabClick(event));
    });

    window.addEventListener('online', () => {
      console.log('🌐 Connection restored');
      showToast('🌐 Koneksi tersambung kembali', 'success');
      this.loadNotesFromAPI();
    });

    window.addEventListener('offline', () => {
      console.log('📱 Connection lost');
      showToast('📱 Koneksi terputus', 'error');
    });

    console.log('✅ Event listeners setup completed');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('🌟 DOM Content Loaded - Starting Notes App...');

  setTimeout(() => {
    try {
      window.notesApp = new NotesApp();
      console.log('🎉 Notes App berhasil dimuat dan siap digunakan!');
      console.log('🔍 Untuk debug: window.notesApp tersedia di console');
    } catch (error) {
      console.error('💥 Critical error initializing app:', error);
      showToast('❌ Gagal memuat aplikasi', 'error');

      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; font-family: system-ui;">
          <div style="background: rgba(255,255,255,0.1); padding: 40px; border-radius: 16px; backdrop-filter: blur(10px);">
            <div style="font-size: 48px; margin-bottom: 16px;">💥</div>
            <h2 style="margin-bottom: 16px;">Aplikasi Gagal Dimuat</h2>
            <p style="margin-bottom: 24px; opacity: 0.9;">Terjadi kesalahan saat memuat aplikasi catatan.</p>
            <button onclick="window.location.reload()" style="background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">🔄 Muat Ulang Aplikasi</button>
          </div>
        </div>
      `;
    }
  }, 100);
});

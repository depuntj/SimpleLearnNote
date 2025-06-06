import './style.css';
import './components.js';
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

    this.init();
  }

  async init() {
    await this.loadInitialData();
    this.setupEventListeners();
  }

  async loadInitialData() {
    showLoading();
    try {
      await Promise.all([this.loadActiveNotes(), this.loadArchivedNotes()]);
      this.renderNotes();
      showToast('Catatan berhasil dimuat!');
    } catch (error) {
      console.error('Error loading initial data:', error);
      showToast('Gagal memuat catatan. Silakan refresh halaman.', 'error');
    } finally {
      hideLoading();
    }
  }

  async loadActiveNotes() {
    try {
      this.activeNotes = await NotesAPI.getAllNotes();
    } catch (error) {
      console.error('Error loading active notes:', error);
      this.activeNotes = [];
      throw error;
    }
  }

  async loadArchivedNotes() {
    try {
      this.archivedNotes = await NotesAPI.getArchivedNotes();
    } catch (error) {
      console.error('Error loading archived notes:', error);
      this.archivedNotes = [];
      throw error;
    }
  }

  getCurrentNotes() {
    return this.activeTab === 'active' ? this.activeNotes : this.archivedNotes;
  }

  getFilteredNotes() {
    const notes = this.getCurrentNotes();
    if (!this.currentSearch) return notes;

    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(this.currentSearch.toLowerCase()) ||
        note.body.toLowerCase().includes(this.currentSearch.toLowerCase())
    );
  }

  renderNotes() {
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = '';

    const filteredNotes = this.getFilteredNotes();

    if (filteredNotes.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'empty-message';
      emptyMessage.innerHTML = `
        <p>Tidak ada catatan yang ditemukan${
          this.currentSearch
            ? ' untuk pencarian "' + this.currentSearch + '"'
            : ''
        }.</p>
      `;
      notesList.appendChild(emptyMessage);
      return;
    }

    filteredNotes.forEach((note) => {
      const noteItem = document.createElement('note-item');

      noteItem.setAttribute('title', note.title);
      noteItem.setAttribute('date', formatDate(note.createdAt));
      noteItem.setAttribute('body', note.body);
      noteItem.setAttribute('archived', note.archived.toString());
      noteItem.setAttribute('data-id', note.id);

      const actionButtonsContainer = document.createElement('div');
      actionButtonsContainer.style.display = 'flex';
      actionButtonsContainer.style.gap = '10px';

      const archiveButton = document.createElement('button');
      archiveButton.className = 'btn-archive';
      archiveButton.textContent = note.archived ? 'Pindahkan' : 'Arsipkan';
      archiveButton.setAttribute('data-id', note.id);
      archiveButton.addEventListener('click', (event) => {
        const id = event.target.getAttribute('data-id');
        this.toggleArchiveNote(id, !note.archived);
      });

      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn-delete';
      deleteButton.textContent = 'Hapus';
      deleteButton.setAttribute('data-id', note.id);
      deleteButton.addEventListener('click', (event) => {
        const id = event.target.getAttribute('data-id');
        this.deleteNote(id);
      });

      actionButtonsContainer.appendChild(archiveButton);
      actionButtonsContainer.appendChild(deleteButton);

      noteItem.appendChild(actionButtonsContainer);
      notesList.appendChild(noteItem);
    });
  }

  async addNote(title, body) {
    showLoading();
    try {
      const newNote = await NotesAPI.createNote(title, body);
      this.activeNotes.unshift(newNote);
      this.renderNotes();

      showToast('Catatan berhasil ditambahkan!');

      if (this.activeTab !== 'active') {
        this.switchTab('active');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      showToast('Gagal menambahkan catatan. Silakan coba lagi.', 'error');
    } finally {
      hideLoading();
    }
  }

  async deleteNote(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus catatan ini?')) {
      return;
    }

    showLoading();
    try {
      await NotesAPI.deleteNote(id);

      this.activeNotes = this.activeNotes.filter((note) => note.id !== id);
      this.archivedNotes = this.archivedNotes.filter((note) => note.id !== id);

      this.renderNotes();
      showToast('Catatan berhasil dihapus!');
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Gagal menghapus catatan. Silakan coba lagi.', 'error');
    } finally {
      hideLoading();
    }
  }

  async toggleArchiveNote(id, shouldArchive) {
    showLoading();
    try {
      if (shouldArchive) {
        await NotesAPI.archiveNote(id);
      } else {
        await NotesAPI.unarchiveNote(id);
      }

      if (shouldArchive) {
        const noteIndex = this.activeNotes.findIndex((note) => note.id === id);
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
      showToast(
        shouldArchive
          ? 'Catatan berhasil diarsipkan!'
          : 'Catatan berhasil dipindahkan!'
      );
    } catch (error) {
      console.error('Error toggling archive:', error);
      showToast('Gagal mengubah status arsip. Silakan coba lagi.', 'error');
    } finally {
      hideLoading();
    }
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    document.querySelectorAll('.tab').forEach((tab) => {
      tab.classList.remove('active');
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      }
    });

    this.renderNotes();
  }

  searchNotes(query) {
    this.currentSearch = query;
    this.renderNotes();
  }

  setupEventListeners() {
    document.addEventListener('note-submit', (event) => {
      const { title, body } = event.detail;
      this.addNote(title, body);
    });

    const searchInput = document.getElementById('search-notes');
    const debouncedSearch = debounce((query) => {
      this.searchNotes(query);
    }, 300);

    searchInput.addEventListener('input', (event) => {
      debouncedSearch(event.target.value);
    });

    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', (event) => {
        const tabName = event.target.getAttribute('data-tab');
        this.switchTab(tabName);
      });
    });

    window.addEventListener('load', () => {
      setTimeout(() => {
        hideLoading();
      }, 500);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new NotesApp();
});

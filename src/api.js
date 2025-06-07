const API_BASE_URL = 'https://notes-api.dicoding.dev/v2';

class NotesAPI {
  static async getAllNotes() {
    console.log('🔄 API: Fetching all active notes...');
    console.log('📡 URL:', `${API_BASE_URL}/notes`);

    try {
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 API Response Status:', response.status);
      console.log('📊 API Response OK:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Response Data:', data);

      if (data.status === 'success') {
        const notes = data.data || [];
        console.log(`✅ Successfully fetched ${notes.length} active notes`);
        console.log('📝 Notes preview:', notes.slice(0, 2));
        return notes;
      } else {
        console.warn('⚠️ API returned non-success status:', data.status);
        throw new Error(data.message || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('❌ Error in getAllNotes:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          'Tidak dapat terhubung ke server. Periksa koneksi internet.'
        );
      }

      throw new Error('Gagal mengambil catatan aktif dari server');
    }
  }

  static async getArchivedNotes() {
    console.log('🔄 API: Fetching archived notes...');
    console.log('📡 URL:', `${API_BASE_URL}/notes/archived`);

    try {
      const response = await fetch(`${API_BASE_URL}/notes/archived`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 API Response Status:', response.status);
      console.log('📊 API Response OK:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Response Data:', data);

      if (data.status === 'success') {
        const notes = data.data || [];
        console.log(`✅ Successfully fetched ${notes.length} archived notes`);
        console.log('📝 Notes preview:', notes.slice(0, 2));
        return notes;
      } else {
        console.warn('⚠️ API returned non-success status:', data.status);
        throw new Error(data.message || 'Failed to fetch archived notes');
      }
    } catch (error) {
      console.error('❌ Error in getArchivedNotes:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          'Tidak dapat terhubung ke server. Periksa koneksi internet.'
        );
      }

      throw new Error('Gagal mengambil catatan arsip dari server');
    }
  }

  static async createNote(title, body) {
    console.log('🔄 API: Creating new note...');
    console.log('📡 URL:', `${API_BASE_URL}/notes`);
    console.log('📝 Data:', { title, body });

    try {
      if (!title || !body) {
        throw new Error('Title and body are required');
      }

      const requestBody = {
        title: title.trim(),
        body: body.trim(),
      };

      console.log('📤 Request body:', requestBody);

      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📊 API Response Status:', response.status);
      console.log('📊 API Response OK:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Response Data:', data);

      if (data.status === 'success') {
        console.log('✅ Note created successfully:', data.data);
        return data.data;
      } else {
        console.warn('⚠️ API returned non-success status:', data.status);
        throw new Error(data.message || 'Failed to create note');
      }
    } catch (error) {
      console.error('❌ Error in createNote:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          'Tidak dapat terhubung ke server. Periksa koneksi internet.'
        );
      }

      throw new Error('Gagal membuat catatan baru');
    }
  }

  static async deleteNote(noteId) {
    console.log('🔄 API: Deleting note...');
    console.log('📡 URL:', `${API_BASE_URL}/notes/${noteId}`);
    console.log('🗑️ Note ID:', noteId);

    try {
      if (!noteId) {
        throw new Error('Note ID is required');
      }

      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 API Response Status:', response.status);
      console.log('📊 API Response OK:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Response Data:', data);

      if (data.status === 'success') {
        console.log('✅ Note deleted successfully');
        return true;
      } else {
        console.warn('⚠️ API returned non-success status:', data.status);
        throw new Error(data.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('❌ Error in deleteNote:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          'Tidak dapat terhubung ke server. Periksa koneksi internet.'
        );
      }

      throw new Error('Gagal menghapus catatan');
    }
  }

  static async archiveNote(noteId) {
    console.log('🔄 API: Archiving note...');
    console.log('📡 URL:', `${API_BASE_URL}/notes/${noteId}/archive`);
    console.log('📥 Note ID:', noteId);

    try {
      if (!noteId) {
        throw new Error('Note ID is required');
      }

      const response = await fetch(`${API_BASE_URL}/notes/${noteId}/archive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📊 API Response Status:', response.status);
      console.log('📊 API Response OK:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Response Data:', data);

      if (data.status === 'success') {
        console.log('✅ Note archived successfully');
        return true;
      } else {
        console.warn('⚠️ API returned non-success status:', data.status);
        throw new Error(data.message || 'Failed to archive note');
      }
    } catch (error) {
      console.error('❌ Error in archiveNote:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          'Tidak dapat terhubung ke server. Periksa koneksi internet.'
        );
      }

      throw new Error('Gagal mengarsipkan catatan');
    }
  }

  static async unarchiveNote(noteId) {
    console.log('🔄 API: Unarchiving note...');
    console.log('📡 URL:', `${API_BASE_URL}/notes/${noteId}/unarchive`);
    console.log('📤 Note ID:', noteId);

    try {
      if (!noteId) {
        throw new Error('Note ID is required');
      }

      const response = await fetch(
        `${API_BASE_URL}/notes/${noteId}/unarchive`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📊 API Response Status:', response.status);
      console.log('📊 API Response OK:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📦 API Response Data:', data);

      if (data.status === 'success') {
        console.log('✅ Note unarchived successfully');
        return true;
      } else {
        console.warn('⚠️ API returned non-success status:', data.status);
        throw new Error(data.message || 'Failed to unarchive note');
      }
    } catch (error) {
      console.error('❌ Error in unarchiveNote:', error);
      console.error('🔍 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(
          'Tidak dapat terhubung ke server. Periksa koneksi internet.'
        );
      }

      throw new Error('Gagal memindahkan catatan dari arsip');
    }
  }

  static async testConnection() {
    console.log('🔄 API: Testing connection...');
    try {
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('🌐 Connection test result:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText,
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}

console.log('📦 NotesAPI loaded successfully');
console.log('🌐 API Base URL:', API_BASE_URL);

export default NotesAPI;

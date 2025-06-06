const API_BASE_URL = 'https://notes-api.dicoding.dev/v2';

class NotesAPI {
  static async getAllNotes() {
    try {
      const response = await fetch(`${API_BASE_URL}/notes`);
      const data = await response.json();

      if (data.status === 'success') {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch notes');
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
      throw error;
    }
  }

  static async getArchivedNotes() {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/archived`);
      const data = await response.json();

      if (data.status === 'success') {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch archived notes');
      }
    } catch (error) {
      console.error('Error fetching archived notes:', error);
      throw error;
    }
  }

  static async createNote(title, body) {
    try {
      const response = await fetch(`${API_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          body,
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to create note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  }

  static async deleteNote(noteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.status === 'success') {
        return true;
      } else {
        throw new Error(data.message || 'Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  }

  static async archiveNote(noteId) {
    try {
      const response = await fetch(`${API_BASE_URL}/notes/${noteId}/archive`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.status === 'success') {
        return true;
      } else {
        throw new Error(data.message || 'Failed to archive note');
      }
    } catch (error) {
      console.error('Error archiving note:', error);
      throw error;
    }
  }

  static async unarchiveNote(noteId) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/notes/${noteId}/unarchive`,
        {
          method: 'POST',
        }
      );

      const data = await response.json();

      if (data.status === 'success') {
        return true;
      } else {
        throw new Error(data.message || 'Failed to unarchive note');
      }
    } catch (error) {
      console.error('Error unarchiving note:', error);
      throw error;
    }
  }
}

export default NotesAPI;

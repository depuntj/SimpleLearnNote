class AppBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .app-bar {
          display: flex;
          align-items: center;
          padding: 1rem;
          background-color: #4a6fa5;
          color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }
        
        .app-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }
      </style>
      
      <div class="app-bar">
        <h1><slot name="title">Aplikasi Catatan</slot></h1>
      </div>
    `;
  }
}

customElements.define('app-bar', AppBar);

class NoteItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['title', 'date', 'body', 'archived'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const title = this.getAttribute('title') || '';
    const date = this.getAttribute('date') || '';
    const body = this.getAttribute('body') || '';
    const archived = this.getAttribute('archived') === 'true';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .note-card {
          background-color: white;
          color: #333;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          height: 100%;
          position: relative;
          overflow: hidden;
        }
        
        .note-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #4a6fa5, #5a7fb5);
        }
        
        .note-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .note-title {
          font-size: 1.2rem;
          margin-bottom: 10px;
          color: #4a6fa5;
          margin-top: 5px;
        }
        
        .note-date {
          font-size: 0.8rem;
          color: #777;
          margin-bottom: 10px;
        }
        
        .note-body {
          color: #444;
          white-space: pre-line;
          margin-bottom: 15px;
          line-height: 1.5;
        }
        
        .note-actions {
          margin-top: auto;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
      </style>
      
      <div class="note-card">
        <h3 class="note-title">${title}</h3>
        <p class="note-date">${date}</p>
        <p class="note-body">${body}</p>
        <div class="note-actions">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('note-item', NoteItem);

class NoteForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector('form');
    const titleInput = this.shadowRoot.querySelector('#title');
    const bodyInput = this.shadowRoot.querySelector('#body');
    const charCounter = this.shadowRoot.querySelector('.char-counter');
    const submitButton = this.shadowRoot.querySelector('button[type="submit"]');

    titleInput.addEventListener('input', () => {
      this.validateTitle(titleInput);
      const length = titleInput.value.length;
      charCounter.textContent = `${length}/50`;
    });

    bodyInput.addEventListener('input', () => this.validateBody(bodyInput));

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();

      if (this.validateTitle(titleInput) && this.validateBody(bodyInput)) {
        submitButton.disabled = true;
        submitButton.textContent = 'Menyimpan...';

        const submitEvent = new CustomEvent('note-submit', {
          detail: { title, body },
          bubbles: true,
          composed: true,
        });

        this.dispatchEvent(submitEvent);

        setTimeout(() => {
          titleInput.value = '';
          bodyInput.value = '';
          titleInput.focus();
          charCounter.textContent = '0/50';
          submitButton.disabled = false;
          submitButton.textContent = 'Simpan Catatan';

          this.resetValidation(titleInput);
          this.resetValidation(bodyInput);
        }, 1000);
      }
    });
  }

  validateTitle(input) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;

    if (value === '') {
      errorElement.textContent = 'Judul catatan tidak boleh kosong';
      input.classList.add('invalid');
      return false;
    } else if (value.length < 3) {
      errorElement.textContent = 'Judul catatan minimal 3 karakter';
      input.classList.add('invalid');
      return false;
    } else if (value.length > 50) {
      errorElement.textContent = 'Judul catatan maksimal 50 karakter';
      input.classList.add('invalid');
      return false;
    } else {
      errorElement.textContent = '';
      input.classList.remove('invalid');
      return true;
    }
  }

  validateBody(input) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;

    if (value === '') {
      errorElement.textContent = 'Isi catatan tidak boleh kosong';
      input.classList.add('invalid');
      return false;
    } else {
      errorElement.textContent = '';
      input.classList.remove('invalid');
      return true;
    }
  }

  resetValidation(input) {
    const errorElement = input.nextElementSibling;
    errorElement.textContent = '';
    input.classList.remove('invalid');
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .form-container {
          background-color: white;
          border-radius: 8px;
          padding: 25px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          color: #333;
          position: relative;
          overflow: hidden;
        }
        
        .form-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #4a6fa5, #5a7fb5);
        }
        
        h2 {
          margin-top: 5px;
          margin-bottom: 20px;
          color: #4a6fa5;
        }
        
        .form-group {
          margin-bottom: 20px;
          position: relative;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #4a6fa5;
        }
        
        input, textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          background-color: white;
          color: #333;
          transition: border-color 0.3s, box-shadow 0.3s;
        }
        
        input:focus, textarea:focus {
          border-color: #4a6fa5;
          outline: none;
          box-shadow: 0 0 0 2px rgba(74, 111, 165, 0.2);
        }
        
        input.invalid, textarea.invalid {
          border-color: #e53e3e;
        }
        
        .error-message {
          color: #e53e3e;
          font-size: 0.85rem;
          margin-top: 5px;
          min-height: 1.2em;
        }
        
        .char-counter {
          position: absolute;
          right: 0;
          top: 0;
          font-size: 0.8rem;
          color: #777;
        }
        
        button {
          background-color: #4a6fa5;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          transition: background-color 0.3s;
          position: relative;
          overflow: hidden;
        }
        
        button:hover:not(:disabled) {
          background-color: #3a5a84;
        }
        
        button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
      </style>
      
      <div class="form-container">
        <h2>Tambah Catatan Baru</h2>
        <form id="note-form">
          <div class="form-group">
            <label for="title">Judul Catatan</label>
            <span class="char-counter">0/50</span>
            <input 
              type="text" 
              id="title" 
              name="title" 
              placeholder="Masukkan judul catatan..." 
              maxlength="50"
            >
            <p class="error-message"></p>
          </div>
          
          <div class="form-group">
            <label for="body">Isi Catatan</label>
            <textarea 
              id="body" 
              name="body" 
              placeholder="Masukkan isi catatan..." 
              rows="5"
            ></textarea>
            <p class="error-message"></p>
          </div>
          
          <button type="submit">Simpan Catatan</button>
        </form>
      </div>
    `;
  }
}

customElements.define('note-form', NoteForm);

export { AppBar, NoteItem, NoteForm };

class AppBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['title', 'subtitle'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const title = this.getAttribute('title') || 'Aplikasi Catatan';
    const subtitle = this.getAttribute('subtitle') || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        .app-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.95);
          color: #2d3748;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
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
          background: linear-gradient(90deg, transparent, rgba(102, 126, 234, 0.08), transparent);
          animation: shimmer 4s infinite;
          pointer-events: none;
        }
        
        @keyframes shimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .app-bar::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 12px 12px 0 0;
        }
        
        .title-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .icon {
          font-size: 1.3rem;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        h1 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea, #764ba2);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1.2;
        }
        
        .subtitle {
          font-size: 0.9rem;
          color: #718096;
          margin-top: 2px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 20px;
          font-size: 0.8rem;
          color: #667eea;
          font-weight: 600;
        }
        
        .status-dot {
          width: 8px;
          height: 8px;
          background: #48bb78;
          border-radius: 50%;
          animation: blink 2s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        
        @media (max-width: 768px) {
          .app-bar {
            padding: 16px 20px;
          }
          
          h1 {
            font-size: 1.3rem;
          }
          
          .icon {
            font-size: 1.2rem;
          }
          
          .status-indicator {
            padding: 4px 8px;
            font-size: 0.75rem;
          }
        }
      </style>
      
      <div class="app-bar">
        <div class="title-section">
          <span class="icon">📝</span>
          <div>
            <h1><slot name="title">${title}</slot></h1>
            ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
          </div>
        </div>
        <div class="status-indicator">
          <div class="status-dot"></div>
          <span>Online</span>
        </div>
      </div>
    `;
  }
}

class NoteItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['title', 'date', 'body', 'archived', 'note-id'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get noteId() {
    return this.getAttribute('note-id');
  }

  set noteId(value) {
    this.setAttribute('note-id', value);
  }

  get isArchived() {
    return this.getAttribute('archived') === 'true';
  }

  set isArchived(value) {
    this.setAttribute('archived', value.toString());
  }

  render() {
    const title = this.getAttribute('title') || 'Tanpa Judul';
    const date = this.getAttribute('date') || '';
    const body = this.getAttribute('body') || '';
    const archived = this.getAttribute('archived') === 'true';
    const noteId = this.getAttribute('note-id') || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }
        
        .note-card {
          background: white;
          color: #2d3748;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          padding: 20px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          display: grid;
          grid-template-rows: auto auto 1fr auto;
          height: 100%;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.04);
          cursor: pointer;
        }
        
        .note-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 12px 12px 0 0;
        }
        
        .note-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          border-color: rgba(102, 126, 234, 0.1);
        }
        
        .note-card:active {
          transform: translateY(-1px);
        }
        
        .note-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .note-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #2d3748;
          line-height: 1.3;
          word-wrap: break-word;
          overflow-wrap: break-word;
          margin: 0;
          flex: 1;
          margin-right: 8px;
        }
        
        .status-badge {
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          flex-shrink: 0;
        }

        .status-badge.active {
          background: #c6f6d5;
          color: #276749;
        }

        .status-badge.archived {
          background: #fed7d7;
          color: #c53030;
        }
        
        .note-date {
          font-size: 0.8rem;
          color: #718096;
          margin-bottom: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .note-date::before {
          content: '🕐';
          font-size: 0.8rem;
        }
        
        .note-body {
          color: #4a5568;
          white-space: pre-line;
          margin-bottom: 16px;
          line-height: 1.5;
          font-size: 0.9rem;
          flex-grow: 1;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-height: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 5;
          -webkit-box-orient: vertical;
        }
        
        .note-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid #e2e8f0;
          margin-top: auto;
        }

        ::slotted(button) {
          transition: all 0.2s ease;
        }

        ::slotted(button:hover) {
          transform: translateY(-1px);
        }
        
        @media (max-width: 768px) {
          .note-card {
            padding: 16px;
          }
          
          .note-title {
            font-size: 1rem;
          }
          
          .note-body {
            font-size: 0.85rem;
            max-height: 100px;
            -webkit-line-clamp: 4;
          }
          
          .note-actions {
            gap: 6px;
          }
          
          .status-badge {
            padding: 2px 6px;
            font-size: 0.65rem;
          }
        }
      </style>
      
      <div class="note-card" data-note-id="${noteId}">
        <div class="note-header">
          <h3 class="note-title">${title}</h3>
          <div class="status-badge ${archived ? 'archived' : 'active'}">
            ${archived ? 'Arsip' : 'Aktif'}
          </div>
        </div>
        <p class="note-date">${date}</p>
        <p class="note-body">${body}</p>
        <div class="note-actions">
          <slot></slot>
        </div>
      </div>
    `;
  }
}

class NoteForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['max-title-length', 'placeholder-title', 'placeholder-body'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
      this.setupEventListeners();
    }
  }

  get maxTitleLength() {
    return parseInt(this.getAttribute('max-title-length')) || 50;
  }

  set maxTitleLength(value) {
    this.setAttribute('max-title-length', value.toString());
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector('form');
    const titleInput = this.shadowRoot.querySelector('#title');
    const bodyInput = this.shadowRoot.querySelector('#body');
    const charCounter = this.shadowRoot.querySelector('.char-counter');
    const submitButton = this.shadowRoot.querySelector('button[type="submit"]');

    if (!form || !titleInput || !bodyInput) return;

    let titleTimeout, bodyTimeout;

    titleInput.addEventListener('input', () => {
      clearTimeout(titleTimeout);
      titleTimeout = setTimeout(() => {
        this.validateTitle(titleInput);
        this.updateCharCounter(titleInput, charCounter);
      }, 150);
    });

    bodyInput.addEventListener('input', () => {
      clearTimeout(bodyTimeout);
      bodyTimeout = setTimeout(() => this.validateBody(bodyInput), 150);
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();

      if (this.validateTitle(titleInput) && this.validateBody(bodyInput)) {
        submitButton.disabled = true;
        submitButton.innerHTML = `
          <span class="spinner"></span>
          Menyimpan...
        `;

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
          this.updateCharCounter(titleInput, charCounter);
          submitButton.disabled = false;
          submitButton.innerHTML = '✨ Simpan Catatan';

          this.resetValidation(titleInput);
          this.resetValidation(bodyInput);
        }, 800);
      }
    });
  }

  updateCharCounter(input, counter) {
    if (!counter) return;

    const length = input.value.length;
    const maxLength = this.maxTitleLength;
    counter.textContent = `${length}/${maxLength}`;

    if (length > maxLength * 0.8) {
      counter.style.color = '#f56565';
    } else if (length > maxLength * 0.6) {
      counter.style.color = '#ed8936';
    } else {
      counter.style.color = '#718096';
    }
  }

  validateTitle(input) {
    const value = input.value.trim();
    const errorElement = input.parentElement.querySelector('.error-message');
    const maxLength = this.maxTitleLength;

    if (value === '') {
      errorElement.textContent = '⚠️ Judul catatan tidak boleh kosong';
      input.classList.add('invalid');
      return false;
    } else if (value.length < 3) {
      errorElement.textContent = '⚠️ Judul catatan minimal 3 karakter';
      input.classList.add('invalid');
      return false;
    } else if (value.length > maxLength) {
      errorElement.textContent = `⚠️ Judul catatan maksimal ${maxLength} karakter`;
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
    const errorElement = input.parentElement.querySelector('.error-message');

    if (value === '') {
      errorElement.textContent = '⚠️ Isi catatan tidak boleh kosong';
      input.classList.add('invalid');
      return false;
    } else {
      errorElement.textContent = '';
      input.classList.remove('invalid');
      return true;
    }
  }

  resetValidation(input) {
    const errorElement = input.parentElement.querySelector('.error-message');
    errorElement.textContent = '';
    input.classList.remove('invalid');
  }

  render() {
    const maxTitleLength = this.maxTitleLength;
    const placeholderTitle =
      this.getAttribute('placeholder-title') ||
      'Masukkan judul catatan yang menarik...';
    const placeholderBody =
      this.getAttribute('placeholder-body') ||
      'Tulis isi catatan Anda di sini...';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        .form-container {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #2d3748;
          position: relative;
        }
        
        .form-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 12px 12px 0 0;
        }
        
        h2 {
          margin-top: 6px;
          margin-bottom: 20px;
          font-size: 1.3rem;
          font-weight: 700;
          color: #2d3748;
          display: flex;
          align-items: center;
          gap: 8px;
          line-height: 1.2;
        }

        h2::before {
          content: '✍️';
          font-size: 1.1rem;
        }
        
        .form-group {
          margin-bottom: 20px;
          position: relative;
        }
        
        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 600;
          color: #4a5568;
          font-size: 0.9rem;
        }
        
        input, textarea {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          background: white;
          color: #2d3748;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: inherit;
          box-sizing: border-box;
        }
        
        input:focus, textarea:focus {
          border-color: #667eea;
          outline: none;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }
        
        input.invalid, textarea.invalid {
          border-color: #f56565;
          box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1);
        }

        input::placeholder, textarea::placeholder {
          color: #a0aec0;
        }
        
        textarea {
          resize: vertical;
          min-height: 100px;
          max-height: 200px;
        }
        
        .error-message {
          color: #f56565;
          font-size: 0.8rem;
          margin-top: 6px;
          min-height: 1em;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 3px;
        }
        
        .char-counter {
          position: absolute;
          right: 0;
          top: 0;
          font-size: 0.75rem;
          color: #718096;
          font-weight: 600;
          padding: 2px 6px;
          background: #f7fafc;
          border-radius: 6px;
          transition: color 0.2s ease;
        }
        
        button {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }
        
        button:disabled {
          background: #cbd5e0;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .form-container {
            padding: 20px;
          }
          
          h2 {
            font-size: 1.2rem;
            margin-bottom: 16px;
          }
          
          input, textarea {
            padding: 10px 14px;
            font-size: 0.85rem;
          }
          
          button {
            padding: 10px 20px;
            font-size: 0.85rem;
          }
          
          .char-counter {
            font-size: 0.7rem;
          }
        }
      </style>
      
      <div class="form-container">
        <h2>Tambah Catatan Baru</h2>
        <form id="note-form">
          <div class="form-group">
            <label for="title">Judul Catatan</label>
            <span class="char-counter">0/${maxTitleLength}</span>
            <input 
              type="text" 
              id="title" 
              name="title" 
              placeholder="${placeholderTitle}" 
              maxlength="${maxTitleLength}"
              autocomplete="off"
              required
            >
            <p class="error-message"></p>
          </div>
          
          <div class="form-group">
            <label for="body">Isi Catatan</label>
            <textarea 
              id="body" 
              name="body" 
              placeholder="${placeholderBody}" 
              rows="5"
              required
            ></textarea>
            <p class="error-message"></p>
          </div>
          
          <button type="submit">✨ Simpan Catatan</button>
        </form>
      </div>
    `;
  }
}

if (!customElements.get('app-bar')) {
  customElements.define('app-bar', AppBar);
}

if (!customElements.get('note-item')) {
  customElements.define('note-item', NoteItem);
}

if (!customElements.get('note-form')) {
  customElements.define('note-form', NoteForm);
}

const notesData = [
  {
    id: "notes-jT-jjsyz61J8XKiI",
    title: "Welcome to Notes, Dimas!",
    body: "Welcome to Notes! This is your first note. You can archive it, delete it, or create new ones.",
    createdAt: "2022-07-28T10:03:12.594Z",
    archived: false,
  },
  {
    id: "notes-aB-cdefg12345",
    title: "Meeting Agenda",
    body: "Discuss project updates and assign tasks for the upcoming week.",
    createdAt: "2022-08-05T15:30:00.000Z",
    archived: false,
  },
  {
    id: "notes-XyZ-789012345",
    title: "Shopping List",
    body: "Milk, eggs, bread, fruits, and vegetables.",
    createdAt: "2022-08-10T08:45:23.120Z",
    archived: false,
  },
  {
    id: "notes-1a-2b3c4d5e6f",
    title: "Personal Goals",
    body: "Read two books per month, exercise three times a week, learn a new language.",
    createdAt: "2022-08-15T18:12:55.789Z",
    archived: false,
  },
  {
    id: "notes-LMN-456789",
    title: "Recipe: Spaghetti Bolognese",
    body: "Ingredients: ground beef, tomatoes, onions, garlic, pasta. Steps:...",
    createdAt: "2022-08-20T12:30:40.200Z",
    archived: false,
  },
  {
    id: "notes-QwErTyUiOp",
    title: "Workout Routine",
    body: "Monday: Cardio, Tuesday: Upper body, Wednesday: Rest, Thursday: Lower body, Friday: Cardio.",
    createdAt: "2022-08-25T09:15:17.890Z",
    archived: false,
  },
  {
    id: "notes-abcdef-987654",
    title: "Book Recommendations",
    body: "1. 'The Alchemist' by Paulo Coelho\n2. '1984' by George Orwell\n3. 'To Kill a Mockingbird' by Harper Lee",
    createdAt: "2022-09-01T14:20:05.321Z",
    archived: false,
  },
  {
    id: "notes-zyxwv-54321",
    title: "Daily Reflections",
    body: "Write down three positive things that happened today and one thing to improve tomorrow.",
    createdAt: "2022-09-07T20:40:30.150Z",
    archived: false,
  },
  {
    id: "notes-poiuyt-987654",
    title: "Travel Bucket List",
    body: "1. Paris, France\n2. Kyoto, Japan\n3. Santorini, Greece\n4. New York City, USA",
    createdAt: "2022-09-15T11:55:44.678Z",
    archived: false,
  },
  {
    id: "notes-asdfgh-123456",
    title: "Coding Projects",
    body: "1. Build a personal website\n2. Create a mobile app\n3. Contribute to an open-source project",
    createdAt: "2022-09-20T17:10:12.987Z",
    archived: false,
  },
  {
    id: "notes-5678-abcd-efgh",
    title: "Project Deadline",
    body: "Complete project tasks by the deadline on October 1st.",
    createdAt: "2022-09-28T14:00:00.000Z",
    archived: false,
  },
  {
    id: "notes-9876-wxyz-1234",
    title: "Health Checkup",
    body: "Schedule a routine health checkup with the doctor.",
    createdAt: "2022-10-05T09:30:45.600Z",
    archived: false,
  },
  {
    id: "notes-qwerty-8765-4321",
    title: "Financial Goals",
    body: "1. Create a monthly budget\n2. Save 20% of income\n3. Invest in a retirement fund.",
    createdAt: "2022-10-12T12:15:30.890Z",
    archived: false,
  },
  {
    id: "notes-98765-54321-12345",
    title: "Holiday Plans",
    body: "Research and plan for the upcoming holiday destination.",
    createdAt: "2022-10-20T16:45:00.000Z",
    archived: false,
  },
  {
    id: "notes-1234-abcd-5678",
    title: "Language Learning",
    body: "Practice Spanish vocabulary for 30 minutes every day.",
    createdAt: "2022-10-28T08:00:20.120Z",
    archived: false,
  },
];

class AppBar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
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

customElements.define("app-bar", AppBar);

class NoteItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  static get observedAttributes() {
    return ["title", "date", "body", "archived"];
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
    const title = this.getAttribute("title") || "";
    const date = this.getAttribute("date") || "";
    const body = this.getAttribute("body") || "";
    const archived = this.getAttribute("archived") === "true";

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
        }
        
        .note-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .note-title {
          font-size: 1.2rem;
          margin-bottom: 10px;
          color: #4a6fa5;
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

customElements.define("note-item", NoteItem);

class NoteForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector("form");
    const titleInput = this.shadowRoot.querySelector("#title");
    const bodyInput = this.shadowRoot.querySelector("#body");
    const charCounter = this.shadowRoot.querySelector(".char-counter");

    titleInput.addEventListener("input", () => {
      this.validateTitle(titleInput);
      const length = titleInput.value.length;
      charCounter.textContent = `${length}/50`;
    });

    bodyInput.addEventListener("input", () => this.validateBody(bodyInput));

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const title = titleInput.value.trim();
      const body = bodyInput.value.trim();

      if (this.validateTitle(titleInput) && this.validateBody(bodyInput)) {
        const submitEvent = new CustomEvent("note-submit", {
          detail: { title, body },
          bubbles: true,
          composed: true,
        });

        this.dispatchEvent(submitEvent);

        titleInput.value = "";
        bodyInput.value = "";
        titleInput.focus();
        charCounter.textContent = "0/50";

        this.resetValidation(titleInput);
        this.resetValidation(bodyInput);
      }
    });
  }

  validateTitle(input) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;

    if (value === "") {
      errorElement.textContent = "Judul catatan tidak boleh kosong";
      input.classList.add("invalid");
      return false;
    } else if (value.length < 3) {
      errorElement.textContent = "Judul catatan minimal 3 karakter";
      input.classList.add("invalid");
      return false;
    } else if (value.length > 50) {
      errorElement.textContent = "Judul catatan maksimal 50 karakter";
      input.classList.add("invalid");
      return false;
    } else {
      errorElement.textContent = "";
      input.classList.remove("invalid");
      return true;
    }
  }

  validateBody(input) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;

    if (value === "") {
      errorElement.textContent = "Isi catatan tidak boleh kosong";
      input.classList.add("invalid");
      return false;
    } else {
      errorElement.textContent = "";
      input.classList.remove("invalid");
      return true;
    }
  }

  resetValidation(input) {
    const errorElement = input.nextElementSibling;
    errorElement.textContent = "";
    input.classList.remove("invalid");
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
        }
        
        h2 {
          margin-top: 0;
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
        }
        
        button:hover {
          background-color: #3a5a84;
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

customElements.define("note-form", NoteForm);

window.notesData = notesData;

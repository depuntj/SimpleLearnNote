function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("id-ID", options);
}

function generateId() {
  return "notes-" + Math.random().toString(36).substring(2, 9);
}

let activeTab = "active";

function renderNotes(filter = "", tabState = activeTab) {
  const notesList = document.getElementById("notes-list");
  notesList.innerHTML = "";

  const filteredNotes = window.notesData.filter((note) => {
    const matchesTab = tabState === "active" ? !note.archived : note.archived;
    const matchesSearch =
      filter === "" ||
      note.title.toLowerCase().includes(filter.toLowerCase()) ||
      note.body.toLowerCase().includes(filter.toLowerCase());

    return matchesTab && matchesSearch;
  });

  if (filteredNotes.length === 0) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-message";
    emptyMessage.innerHTML = `
      <p>Tidak ada catatan yang ditemukan${
        filter ? ' untuk pencarian "' + filter + '"' : ""
      }.</p>
    `;
    notesList.appendChild(emptyMessage);
    return;
  }

  filteredNotes.forEach((note) => {
    const noteItem = document.createElement("note-item");

    noteItem.setAttribute("title", note.title);
    noteItem.setAttribute("date", formatDate(note.createdAt));
    noteItem.setAttribute("body", note.body);
    noteItem.setAttribute("archived", note.archived.toString());
    noteItem.setAttribute("data-id", note.id);

    const actionButtonsContainer = document.createElement("div");
    actionButtonsContainer.style.display = "flex";
    actionButtonsContainer.style.gap = "10px";

    const archiveButton = document.createElement("button");
    archiveButton.className = "btn-archive";
    archiveButton.textContent = note.archived ? "Pindahkan" : "Arsipkan";
    archiveButton.setAttribute("data-id", note.id);
    archiveButton.addEventListener("click", (event) => {
      const id = event.target.getAttribute("data-id");
      toggleArchiveNote(id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.className = "btn-delete";
    deleteButton.textContent = "Hapus";
    deleteButton.setAttribute("data-id", note.id);
    deleteButton.addEventListener("click", (event) => {
      const id = event.target.getAttribute("data-id");
      deleteNote(id);
    });

    actionButtonsContainer.appendChild(archiveButton);
    actionButtonsContainer.appendChild(deleteButton);

    noteItem.appendChild(actionButtonsContainer);
    notesList.appendChild(noteItem);
  });
}

function addNote(title, body) {
  const newNote = {
    id: generateId(),
    title: title,
    body: body,
    createdAt: new Date().toISOString(),
    archived: false,
  };

  window.notesData.unshift(newNote);
  renderNotes(document.getElementById("search-notes").value);

  return newNote;
}

function deleteNote(id) {
  const noteIndex = window.notesData.findIndex((note) => note.id === id);

  if (noteIndex !== -1) {
    if (confirm("Apakah Anda yakin ingin menghapus catatan ini?")) {
      window.notesData.splice(noteIndex, 1);
      renderNotes(document.getElementById("search-notes").value);
    }
  }
}

function toggleArchiveNote(id) {
  const noteIndex = window.notesData.findIndex((note) => note.id === id);

  if (noteIndex !== -1) {
    window.notesData[noteIndex].archived =
      !window.notesData[noteIndex].archived;
    renderNotes(document.getElementById("search-notes").value);
  }
}

function setupEventListeners() {
  document.addEventListener("note-submit", (event) => {
    const { title, body } = event.detail;
    addNote(title, body);
  });

  const searchInput = document.getElementById("search-notes");
  searchInput.addEventListener("input", (event) => {
    renderNotes(event.target.value);
  });

  const activeTabs = document.querySelectorAll(".tab");
  activeTabs.forEach((tab) => {
    tab.addEventListener("click", (event) => {
      activeTabs.forEach((t) => t.classList.remove("active"));
      event.target.classList.add("active");

      activeTab = event.target.getAttribute("data-tab");

      renderNotes(searchInput.value, activeTab);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  renderNotes();
});

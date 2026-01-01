document.addEventListener("DOMContentLoaded", async () => {
  const authStatus = document.getElementById("auth-status");
  const navLoginBtn = document.getElementById("nav-login-btn");
  const navRegisterBtn = document.getElementById("nav-register-btn");
  const navLogoutBtn = document.getElementById("nav-logout-btn");
  const logo = document.getElementById("user-logo");
  const newDomainContainer = document.getElementById("addNewSection");

  // --- 1. AUTO-SYNC ---
  if (API.isLoggedIn()) {
    const pendingSection = localStorage.getItem("pending_section");
    const pendingUrl = localStorage.getItem("pending_url");

    if (pendingSection && pendingUrl) {
      try {
        const newDomain = await API.createSection(pendingSection);
        let name = pendingUrl;
        try {
          let rawUrl = pendingUrl;
          if (!rawUrl.match(/^https?:\/\//)) rawUrl = "https://" + rawUrl;
          const urlObj = new URL(rawUrl);
          name = urlObj.hostname.replace('www.', '').split('.')[0];
          await API.addLink(newDomain.id, rawUrl, name);
        } catch (e) {
          await API.addLink(newDomain.id, pendingUrl, "New Link");
        }
        localStorage.removeItem("pending_section");
        localStorage.removeItem("pending_url");
      } catch (err) { console.error(err); }
    }
  }

  // --- 2. UI STATE & WELCOME WINDOW ---
  if (API.isLoggedIn()) {
    logo.classList.remove("alert");
    authStatus.textContent = "Welcome back";
    navLoginBtn.style.display = "none";
    navRegisterBtn.style.display = "none";
    navLogoutBtn.style.display = "block";
    if(newDomainContainer) newDomainContainer.style.display = "block";
  } else {
    logo.classList.add("alert");
    authStatus.textContent = "Not logged in";
    if(newDomainContainer) newDomainContainer.style.display = "none";

    // NEW: Check for First Time Visitor
    const hasSeenWelcome = localStorage.getItem("blinky_welcome_shown");
    if (!hasSeenWelcome) {
      setTimeout(() => {
        openModal({
          title: "Welcome to Blinky",
          desc: "The minimalist bookmark manager designed for focus.<br><br>Organize your links into sections without the clutter. Try it out as a guest, then sign in to sync.",
          btnText: "Get Started", // Custom button text
          onConfirm: () => {
            localStorage.setItem("blinky_welcome_shown", "true");
            return true;
          }
        });
      }, 500); // Small delay for smooth entrance
    }
  }

  // --- 3. RENDER CONTENT ---
  await renderAllSections();

  // --- 4. EVENT LISTENERS ---
  navLoginBtn.addEventListener("click", () => {
    openModal({
      title: "Login",
      desc: "Enter your credentials to access your bookmarks.",
      btnText: "Login",
      inputs: [
        { type: "email", placeholder: "Email", id: "login-email" },
        { type: "password", placeholder: "Password", id: "login-pass" }
      ],
      onConfirm: async (values) => {
        try {
          await API.login(values["login-email"], values["login-pass"]);
          location.reload();
        } catch (e) {
          showError("login-email", "Invalid email or password");
          return false;
        }
      }
    });
  });

  navRegisterBtn.addEventListener("click", () => {
    openModal({
      title: "Sign Up",
      desc: "Create a minimal account. No spam, ever.",
      btnText: "Create Account",
      inputs: [
        { type: "email", placeholder: "Email Address", id: "reg-email" },
        { type: "password", placeholder: "Choose Password", id: "reg-pass" }
      ],
      onConfirm: async (values) => {
        if(values["reg-pass"].length < 4) {
          showError("reg-pass", "Password is too short");
          return false; 
        }
        try {
          await API.register(values["reg-email"], values["reg-pass"]);
          await API.login(values["reg-email"], values["reg-pass"]);
          location.reload();
        } catch (e) {
          showError("reg-email", "Email already taken or invalid");
          return false;
        }
      }
    });
  });

  navLogoutBtn.addEventListener("click", () => {
    API.clearToken();
    location.reload();
  });

  const newDomainBtn = document.getElementById("new-domain-btn");
  if(newDomainBtn) {
      newDomainBtn.addEventListener("click", () => {
        openModal({
          title: "New Section",
          desc: "Create a new category for your links.",
          inputs: [{ type: "text", placeholder: "e.g., AI Tools, Research Sites", id: "domain-name" }],
          onConfirm: async (values) => {
            if(!values["domain-name"]) return false;
            
            if (API.isLoggedIn()) {
              const newDomain = await API.createSection(values["domain-name"]);
              createSectionDOM(newDomain.title, newDomain.id);
            } else {
              renderGuestState();
            }
            return true; 
          }
        });
      });
  }
});


// --- RENDER LOGIC ---

async function renderAllSections() {
  const container = document.querySelector('.container');
  container.innerHTML = '';
  
  try {
    const sections = await API.getSections();
    if (sections.length === 0) {
      renderEmptyState();
      return;
    }
    sections.forEach(section => {
      createSectionDOM(section.title, section.id);
      if (section.links) {
        section.links.forEach(link => {
          addUrlDOM(section.id, `${section.id}List`, link.url, link.domain, link.name, link.id);
        });
      }
    });
  } catch (e) { 
    console.error("CRITICAL RENDER ERROR:", e);
    renderEmptyState();
  }
}

// --- STATE RENDERERS ---

function renderGuestState() {
  const container = document.querySelector('.container');
  const topBtn = document.getElementById("addNewSection");
  if(topBtn) topBtn.style.display = "none";
  
  const emptyState = document.querySelector(".empty-state");
  if(emptyState) emptyState.remove();

  container.innerHTML = `
    <div class="guest-state">
      <h2>⚠️ Sync is Paused</h2>
      <p>You are currently browsing as a guest.</p>
      <p style="color: var(--muted); margin-bottom: 24px; font-size: 0.9rem;">
        Any bookmarks you try to save will <b>perish</b> if you close this browser.<br>
        Please login or register to save your data permanently.
      </p>
      <div class="action-buttons">
        <button class="btn-black" id="hero-login">Login Now</button>
        <button class="btn-outline" id="hero-register">Create Account</button>
      </div>
    </div>
  `;

  document.getElementById("hero-login").onclick = () => document.getElementById("nav-login-btn").click();
  document.getElementById("hero-register").onclick = () => document.getElementById("nav-register-btn").click();
}

function renderEmptyState() {
  const container = document.querySelector('.container');
  
  // 1. Prepare Buttons HTML
  let buttonsHtml = `<button class="btn-black" id="start-btn">Create First Section</button>`;
  
  // NEW: If user is a Guest, add a Login button next to it
  if (!API.isLoggedIn()) {
    buttonsHtml += `<button class="btn-outline" id="empty-login-btn" style="margin-left: 10px;">Login</button>`;
  }

  // 2. Render UI
  container.innerHTML = `
    <div class="empty-state">
      <h2>Let's Get Organized</h2>
      <p>Start by creating a category for your links (like "Work", "Music", or "Dev").</p>
      <div class="action-buttons">
        ${buttonsHtml}
      </div>
    </div>
  `;

  // 3. Event Listeners

  // Action A: Create Section (The Guest Flow)
  document.getElementById("start-btn").addEventListener("click", () => {
    openModal({
      title: "New Section",
      desc: "Create a new category for your links.",
      inputs: [{ type: "text", placeholder: "e.g., AI Tools, Research Sites", id: "domain-name" }],
      onConfirm: async (sectionValues) => {
        const sectionName = sectionValues["domain-name"];
        if(!sectionName) return false;

        setTimeout(() => {
          openModal({
            title: "Add Bookmark",
            desc: `Add your first link to the <b>"${sectionName}"</b> section.`,
            btnText: "Add Link",
            inputs: [{ type: "text", placeholder: "google.com", id: "url-input" }],
            onConfirm: async (urlValues) => {
              const url = urlValues["url-input"];
              if(!url) return false;

              if (!API.isLoggedIn()) {
                localStorage.setItem("pending_section", sectionName);
                localStorage.setItem("pending_url", url);
                renderGuestState();
              } else {
                try {
                  const newDomain = await API.createSection(sectionName);
                  await API.addLink(newDomain.id, url, url); 
                  await renderAllSections();
                } catch(e) {
                  alert("Error saving data");
                }
              }
              return true; 
            }
          });
        }, 300);
        return true; 
      }
    });
  });

  // Action B: Login (The Returning User Flow)
  const loginBtn = document.getElementById("empty-login-btn");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      // Trigger the existing login modal logic
      document.getElementById("nav-login-btn").click();
    });
  }
}

// --- DOM CREATION ---

function createSectionDOM(title, id) {
  const container = document.querySelector(".container");
  const stateMsg = container.querySelector(".empty-state, .guest-state");
  if (stateMsg) stateMsg.remove();
  
  const topBtn = document.getElementById("addNewSection");
  if(topBtn) topBtn.style.display = "block";

  const box = document.createElement("div");
  box.className = "box";
  box.id = `domain-${id}`;

  const h3 = document.createElement("h3");
  h3.textContent = title;
  
  const addBtn = document.createElement("button");
  addBtn.textContent = "add url";
  addBtn.className = "add-url-btn"; 
  addBtn.style.marginBottom = "10px";
  
  const ul = document.createElement("ul");
  ul.id = `${id}List`;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "deleteSectionBtn";
  deleteBtn.innerHTML = "&times;";
  
  deleteBtn.addEventListener("click", () => {
    openModal({
      title: "Delete Section?",
      desc: `Are you sure you want to delete "${title}"?`,
      btnText: "Delete",
      onConfirm: async () => {
        await API.deleteSection(id);
        box.remove();
        if (container.children.length === 0) renderEmptyState();
      }
    });
  });

  box.append(h3, deleteBtn, addBtn, ul);
  container.appendChild(box);
  setupAddUrlForm(addBtn, id, ul);
}

function setupAddUrlForm(btn, domainId, listElement) {
  btn.addEventListener("click", () => {
    if (listElement.parentElement.querySelector("form")) return;

    const form = document.createElement("form");
    const input = document.createElement("input");
    input.placeholder = "google.com";
    input.style.width = "70%";
    
    const submit = document.createElement("button");
    submit.textContent = "Add";

    const msg = document.createElement("div");
    msg.style.fontSize = "0.8rem"; 
    msg.style.color = "red";
    msg.style.marginTop = "4px";

    form.append(input, submit);
    listElement.before(form);
    listElement.before(msg); 
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      let rawUrl = input.value.trim();
      if (!rawUrl) return;

      // 1. Auto-fix: Add https if missing
      if (!rawUrl.match(/^https?:\/\//)) rawUrl = "https://" + rawUrl;

      // 2. Validation: Use the browser's built-in parser (Faster & Safer)
      try {
        new URL(rawUrl); // If this fails, it jumps to catch()
      } catch (err) {
        msg.textContent = "Invalid URL";
        input.style.borderColor = "red";
        return;
      }

      try {
        const urlObj = new URL(rawUrl);
        const domain = urlObj.hostname;
        const name = domain.replace('www.', '').split('.')[0];
        
        const savedBookmark = await API.addLink(domainId, rawUrl, name);
        addUrlDOM(domainId, listElement.id, rawUrl, domain, name, savedBookmark.id);
        
        form.remove();
        msg.remove();
      } catch (err) {
        console.error(err);
        msg.textContent = "Error adding link.";
      }
    });
  });

}

function addUrlDOM(domainId, ulId, url, domain, name, bookmarkId) {
  const ul = document.getElementById(ulId);
  const li = document.createElement("li");
  const contentDiv = document.createElement("div");
  contentDiv.className = "link-content";
  
  const img = document.createElement("img");
  img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.textContent = name;
  
  contentDiv.append(img, a);

  const actionsDiv = document.createElement("div");
  actionsDiv.className = "link-actions";

  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn";
  editBtn.innerHTML = "&#9998;"; 
  
  editBtn.addEventListener("click", () => {
    if (li.querySelector("input")) return;

    const input = document.createElement("input");
    input.type = "text";
    input.value = a.textContent;
    input.className = "edit-input";
    
    a.style.display = "none";
    contentDiv.insertBefore(input, a);
    input.focus();

    const save = async () => {
      const newTitle = input.value.trim();
      if (newTitle && newTitle !== name) {
        try {
          await API.request(`/bookmarks/${bookmarkId}?new_title=${encodeURIComponent(newTitle)}`, "PUT");
          a.textContent = newTitle;
          name = newTitle; 
        } catch(e) { alert("Rename failed"); }
      }
      input.remove();
      a.style.display = "block";
    };
    input.addEventListener("keydown", (e) => { if(e.key === "Enter") save(); });
    input.addEventListener("blur", save);
  });

  const delBtn = document.createElement("button");
  delBtn.className = "icon-btn delete";
  delBtn.innerHTML = "&times;";
  delBtn.addEventListener("click", () => {
    openModal({
      title: "Remove Link?",
      desc: "This cannot be undone.",
      btnText: "Remove",
      onConfirm: async () => {
        await API.deleteLink(bookmarkId);
        li.remove();
      }
    });
  });

  actionsDiv.append(editBtn, delBtn);
  li.append(contentDiv, actionsDiv);
  ul.appendChild(li);
}

// --- UPDATED MODAL SYSTEM (with btnText support) ---
function openModal({ title, desc, inputs = [], btnText = "Confirm", onConfirm }) {
  const modal = document.getElementById("app-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalDesc = document.getElementById("modal-desc");
  const modalBody = document.getElementById("modal-body");
  const confirmBtn = document.getElementById("modal-confirm");
  const cancelBtn = document.getElementById("modal-cancel");

  modalBody.innerHTML = "";
  confirmBtn.onclick = null;
  
  modalTitle.textContent = title;
  modalDesc.innerHTML = desc; 
  confirmBtn.textContent = btnText; // NEW: Custom Button Text

  const inputRefs = {};
  inputs.forEach(opt => {
    const wrapper = document.createElement("div");
    const field = document.createElement("input");
    field.type = opt.type;
    field.placeholder = opt.placeholder;
    field.className = "modal-input";
    field.id = opt.id; 
    const err = document.createElement("div");
    err.className = "input-error-msg";
    err.id = `err-${opt.id}`;
    
    wrapper.append(field, err);
    modalBody.appendChild(wrapper);
    inputRefs[opt.id] = field;
  });

  modal.classList.add("active");

  const closeModal = () => modal.classList.remove("active");
  cancelBtn.onclick = closeModal;

  confirmBtn.onclick = async () => {
    const values = {};
    Object.keys(inputRefs).forEach(k => values[k] = inputRefs[k].value);
    const shouldClose = await onConfirm(values);
    if (shouldClose !== false) closeModal();
  };
}

function showError(inputId, msg) {
  const input = document.getElementById(inputId);
  const errDiv = document.getElementById(`err-${inputId}`);
  if(input && errDiv) {
    input.classList.add("error");
    errDiv.textContent = msg;
    errDiv.style.display = "block";
  }
}
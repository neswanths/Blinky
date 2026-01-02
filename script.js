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

    // --- HOVER TOOLTIP ---
    try {
        const user = await API.request("/users/me");
        if (user && user.email) {
            logo.title = `Logged in as: ${user.email}`;
            authStatus.textContent = "Hi, " + user.email.split('@')[0];
        }
    } catch(e) { console.warn("Could not fetch user info"); }

  } else {
    logo.classList.add("alert");
    authStatus.textContent = "Not logged in";
    if(newDomainContainer) newDomainContainer.style.display = "none";
    logo.title = "Guest Mode";

    const hasSeenWelcome = localStorage.getItem("blinky_welcome_shown");
    if (!hasSeenWelcome) {
      setTimeout(() => {
        openModal({
          title: "Welcome to Blinky",
          desc: "The minimalist bookmark manager designed for focus.<br><br>Organize your links into sections without the clutter. Try it out as a guest, then sign in to sync.",
          btnText: "Get Started",
          onConfirm: () => {
            localStorage.setItem("blinky_welcome_shown", "true");
            return true;
          }
        });
      }, 500);
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
  const isGuest = !API.isLoggedIn();

  container.innerHTML = `
    <div class="empty-state">
      <h2>Let's Get Organized</h2>
      <p>Start by creating a category for your links (like "Work", "Music", or "Dev").</p>
      
      <div class="action-buttons" style="display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%; max-width: 400px; margin: 0 auto;">
        
        <div style="display: flex; gap: 10px; width: 100%; justify-content: center; flex-wrap: wrap;">
            <button class="btn-black" id="start-btn" style="white-space: nowrap; flex: 1 1 auto; min-width: 160px;">Create First Section</button>
            ${isGuest ? `<button class="btn-outline" id="empty-login-btn" style="flex: 1 1 auto; min-width: 80px;">Login</button>` : ''}
        </div>

        ${isGuest ? `
            <button class="btn-outline" id="empty-register-btn" style="width: 100%;">
                New User? Sign Up
            </button>
        ` : ''}

      </div>
    </div>
  `;

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

              if (isGuest) {
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

  if (isGuest) {
    const loginBtn = document.getElementById("empty-login-btn");
    const regBtn = document.getElementById("empty-register-btn");

    if (loginBtn) loginBtn.onclick = () => document.getElementById("nav-login-btn").click();
    if (regBtn) regBtn.onclick = () => document.getElementById("nav-register-btn").click();
  }
}

// --- DOM CREATION (MOBILE RESPONSIVE UPDATED) ---

function createSectionDOM(title, id) {
  const container = document.querySelector(".container");
  const stateMsg = container.querySelector(".empty-state, .guest-state");
  if (stateMsg) stateMsg.remove();
  
  const topBtn = document.getElementById("addNewSection");
  if(topBtn) topBtn.style.display = "block";

  const box = document.createElement("div");
  box.className = "box";
  box.id = `domain-${id}`;

  // RESPONSIVE HEADER: flex-wrap allows title and buttons to stack on tiny screens
  const headerDiv = document.createElement("div");
  headerDiv.style.display = "flex";
  headerDiv.style.justifyContent = "space-between";
  headerDiv.style.alignItems = "center";
  headerDiv.style.marginBottom = "15px";
  headerDiv.style.flexWrap = "wrap"; // <--- RESPONSIVE FIX
  headerDiv.style.gap = "10px";      // <--- RESPONSIVE FIX

  const h3 = document.createElement("h3");
  h3.textContent = title;
  h3.style.margin = "0";
  h3.style.wordBreak = "break-word"; // Prevent long words from breaking layout

  const controlsDiv = document.createElement("div");
  controlsDiv.style.display = "flex";
  controlsDiv.style.gap = "8px";
  controlsDiv.style.marginLeft = "auto"; // Push controls to right even when wrapped

  // EDIT BUTTON
  const editBtn = document.createElement("button");
  editBtn.className = "icon-btn"; 
  editBtn.innerHTML = "&#9998;"; 
  editBtn.style.color = "#888";
  editBtn.title = "Rename Section";

  editBtn.addEventListener("click", () => {
    if (headerDiv.querySelector("input")) return;

    const input = document.createElement("input");
    input.type = "text";
    input.value = h3.textContent;
    input.className = "edit-input";
    input.style.fontSize = "1.1rem"; 
    input.style.fontWeight = "bold";
    input.style.flex = "1"; // Allow input to fill space
    input.style.minWidth = "150px"; 
    
    h3.style.display = "none";
    headerDiv.insertBefore(input, h3);
    input.focus();

    const saveRename = async () => {
        const newName = input.value.trim();
        if (newName && newName !== title) {
            try {
                await API.request(`/domains/${id}?new_name=${encodeURIComponent(newName)}`, "PUT");
                h3.textContent = newName;
                title = newName;
            } catch (e) { alert("Could not rename section"); }
        }
        input.remove();
        h3.style.display = "block";
    };

    input.addEventListener("keydown", (e) => { if(e.key === "Enter") saveRename(); });
    input.addEventListener("blur", saveRename);
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "deleteSectionBtn"; 
  deleteBtn.innerHTML = "&times;";
  deleteBtn.style.position = "static"; 
  
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

  controlsDiv.append(editBtn, deleteBtn);
  headerDiv.append(h3, controlsDiv);

  const addBtn = document.createElement("button");
  addBtn.textContent = "add url";
  addBtn.className = "add-url-btn"; 
  addBtn.style.marginBottom = "10px";
  
  const ul = document.createElement("ul");
  ul.id = `${id}List`;

  box.append(headerDiv, addBtn, ul);
  container.appendChild(box);
  setupAddUrlForm(addBtn, id, ul);
}

function setupAddUrlForm(btn, domainId, listElement) {
  btn.addEventListener("click", () => {
    if (listElement.parentElement.querySelector("form")) return;

    const form = document.createElement("form");
    // RESPONSIVE FORM: Use flexbox instead of fixed width
    form.style.display = "flex";
    form.style.gap = "8px";
    form.style.alignItems = "center";
    
    const input = document.createElement("input");
    input.placeholder = "google.com";
    input.style.flex = "1";     // <--- RESPONSIVE FIX (Takes available space)
    input.style.width = "auto"; // <--- RESPONSIVE FIX (Resets fixed width)
    input.style.minWidth = "0"; // <--- RESPONSIVE FIX (Prevents overflow)
    
    const submit = document.createElement("button");
    submit.textContent = "Add";
    submit.style.flex = "0 0 auto"; // Prevent button from squishing

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

      if (!rawUrl.match(/^https?:\/\//)) rawUrl = "https://" + rawUrl;

      try {
        new URL(rawUrl); 
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

// --- MODAL SYSTEM ---
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
  confirmBtn.textContent = btnText;

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
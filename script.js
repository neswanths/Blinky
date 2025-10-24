 async function renderAllSections(){
  const container = document.querySelector('.container');
  container.innerHTML = '';
  const sections = await getSections();
  sections.forEach((section) => {
    createSection(section.title, section.id, false, section);
    if(!section.links) section.links = [];
    section.links.forEach((link) => {
      addUrl(section.id, link.ulId, link.url, link.domain, link.name, false);
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  // --- Render Sections ---
  await renderAllSections();

  // --- Auth Elements ---
  const logo = document.getElementById("user-logo");
  const dropdown = document.getElementById("auth-dropdown");
  const googleLoginBtn = document.getElementById("google-login");
  const emailLoginBtn = document.getElementById("email-login");
  const authStatus = document.getElementById("auth-status");

  // --- Simulate Login State ---
  const isLoggedIn = window.isLoggedIn || false;
  if (!isLoggedIn) logo.classList.add("alert");
  else logo.classList.remove("alert");

  // --- Dropdown Toggle ---
  logo.addEventListener("click", () => {
    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
  });
  document.addEventListener("click", (e) => {
    if (!logo.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.style.display = "none";
    }
  });

  // --- Google Login ---
  googleLoginBtn.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      const result = await firebase.auth().signInWithPopup(provider);
      const user = result.user;
      console.log("Logged in with Google:", user);
      window.isLoggedIn = true;
      authStatus.textContent = `Logged in as ${user.displayName || user.email}`;

      logo.classList.remove("alert");
      dropdown.style.display = "none";

      if (user.photoURL) {
        logo.style.background = `url(${user.photoURL}) center/cover no-repeat`;
      }
    } catch (error) {
      console.error("Google login failed:", error);
      alert(error.message);
    }
  });

  // --- Email Login ---
  emailLoginBtn.addEventListener("click", async () => {
    const email = prompt("Enter your email:");
    const password = prompt("Enter your password:");
    if (!email || !password) return alert("Email and password required!");

    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      console.log("Logged in with email:", user);
      window.isLoggedIn = true;
      authStatus.textContent = `Logged in as ${user.email}`;

      logo.classList.remove("alert");
      dropdown.style.display = "none";

      if (user.photoURL) {
        logo.style.background = `url(${user.photoURL}) center/cover no-repeat`;
      }
    } catch (error) {
      console.error("Email login failed:", error);
      alert(error.message);
    }
  });
});


// Re-render when storage switches or data merges
window.addEventListener('store-changed', async () => {
  await renderAllSections();
});

async function getSections() {
  if(window.Store) {
    return await window.Store.getSections();
  }
  const data = localStorage.getItem("sections");
  return data ? JSON.parse(data) : [];
}
async function setSections(sections) {
  if(window.Store) {
    await window.Store.setSections(sections);
  } else {
    localStorage.setItem("sections", JSON.stringify(sections));
  }
}
function addNewSection() {
  const form = document.createElement("form");
  const blockName = document.createElement("input");
  blockName.setAttribute("placeholder", "Enter Section Name...");
  form.appendChild(blockName);
  const btn = document.createElement("button");
  btn.setAttribute("type", "submit");
  btn.textContent = "confirm";
  form.appendChild(btn);
  const div = document.getElementById("addNewSection");
  div.appendChild(form);
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const raw = blockName.value.trim();
    if (raw !== "") {
      const blockTitle = raw;
      const blockId = raw.replace(/\s+/g, "-").toLowerCase();
      await createSection(blockTitle, blockId);
      form.remove();
    } else {
      alert("Fill the field");
    }
  });
}
async function createSection(block, blockName,save = true,existingSection = null) {
  const box = document.createElement("div");
  box.setAttribute("class", "box");
  box.setAttribute("id", blockName);
  const h3 = document.createElement("h3");
  h3.appendChild(document.createTextNode(block));
  box.appendChild(h3);
  const btn = document.createElement("button");
  btn.setAttribute("type", "button");
  btn.setAttribute("id", blockName + "btn");
  btn.appendChild(document.createTextNode("Add Url"));
  box.appendChild(btn);
  const formBlock = document.createElement("div");
  formBlock.setAttribute("class", blockName + "-block");
  box.appendChild(formBlock);
  const ul = document.createElement("ul");
  ul.setAttribute("id", blockName + "List");
  ul.id = blockName+"List";
  box.appendChild(ul);
  const deleteSectionBtn = document.createElement("button");
  deleteSectionBtn.className = "deleteSectionBtn";
  deleteSectionBtn.textContent = "x";
  box.appendChild(deleteSectionBtn);
  deleteSectionBtn.addEventListener("click", async () => {
    let sections = await getSections();
    sections = sections.filter((s) => s.id !== blockName);
    await setSections(sections);
    ul.remove();
    box.remove();
  });
  const container = document.querySelector(".container");
  container.appendChild(box);
  invokeGetUrl(
    blockName,
    blockName + "btn",
    "." + blockName + "-block",
    blockName + "List"
  );
  if(save && !existingSection){
    const sections = await getSections();
    const exists = sections.find((s) => s.id === blockName);
    if(!exists){
      sections.push({
        title: blockName,
        id: blockName,
        links: [],
      });
      await setSections(sections);
    }
  }
}
async function addUrl(blockName, ulId, url, domain, name, save = true) {
  const ul = document.getElementById(ulId);
  if(!ul){
    console.warn("UL element not found:", ulId);
    return;
  }
  var li = document.createElement("li");
  li.setAttribute("id", url);
  var img = document.createElement("img");
  var a = document.createElement("a");
  let button = document.createElement("button");
  img.src = "https://www.google.com/s2/favicons?domain=" + domain + "&sz=32";
  img.alt = "favicon";
  a.href = url;
  a.target = "_blank";
  a.textContent = name;
  button.setAttribute("class", "deleteBtn");
  button.textContent = "x";
  button.addEventListener("click", async () => {
    const sections = await getSections();
    const section = sections.find((s) => s.id === blockName);
    section.links = section.links.filter((l) => l.url !== url);
    await setSections(sections);
    li.remove();
  });
  li.appendChild(img);
  li.appendChild(a);
  li.appendChild(button);
  ul.appendChild(li);
  if (save) {
    const sections = await getSections();
    const section = sections.find((s) => s.id === blockName);
    if (!section.links) section.links = [];
    section.links.push({
      blockName: blockName,
      ulId: blockName+"List",
      url: url,
      domain: domain,
      name: name,
    });
     section.lastUpdated = Date.now();
    await setSections(sections);
  }
}

function invokeGetUrl(blockName, btnId, divClass, listId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const div = document.querySelector(divClass);
  const list = document.getElementById(listId);
  btn.addEventListener("click", function (e) {
    getUrl(blockName, e, div, list);
  });
}
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}
function getUrl(blockName, e, div, list) {
  e.preventDefault();
  const form = document.createElement("form");
  const url = document.createElement("input");
  url.setAttribute("placeholder", "Enter url");
  const submit = document.createElement("button");
  submit.setAttribute("type", "submit");
  submit.textContent = "add";
  form.appendChild(url);
  form.appendChild(submit);
  div.appendChild(form);
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    let urlVal = url.value;

    if (!urlVal.startsWith("http://") && !urlVal.startsWith("https://")) {
      urlVal = "https://" + urlVal;
    }
    if (isValidUrl(urlVal)) {
      const urlObj = new URL(urlVal);
      const domain = urlObj.hostname;
      const parts = domain.split(".");
      const name = parts.length > 2 ? parts[parts.length - 2] : parts[0];
      if (domain !== "" || name !== "")
        addUrl(blockName, list.id, urlVal, domain, name);
      form.remove();
    } else {
      alert("Please enter valid URL. Example : https://google.com");
    }
  });
}
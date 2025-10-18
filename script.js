// Load data from localStorage on page load
function loadFromLocalStorage() {
  const sections = JSON.parse(localStorage.getItem('sections')) || [];
  sections.forEach(section => {
    createSection(section.title, section.id, false);
    section.links.forEach(link => {
      addUrl(section.id + 'List', link.url, link.domain, link.name, false);
    });
  });
}

// Get sections from localStorage
function getSections() {
  return JSON.parse(localStorage.getItem('sections')) || [];
}

// Save sections to localStorage
function setSections(sections) {
  localStorage.setItem('sections', JSON.stringify(sections));
}

// Add a new section to localStorage
function addSectionToLS(title, id) {
  const sections = getSections();
  sections.push({
    title: title,
    id: id,
    links: []
  });
  setSections(sections);
}

// Delete a section from localStorage
function deleteSectionFromLS(sectionId) {
  const sections = getSections();
  const filtered = sections.filter(section => section.id !== sectionId);
  setSections(filtered);
}

// Add a link to a section in localStorage
function addLinkToLS(sectionId, url, domain, name) {
  const sections = getSections();
  const section = sections.find(s => s.id === sectionId);
  if (section) {
    section.links.push({ url, domain, name });
    setSections(sections);
  }
}

// Delete a link from a section in localStorage
function deleteLinkFromLS(sectionId, url) {
  const sections = getSections();
  const section = sections.find(s => s.id === sectionId);
  if (section) {
    section.links = section.links.filter(link => link.url !== url);
    setSections(sections);
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
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const raw = blockName.value.trim();
    if (raw !== "") {
      const blockTitle = raw;
      const blockId = raw.replace(/\s+/g, "-").toLowerCase();
      createSection(blockTitle, blockId);
      addSectionToLS(blockTitle, blockId)
      form.remove();
    } else {
      alert("Fill the field");
    }
  });
}
function createSection(block, blockName,save = true) {
  const box = document.createElement("div");
  box.setAttribute("class", "box");
  box.setAttribute("data-section-id", blockName);
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
  box.appendChild(ul);

  const deleteSectionBtn = document.createElement("button");
  deleteSectionBtn.className = "deleteSectionBtn";
  deleteSectionBtn.textContent = "x";
  box.appendChild(deleteSectionBtn);

  deleteSectionBtn.addEventListener("click", () => {
    deleteSectionFromLS(blockName); 
    ul.remove();
    box.remove();
  });

  const container = document.querySelector(".container");
  container.appendChild(box);
  invokeGetUrl(
    blockName + "btn",
    "." + blockName + "-block",
    blockName + "List"
  );
}
function addUrl(ulId, url, domain, name, save = true) {
  const ul = document.getElementById(ulId);
  const sectionId = ulId.replace('List', '');
  var li = document.createElement("li");
  li.setAttribute("data-url", url); 
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
  button.addEventListener('click',() =>{
    deleteLinkFromLS(sectionId, url);
    li.remove();
  });
  li.appendChild(img);
  li.appendChild(a);
  li.appendChild(button);
  ul.appendChild(li);
  if (save){
    addLinkToLS(sectionId, url, domain, name);
  }
}

function invokeGetUrl(btnId, divClass, listId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const div = document.querySelector(divClass);
  const list = document.getElementById(listId);
  btn.addEventListener("click", function (e) {
    getUrl(e, div, list);
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
function getUrl(e, div, list) {
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
      if (domain !== "" || name !== "") addUrl(list.id, urlVal, domain, name);
      form.remove();
    } else {
      alert("Please enter valid URL. Example : https://google.com");
    }
  });
}
document.addEventListener('DOMContentLoaded', loadFromLocalStorage);
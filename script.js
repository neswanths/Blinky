document.addEventListener("DOMContentLoaded", () => {
  const sections = getSections();
  sections.forEach((section) => {
    createSection(section.title,section.id,false,section);
    if(!section.links) section.links = [];
    section.links.forEach((link) => {
      addUrl(section.id, link.ulId, link.url, link.domain, link.name, false);
    });
  });
});
function getSections() {
  const data = localStorage.getItem("sections");
  return data ? JSON.parse(data) : [];
}
function setSections(sections) {
  localStorage.setItem("sections", JSON.stringify(sections));
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
      form.remove();
    } else {
      alert("Fill the field");
    }
  });
}
function createSection(block, blockName,save = true,existingSection = null) {
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
  deleteSectionBtn.addEventListener("click", () => {
    let sections = getSections();
    sections = sections.filter((s) => s.id !== blockName);
    setSections(sections);
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
    const sections = getSections();
    const exists = sections.find((s) => s.id === blockName);
    if(!exists){
      sections.push({
        title: blockName,
        id: blockName,
        links: [],
      });
      setSections(sections);
    }
  }
}
function addUrl(blockName, ulId, url, domain, name, save = true) {
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
  button.addEventListener("click", () => {
    const sections = getSections();
    const section = sections.find((s) => s.id === blockName);
    section.links = section.links.filter((l) => l.url !== url);
    setSections(sections);
    li.remove();
  });
  li.appendChild(img);
  li.appendChild(a);
  li.appendChild(button);
  ul.appendChild(li);
  if (save) {
    const sections = getSections();
    const section = sections.find((s) => s.id === blockName);
    if (!section.links) section.links = [];
    section.links.push({
      blockName: blockName,
      ulId: blockName+"List",
      url: url,
      domain: domain,
      name: name,
    });
    setSections(sections);
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
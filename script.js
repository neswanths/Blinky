function getStoredLinks() {
  try {
    return JSON.parse(localStorage.getItem("blinkyLinks") || "{}");
  } catch (e) {
    console.error("Failed to parse blinkyLinks:", e);
    return {};
  }
}
function saveStoredLinks(data) {
  localStorage.setItem("blinkyLinks", JSON.stringify(data));
}

function addSection() {
  const form = document.createElement("form");
  const blockName = document.createElement("input");
  blockName.setAttribute("placeholder", "Enter Section Name...");
  form.appendChild(blockName);
  const btn = document.createElement("button");
  btn.setAttribute("type", "submit");
  btn.textContent = "confirm";
  form.appendChild(btn);
  const div = document.getElementById("addSection");
  div.appendChild(form);
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const raw = blockName.value.trim();
    if (raw !== "") {
      const blockTitle = raw;
      const blockId = raw.replace(/\s+/g, "-").toLowerCase();
      addAnotherBlock(blockTitle, blockId);
      form.remove();
    } else {
      alert("Fill the field");
    }
  });
}
function addAnotherBlock(block, blockName) {
  const box = document.createElement("div");
  box.setAttribute("class", "box");
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
  const container = document.querySelector(".container");
  container.appendChild(box);
  setupFormButton(
    blockName + "btn",
    "." + blockName + "-block",
    blockName + "List"
  );
}
function addUrl(ulId, url, domain, name, save = true) {
  const ul = document.getElementById(ulId);
  var li = document.createElement("li");
  var img = document.createElement("img");
  var a = document.createElement("a");
  img.src = "https://www.google.com/s2/favicons?domain=" + domain + "&sz=32";
  img.alt = "favicon";
  a.href = url;
  a.target = "_blank";
  a.textContent = name;
  li.appendChild(img);
  li.appendChild(a);
  ul.appendChild(li);
  if (!save) return;
  const links = getStoredLinks();
  if (!links[ulId]) links[ulId] = [];
  links[ulId].push({ url, domain, name });
  saveStoredLinks(links);
}
function loadStoredLinks() {
  const links = getStoredLinks();
  Object.keys(links).forEach((ulId) => {
    if (!document.getElementById(ulId)) {
      if (ulId.endsWith("List")) {
        const id = ulId.slice(0, -4);
        const title = id.replace(/-/g, " ");
        addAnotherBlock(title.charAt(0).toUpperCase() + title.slice(1), id);
      }
    }
  });
  Object.keys(links).forEach((ulId) => {
    links[ulId].forEach((link) => {
      if (link && link.url && link.domain && link.name) {
        addUrl(ulId, link.url, link.domain, link.name, false);
      }
    });
  });
}

window.addEventListener("DOMContentLoaded", loadStoredLinks);

function setupFormButton(btnId, divClass, listId) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  const div = document.querySelector(divClass);
  const list = document.getElementById(listId);
  btn.addEventListener("click", function (e) {
    openForm(e, div, list);
  });
}
function openForm(e, div, list) {
  e.preventDefault();
  const form = document.createElement("form");
  const url = document.createElement("input");
  url.setAttribute("placeholder", "Enter url");
  const domain = document.createElement("input");
  domain.setAttribute("placeholder", "Enter domain name");
  const name = document.createElement("input");
  name.setAttribute("placeholder", "Enter name");
  const submit = document.createElement("button");
  submit.setAttribute("type", "submit");
  submit.textContent = "add";
  form.appendChild(url);
  form.appendChild(domain);
  form.appendChild(name);
  form.appendChild(submit);
  div.appendChild(form);
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (url.value !== "" && domain.value !== "" && name.value !== "") {
      addUrl(list.id, url.value, domain.value, name.value);
      form.remove();
    } else {
      alert("Fill all fields");
    }
  });
}

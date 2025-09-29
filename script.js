function addUrl(ulId,url,domian,name){
    const ul = document.getElementById(ulId);
    var li = document.createElement('li');
    var img = document.createElement('img');
    var a = document.createElement('a');
    img.src = 'https://www.google.com/s2/favicons?domain='+domian + '&sz = 32';
    img.alt = 'favicon';
    a.href = url;
    a.target = '_blank';
    a.textContent = name;
    li.appendChild(img);
    li.appendChild(a);
    ul.appendChild(li);
}

  addUrl("aiList", "https://chatgpt.com/", "chatgpt.com", "ChatGpt");
  addUrl("aiList", "https://claude.ai/new", "claude.ai", "Claude");
  addUrl("aiList", "https://chat.deepseek.com/", "deepseek.com", "DeepSeek");
  addUrl("aiList", "https://aistudio.google.com/live", "aistudio.google.com", "AI Studio");
  addUrl("aiList", "https://notebooklm.google.com/", "notebooklm.google.com", "NotebookLM");
  addUrl("aiList", "https://www.atlas.org/home", "atlas.org", "Atlas");

  // Learning Sites
  addUrl("learninglist", "https://www.w3schools.com/", "w3schools.com", "w3schools");
  addUrl("learninglist", "https://www.geeksforgeeks.org/", "geeksforgeeks.org", "GeeksForGeeks");
  addUrl("learninglist", "https://www.youtube.com/", "youtube.com", "YouTube");
  addUrl("learninglist", "https://www.tpointtech.com/java-tutorial", "tpointtech.com", "tpointtech");
  addUrl("learninglist", "https://www.geeksforgeeks.org/batch/gfg-160-problems?tab=Chapters", "geeksforgeeks.org", "gfg-160");
  addUrl("learninglist", "https://leetcode.com/problemset/", "leetcode.com", "LeetCode");
  addUrl("learninglist", "https://github.com/dashboard", "github.com", "GitHub");
  addUrl("learninglist", "https://www.coursera.org/learn/algorithms-part1/home/module/2", "coursera.org", "Algorithms-Part1");

  // Productivity Tools
  addUrl("productivitylist", "https://tasks.google.com/u/4/tasks/", "tasks.google.com", "To-dos");
  addUrl("productivitylist", "https://calendar.google.com/calendar/u/4/r?pli=1", "calendar.google.com", "Calendar");

  // Others
  addUrl("otherslist", "https://web.whatsapp.com/", "whatsapp.com", "WhatsApp");
  addUrl("otherslist", "https://colab.research.google.com/", "colab.research.google.com", "Google Colab");
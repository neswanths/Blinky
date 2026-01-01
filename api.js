const API_URL =
  location.hostname === "localhost"
    ? "http://127.0.0.1:8000"
    : "https://blinky-production-3125.up.railway.app";

const API = {
  getToken: () => localStorage.getItem("accessToken"),
  setToken: (token) => localStorage.setItem("accessToken", token),
  clearToken: () => localStorage.removeItem("accessToken"),
  
  isLoggedIn: () => !!localStorage.getItem("accessToken"),


  request: async (endpoint, method = "GET", body = null) => {
    const headers = { "Content-Type": "application/json" };
    const token = API.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    const res = await fetch(`${API_URL}${endpoint}`, config);
    
    if (res.status === 401) {
      API.clearToken();
      window.location.reload();
      return null;
    }

    
    if (res.status === 204) {
      return null;
    }
    
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "API Error");
    }
    
    return res.json();
  },

  login: async (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);

    const res = await fetch(`${API_URL}/token`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Login failed");
    const data = await res.json();
    API.setToken(data.access_token);
  },

  register: async (email, password) => {
    return API.request("/users", "POST", { email, password });
  },

 getSections: async () => {
    if (!API.isLoggedIn()) return [];
    const domains = await API.request("/domains");
    
    return domains.map(d => ({
      id: d.id,         
      title: d.name,     
      links: d.bookmarks.map(b => {
        // SAFE URL PARSING logic
        let hostname = "unknown";
        try {
            // Try standard parsing
            hostname = new URL(b.url).hostname;
        } catch (e) {
            // If it fails (likely missing https://), try adding it
            try {
                hostname = new URL("https://" + b.url).hostname;
            } catch (e2) {
                // If it still fails, just use the raw text
                hostname = b.url;
            }
        }
        
        return {
            id: b.id,
            url: b.url,
            name: b.title,   
            domain: hostname 
        };
      })
    }));
  },

  createSection: async (name) => {
    const res = await API.request("/domains", "POST", { name });
    return { id: res.id, title: res.name, links: [] };
  },

  deleteSection: async (id) => {
    return API.request(`/domains/${id}`, "DELETE");
  },

  addLink: async (domainId, url, title) => {
    return API.request("/bookmarks", "POST", { 
      url: url, 
      title: title, 
      domain_id: domainId 
    });
  },

  deleteLink: async (bookmarkId) => {
    return API.request(`/bookmarks/${bookmarkId}`, "DELETE");
  }
};
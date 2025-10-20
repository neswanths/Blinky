// storage.js
// A minimal Storage adapter that exposes window.Store with getSections and setSections methods.
// It uses localStorage when signed out, and Cloud Firestore when signed in.
// Uses compat firebase available as window.FirebaseAuth and window.FirestoreDB.
(function(window){
  const LS_KEY = "sections";
  function now(){ return Date.now(); }

  // LocalStorage store (keeps your original format)
  const LocalStorageStore = {
    async getSections(){
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    },
    async setSections(sections){
      try{
        localStorage.setItem(LS_KEY, JSON.stringify(sections));
      }catch(e){ console.error("Failed to write localStorage:", e); }
    },
    async clear(){ localStorage.removeItem(LS_KEY); }
  };

  // Cloud store using Firestore (per-user collection: users/{uid}/sections/{id})
  function CloudStoreFactory(uid){
    const db = window.FirestoreDB;
    const collectionRef = db.collection('users').doc(uid).collection('sections');
    return {
      async getSections(){
        const snap = await collectionRef.get();
        const out = [];
        snap.forEach(doc => {
          out.push(doc.data());
        });
        return out;
      },
      async setSections(sections){
        // Ensure each section has id and lastUpdated
        const batch = window.FirestoreDB.batch();
        const existingSnap = await collectionRef.get();
        const existingIds = new Set();
        existingSnap.forEach(d=>existingIds.add(d.id));
        const incomingIds = new Set();
        sections.forEach(s=>{ if(!s.id) s.id = generateId(); if(!s.lastUpdated) s.lastUpdated = now(); incomingIds.add(s.id); });
        // Upsert incoming
        sections.forEach(s=>{
          const docRef = collectionRef.doc(s.id);
          batch.set(docRef, Object.assign({}, s, { owner: uid }), { merge: true });
        });
        // Delete docs removed locally
        existingIds.forEach(id => { if(!incomingIds.has(id)){ const docRef = collectionRef.doc(id); batch.delete(docRef); } });
        await batch.commit();
      },
      async clear(){
        const snap = await collectionRef.get();
        const batch = window.FirestoreDB.batch();
        snap.forEach(d=> batch.delete(collectionRef.doc(d.id)) );
        await batch.commit();
      }
    };
  }

  function generateId(){
    // small id generator to preserve your existing id style if any
    return 'id_' + Math.random().toString(36).slice(2,9) + '_' + Date.now().toString(36);
  }

  // Merge algorithm: Last-Write-Wins by lastUpdated (ms)
  function mergeSections(localArr, cloudArr){
    const map = new Map();
    localArr.forEach(s=> map.set(s.id, s));
    cloudArr.forEach(s=>{
      if(!s.id) return;
      const local = map.get(s.id);
      if(!local) map.set(s.id, s);
      else {
        // pick the one with newer lastUpdated
        const lts = local.lastUpdated || 0;
        const cts = s.lastUpdated || 0;
        if(cts > lts) map.set(s.id, s);
        else map.set(s.id, local);
      }
    });
    return Array.from(map.values());
  }

  // The unified Store object that the app will use
  const Store = {
    _cloud: null, // will be CloudStore instance when signed in
    async getSections(){
      if(this._cloud) return await this._cloud.getSections();
      return await LocalStorageStore.getSections();
    },
    async setSections(sections){
      // normalize: ensure id and lastUpdated
      sections.forEach(s=>{ if(!s.id) s.id = generateId(); if(!s.lastUpdated) s.lastUpdated = Date.now(); });
      if(this._cloud) return await this._cloud.setSections(sections);
      return await LocalStorageStore.setSections(sections);
    },
    async clear(){ if(this._cloud) return await this._cloud.clear(); return await LocalStorageStore.clear(); }
  };

  // Expose globally so existing code (script.js) can use window.Store.getSections/setSections
  window.Store = Store;

  // Listen for firebase auth state and switch store automatically with a merge step
  window.addEventListener('firebase-auth-state', async (ev)=>{
    const user = ev.detail.user;
    if(user){
      // Signed in: create cloud store and merge local -> cloud using LWW
      const uid = user.uid;
      const cloud = CloudStoreFactory(uid);
      try{
        const localSections = await LocalStorageStore.getSections();
        const cloudSections = await cloud.getSections();
        // backup local to a timestamped key
        try{ localStorage.setItem('sections_backup_' + Date.now(), JSON.stringify(localSections)); }catch(e){ console.warn("Could not save local backup", e); }
        const merged = mergeSections(localSections || [], cloudSections || []);
        // write merged to cloud and also keep local in sync
        await cloud.setSections(merged);
        try{ localStorage.setItem(LS_KEY, JSON.stringify(merged)); }catch(e){ console.warn("Could not update local after merge", e); }
        // switch to cloud store
        Store._cloud = cloud;
        console.log("Store switched to Cloud for user:", uid);
      }catch(err){
        console.error("Cloud sync failed:", err);
        // fallback: keep using local store
        Store._cloud = null;
      }
    } else {
      // Signed out: switch back to local store (no deletion)
      Store._cloud = null;
      console.log("Store switched to Local (signed out).");
    }
    // notify app that storage availability changed
    window.dispatchEvent(new CustomEvent('store-changed'));
  });

})(window);

(function (window) {
  const firebaseConfig = {
    apiKey: "AIzaSyD1qWsQ0cwpUGXVdtmY7txheYzjD78Knpk",
    authDomain: "blinky-51720.firebaseapp.com",
    projectId: "blinky-51720",
    storageBucket: "blinky-51720.firebasestorage.app",
    messagingSenderId: "207941783897",
    appId: "1:207941783897:web:e826093707228b4e2f7c48",
    measurementId: "G-XZH8TBLHZ1",
  };

  // Initialize Firebase compat
  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const auth = firebase.auth();
  const db = firebase.firestore();

  window.FirebaseApp = firebase.app();
  window.FirebaseAuth = auth;
  window.FirestoreDB = db;

  function $(id) {
    return document.getElementById(id);
  }

  function showUser(user) {
    const ui = $("user-info");
    const signInGoogle = $("sign-in-google");
    const signInEmail = $("sign-in-email");
    const signOut = $("sign-out");
    if (!ui) return;
    if (user) {
      ui.textContent = user.email || user.displayName || "User: " + user.uid;
      if (signInGoogle) signInGoogle.style.display = "none";
      if (signInEmail) signInEmail.style.display = "none";
      if (signOut) signOut.style.display = "inline-block";
    } else {
      ui.textContent = "Not signed in";
      if (signInGoogle) signInGoogle.style.display = "inline-block";
      if (signInEmail) signInEmail.style.display = "inline-block";
      if (signOut) signOut.style.display = "none";
    }
  }

  function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase
      .auth()
      .signInWithPopup(provider)
      .then((result) => {
        console.log("Signed in:", result.user.displayName);
      })
      .catch((error) => {
        console.error("Google sign-in failed:", error);
      });
  }

  async function signInWithEmail() {
    const email = prompt("Enter email for sign-in / sign-up:");
    if (!email) return;
    const password = prompt("Enter a password (6+ chars):");
    if (!password) return;
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        try {
          await auth.createUserWithEmailAndPassword(email, password);
        } catch (e2) {
          alert("Create account failed: " + e2.message);
        }
      } else {
        alert("Sign-in failed: " + err.message);
      }
    }
  }

  function signOut() {
    auth.signOut().catch((err) => console.error("Sign-out failed", err));
  }

  document.addEventListener("DOMContentLoaded", () => {
    const g = $("sign-in-google");
    if (g) g.addEventListener("click", signInWithGoogle);
    const e = $("sign-in-email");
    if (e) e.addEventListener("click", signInWithEmail);
    const o = $("sign-out");
    if (o) o.addEventListener("click", signOut);
  });

  auth.onAuthStateChanged((user) => {
    showUser(user);
    window.dispatchEvent(
      new CustomEvent("firebase-auth-state", { detail: { user } })
    );
  });
})(window);

/*import { auth } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submit-btn");
const toggleLink = document.getElementById("toggle-link");
const formTitle = document.getElementById("form-title");
const statusText = document.getElementById("status");

let isLogin = true;

// Switch between login and signup
toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  isLogin = !isLogin;
  formTitle.textContent = isLogin ? "Login" : "Sign Up";
  submitBtn.textContent = isLogin ? "Login" : "Sign Up";
  toggleLink.textContent = isLogin ? "Sign up" : "Login";
});

// Handle login or signup
submitBtn.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    if (isLogin) {
      await signInWithEmailAndPassword(auth, email, password);
      statusText.textContent = "✅ Logged in successfully!";
      statusText.style.color = "#10b981";
      // Redirect to dashboard
      setTimeout(() => (window.location.href = "dashboard.html"), 1000);
    } else {
      await createUserWithEmailAndPassword(auth, email, password);
      statusText.textContent = "🎉 Account created!";
      statusText.style.color = "#10b981";
    }
  } catch (error) {
    statusText.textContent = error.message;
    statusText.style.color = "#ef4444";
  }
});*/

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { auth, db } from "./firebase-config.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const toggleLink = document.getElementById("toggle-link");
const toggleText = document.getElementById("toggle-text");
const statusText = document.getElementById("status");

// ✅ Known majors (helps with typos)
const knownMajors = [
  "Mechanical Engineering",
  "Electrical Engineering",
  "Computer Engineering",
  "Computer Science",
  "Civil Engineering",
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Chemical Engineering",
  "Materials Science",
  "Industrial Engineering",
  "Information Technology",
];

// 🔍 Normalize and fix typos in major
function normalizeMajor(input) {
  const clean = input.trim().toLowerCase().replace(/engineering/g, "").trim();

  const fixes = {
    mech: "Mechanical Engineering",
    mecha: "Mechanical Engineering",
    mechan: "Mechanical Engineering",
    eletrical: "Electrical Engineering",
    electrical: "Electrical Engineering",
    comp: "Computer Engineering",
    compsci: "Computer Science",
    cs: "Computer Science",
    civil: "Civil Engineering",
    aero: "Aerospace Engineering",
    bio: "Biomedical Engineering",
    chem: "Chemical Engineering",
    material: "Materials Science",
    indus: "Industrial Engineering",
    info: "Information Technology",
  };

  for (let key in fixes) {
    if (clean.includes(key)) return fixes[key];
  }

  const match = knownMajors.find(m => m.toLowerCase().includes(clean));
  return match || input;
}

// 🌀 Toggle Login <-> Signup
toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  if (signupForm.style.display === "none") {
    signupForm.style.display = "block";
    loginForm.style.display = "none";
    toggleText.textContent = "Already have an account?";
    toggleLink.textContent = "Login";
  } else {
    signupForm.style.display = "none";
    loginForm.style.display = "block";
    toggleText.textContent = "Don’t have an account?";
    toggleLink.textContent = "Sign up";
  }
});

// 🟢 SIGNUP
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const confirmPassword = document.getElementById("confirm-password").value.trim();
    const name = document.getElementById("name").value.trim();
    const pronouns = document.getElementById("pronouns").value.trim();
    let major = document.getElementById("major").value.trim();
    const bio = document.getElementById("bio").value.trim();

    if (password !== confirmPassword) {
      statusText.textContent = "❌ Passwords do not match.";
      return;
    }

    major = normalizeMajor(major);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        name,
        pronouns: pronouns || "Not specified",
        major,
        bio,
        createdAt: new Date().toISOString(),
      });

      statusText.textContent = `✅ Account created successfully! Redirecting...`;
      setTimeout(() => (window.location.href = "dashboard.html"), 1500);
    } catch (error) {
      statusText.textContent = "❌ " + error.message;
    }
  });
}

// 🟣 LOGIN
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      statusText.textContent = "✅ Logged in! Redirecting...";
      setTimeout(() => (window.location.href = "dashboard.html"), 1500);
    } catch (error) {
      statusText.textContent = "❌ " + error.message;
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) console.log("Logged in:", user.email);
});


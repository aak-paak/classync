import { auth, db } from "./firebase-config.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const nameEl = document.getElementById("profile-name");
const majorEl = document.getElementById("profile-major");
const pronounsEl = document.getElementById("profile-pronouns");
const bioEl = document.getElementById("profile-bio");

const editSection = document.getElementById("edit-section");
const editBtn = document.getElementById("editProfileBtn");
const saveBtn = document.getElementById("saveChangesBtn");
const cancelBtn = document.getElementById("cancelEditBtn");
const backBtn = document.getElementById("backToDashboardBtn");

const editName = document.getElementById("edit-name");
const editMajor = document.getElementById("edit-major");
const editPronouns = document.getElementById("edit-pronouns");
const editBio = document.getElementById("edit-bio");

// ✅ Load user profile
// Load user data
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  try {
    const userRef = doc(db, "users", user.uid);  // ✅ correct
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      document.getElementById("profile-name").textContent = data.name || "Unknown";
      document.getElementById("profile-major").textContent = data.major || "Undeclared";
      document.getElementById("profile-pronouns").textContent = data.pronouns || "Not specified";
      document.getElementById("profile-bio").textContent = data.bio || "No bio yet.";
    }
  } catch (err) {
    console.error("Error loading profile:", err);
  }
});


// ✏️ Edit Profile
// Edit button
document.getElementById("editProfileBtn").addEventListener("click", async () => {
  const newName = prompt("Enter new name:");
  const newMajor = prompt("Enter new major:");
  const newPronouns = prompt("Enter new pronouns:");
  const newBio = prompt("Enter new bio:");

  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = doc(db, "users", user.uid);  // ✅ correct
    await updateDoc(userRef, {
      name: newName,
      major: newMajor,
      pronouns: newPronouns,
      bio: newBio
    });

    alert("✅ Profile updated!");
    window.location.reload();
  } catch (err) {
    console.error("Error updating profile:", err);
  }
});



// ❌ Cancel Edit
cancelBtn.addEventListener("click", () => {
  editSection.classList.add("hidden");
});

// ⬅️ Back Button
backBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

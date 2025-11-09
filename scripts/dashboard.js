// Wait for the DOM to fully load before running anything
document.addEventListener("DOMContentLoaded", () => {

  // Get elements safely
  const sidebar = document.getElementById("sidebar");
  const openBtn = document.getElementById("openSidebar");
  const closeBtn = document.getElementById("closeSidebar");
  const readBtn = document.getElementById("readSchedule");
  const logoutBtn = document.getElementById("logout-btn");
  const fileInput = document.getElementById("schedule-file");
  const statusText = document.getElementById("status");
  const resultText = document.getElementById("result");
  const matchesDiv = document.getElementById("matches");

  // Safety check — helps you debug if anything is missing
  console.log({
    sidebar, openBtn, closeBtn, readBtn, logoutBtn, fileInput
  });

  // 🟩 Sidebar open
  if (openBtn && sidebar) {
    openBtn.addEventListener("click", () => {
      sidebar.classList.add("open");
    });
  }

  // 🟥 Sidebar close
  if (closeBtn && sidebar) {
    closeBtn.addEventListener("click", () => {
      sidebar.classList.remove("open");
    });
  }

  // 🚪 Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await signOut(auth);
      window.location.href = "index.html";
    });
  }

  // 📅 Handle Schedule Upload
  if (readBtn) {
    readBtn.addEventListener("click", async () => {
      if (!fileInput.files[0]) {
        statusText.textContent = "Please select an image";
        return;
      }

      const file = fileInput.files[0];
      statusText.textContent = "📖 Reading schedule...";
      resultText.textContent = "";
      matchesDiv.innerHTML = "";

      try {
        const { data } = await Tesseract.recognize(file, "eng");
        statusText.textContent = "✅ OCR complete!";
      } catch (error) {
        console.error(error);
        statusText.textContent = "Error reading schedule!";
      }
    });
  }

}); // <-- End of DOMContentLoaded

import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  setDoc,
  doc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// HTML elements
const fileInput = document.getElementById("schedule-image");
const readBtn = document.getElementById("read-btn");
const resultText = document.getElementById("result-text");
const statusText = document.getElementById("status");
const matchesDiv = document.getElementById("matches");
const logoutBtn = document.getElementById("logout-btn");

let currentUser = null;

// 🔐 Auth check
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
  } else {
    window.location.href = "index.html";
  }
});

// 🚪 Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

// 📸 Handle Schedule Upload

if (readBtn) {
    readBtn.addEventListener("click", async () => {
        if (!fileInput.files[0]) {
        statusText.textContent = "Please select an image first.";
        return;
        }

        // ... your OCR logic here ...
    


        const file = fileInput.files[0];
        statusText.textContent = "📖 Reading schedule...";
        resultText.textContent = "";
        matchesDiv.innerHTML = "";

        try {
            // 🧠 Step 1: OCR with Tesseract
            const result = await Tesseract.recognize(file, "eng", {
            logger: m => console.log(m)
            });
            const text = result.data.text;
            console.log("🧾 Raw OCR text:\n", text);

            // Step 2: Split text into lines
            const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

            // Step 3: Regex to detect more course patterns
            const courseRegex = /\b([A-Z]{3,6})\s*([0-9]{3,4}[A-Z]?)\s*-\s*([0-9]{3})\b/g;

            const extractedClasses = [];

            for (const line of lines) {
            const matches = line.matchAll(courseRegex);
            for (const match of matches) {
                extractedClasses.push(`${match[1]} ${match[2]} - ${match[3]}`);
            }
            }

            // 🧹 Step 4: Clean & remove duplicates
            const normalized = extractedClasses.map(c =>
            c.toUpperCase().replace(/\s+/g, " ").replace(/\s*-\s*/g, " - ").trim()
            );
            const uniqueClasses = [...new Set(normalized)].sort();

            if (uniqueClasses.length > 0) {
            resultText.textContent = uniqueClasses.join("\n");
            statusText.textContent = `✅ Found ${uniqueClasses.length} course(s)!`;
            statusText.style.color = "#10b981";
            } else {
            resultText.textContent = "";
            statusText.textContent = "⚠️ No valid courses found. Try a clearer screenshot.";
            statusText.style.color = "#facc15";
            }

            // 💾 Save to Firestore
            await setDoc(doc(db, "schedules", currentUser.uid), {
            email: currentUser.email,
            classes: uniqueClasses,
            });

            // 🤝 Find classmates
            findMatches(uniqueClasses);

        } catch (err) {
            console.error("Error processing schedule:", err);
            statusText.textContent = "❌ Error reading image. Try again.";
        }
        });
    } else {
    console.warn("⚠️ readBtn not found — check the button ID in dashboard.html");
    }

// 🤝 Find matches with other users
async function findMatches(myClasses) {
  matchesDiv.innerHTML = "🔍 Searching for classmates...";
  const snapshot = await getDocs(collection(db, "schedules"));
  let results = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.email !== currentUser.email) {
      const common = data.classes.filter((cls) =>
        myClasses.some((myCls) => myCls === cls)
      );
      if (common.length > 0) {
        results.push({ email: data.email, overlap: common.length, common });
      }
    }
  });

  results.sort((a, b) => b.overlap - a.overlap);

  matchesDiv.innerHTML = "";
  if (results.length === 0) {
    matchesDiv.innerHTML = "😔 No matches yet — try again later!";
    return;
  }

  results.forEach((r) => {
    const card = document.createElement("div");
    card.className = "match-card";
    card.innerHTML = `
      <strong>${r.email}</strong><br>
      ${r.overlap} matching class${r.overlap > 1 ? "es" : ""}<br>
      <small>${r.common.join(", ")}</small><br>
      <button class="fav-btn">⭐ Favorite</button>
    `;
    matchesDiv.appendChild(card);
  });
}
// 🌈 SIDEBAR TOGGLE LOGIC
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const openBtn = document.getElementById("openSidebar");
  const closeBtn = document.getElementById("closeSidebar");

  if (!sidebar || !openBtn || !closeBtn) {
    console.error("Sidebar elements not found. Check IDs in HTML!");
    return;
  }

  // Open sidebar
  openBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.add("open");
  });

  // Close sidebar
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    sidebar.classList.remove("open");
  });

  // Click outside to close
  document.addEventListener("click", (e) => {
    if (!sidebar.contains(e.target) && !openBtn.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  });
});

// 🧭 Sidebar Navigation Buttons
const profileLink = document.getElementById("profile-link");
const friendsLink = document.getElementById("friends-link");
const editBioLink = document.getElementById("editbio-link");

// Profile page
if (profileLink) {
  profileLink.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
}

// Friends page (if you’ll add later)
if (friendsLink) {
  friendsLink.addEventListener("click", () => {
    window.location.href = "friends.html";
  });
}

// Edit Bio (can go to same profile page for now)
if (editBioLink) {
  editBioLink.addEventListener("click", () => {
    window.location.href = "profile.html";
  });
}

// Logout
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}



/*import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  setDoc,
  doc,
  getDocs,
  collection
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const fileInput = document.getElementById("schedule-image");
const readBtn = document.getElementById("read-btn");
const resultText = document.getElementById("result-text");
const statusText = document.getElementById("status");
const matchesDiv = document.getElementById("matches");
const logoutBtn = document.getElementById("logout-btn");

let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) currentUser = user;
  else window.location.href = "index.html";
});

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

// 🧠 Preprocess image (grayscale + contrast boost)
async function preprocessImage(file) {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const url = URL.createObjectURL(file);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert to grayscale and boost contrast
      for (let i = 0; i < data.length; i += 4) {
        let avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        avg = avg > 128 ? 255 : 0; // threshold
        data[i] = data[i + 1] = data[i + 2] = avg;
      }
      ctx.putImageData(imageData, 0, 0);
      canvas.toBlob((blob) => resolve(blob), "image/png");
    };
    img.src = url;
  });
}

readBtn.addEventListener("click", async () => {
  if (!fileInput.files[0]) {
    statusText.textContent = "Please select an image first.";
    return;
  }

  const file = fileInput.files[0];
  statusText.textContent = "🧠 Preprocessing image...";
  resultText.textContent = "";
  matchesDiv.innerHTML = "";

  const processed = await preprocessImage(file);

  try {
    statusText.textContent = "📖 Reading schedule...";
    const result = await Tesseract.recognize(processed, "eng", {
      logger: (m) => console.log(m),
    });

    const text = result.data.text;
    console.log("🧾 RAW OCR TEXT:\n", text);

    // Debug view for OCR text
    let debugBox = document.getElementById("debug-box");
    if (!debugBox) {
      debugBox = document.createElement("pre");
      debugBox.id = "debug-box";
      debugBox.style = "max-height:200px; overflow:auto; font-size:12px; background:#111; color:#0f0; padding:8px; border-radius:8px;";
      document.body.appendChild(debugBox);
    }
    debugBox.textContent = text;

    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    const courseRegex = /\b([A-Z]{3,6})\s*([0-9]{3,4}[A-Z]?)\s*-\s*([0-9]{3})\b/g;
    const extracted = [];

    for (const line of lines) {
      const matches = line.matchAll(courseRegex);
      for (const m of matches) extracted.push(`${m[1]} ${m[2]} - ${m[3]}`);
    }

    const cleaned = extracted.map((c) =>
      c.toUpperCase().replace(/\s+/g, " ").replace(/\s*-\s/g, " - ").trim()
    );
    const unique = [...new Set(cleaned)].sort();

    if (unique.length > 0) {
      resultText.textContent = unique.join("\n");
      statusText.textContent = `✅ Found ${unique.length} course(s)!`;
      statusText.style.color = "#10b981";
    } else {
      resultText.textContent = "";
      statusText.textContent = "⚠️ No valid courses found. Try a clearer screenshot.";
      statusText.style.color = "#facc15";
    }

    await setDoc(doc(db, "schedules", currentUser.uid), {
      email: currentUser.email,
      classes: unique,
    });

    findMatches(unique);

  } catch (err) {
    console.error(err);
    statusText.textContent = "❌ Error reading image.";
  }
});

async function findMatches(myClasses) {
  matchesDiv.innerHTML = "🔍 Searching for classmates...";
  const snapshot = await getDocs(collection(db, "schedules"));
  let results = [];

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    if (data.email !== currentUser.email) {
      const common = data.classes.filter((cls) =>
        myClasses.some((myCls) => myCls === cls)
      );
      if (common.length > 0) results.push({ email: data.email, common });
    }
  });

  matchesDiv.innerHTML =
    results.length === 0
      ? "😔 No matches yet — try again later!"
      : results
          .map(
            (r) =>
              `<div class="match-card"><strong>${r.email}</strong><br><small>${r.common.join(
                ", "
              )}</small></div>`
          )
          .join("");
}*/

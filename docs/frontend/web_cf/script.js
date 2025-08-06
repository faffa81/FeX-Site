const BACKEND_URL = 'https://fex-backend.onrender.com';

document.addEventListener('DOMContentLoaded', () => {
  loadVersionInfo();
  loadUpdateLogs();

  // Toggle login/register form
  document.getElementById('toggle-auth').addEventListener('click', () => {
    document.getElementById('auth-section').classList.toggle('hidden');
  });

  // Banner double-click to GitHub
  document.getElementById('banner-container').addEventListener('dblclick', () => {
    window.location.href = "https://github.com/faffa81/FeX-V2-Client";
  });

  // Auto-login
  const savedUser = localStorage.getItem('username');
  const savedPass = localStorage.getItem('password');
  if (savedUser && savedPass) {
    loginUser(savedUser, savedPass);
  }

  // Fetch online players
  getOnlinePlayers();
});

// Load version info from version.json
function loadVersionInfo() {
  fetch('../version.json')
    .then(res => res.json())
    .then(data => {
      document.getElementById('version-info').textContent =
        `Version: ${data.version} | Released: ${data.release_date} | Notes: ${data.notes}`;
    })
    .catch(() => {
      document.getElementById('version-info').textContent = "Version info unavailable";
    });
}

// Load update logs from updatelogs.txt
function loadUpdateLogs() {
  fetch('../updatelogs.txt')
    .then(res => res.text())
    .then(text => {
      const sections = [];
      const regex = /\/\/\s*(v[\d\.]+)\s*\\\\\s*([\s\S]*?)\*\*\s*\1\s*\*\*/g;
      let match;
      while ((match = regex.exec(text)) !== null) {
        sections.push({ version: match[1], log: match[2].trim() });
      }

      const logButtonsDiv = document.getElementById('log-buttons');
      logButtonsDiv.innerHTML = "";

      sections.forEach(section => {
        if (parseFloat(section.version) >= 7.0) {
          const downloadContainer = document.querySelector("footer");
          const fexDownloadBtn = document.createElement("button");
          fexDownloadBtn.textContent = `Download FeX ${section.version} (Win64)`;
          fexDownloadBtn.classList.add("fex-download-btn");
          fexDownloadBtn.onclick = () => {
            window.location.href = `/downloads/FeX-${section.version}-win64.zip`;
          };
          downloadContainer.prepend(fexDownloadBtn);
        }

        const btn = document.createElement('button');
        btn.textContent = section.version;
        btn.classList.add('log-btn');
        btn.onclick = () => {
          displayUpdateLog(section.log);
          highlightButton(btn);
        };
        logButtonsDiv.appendChild(btn);
      });

      if (sections.length > 0) {
        displayUpdateLog(sections[0].log);
        logButtonsDiv.querySelector('button').classList.add('active');
      } else {
        document.getElementById('update-log-frame').textContent = "No update logs found.";
      }
    })
    .catch(() => {
      document.getElementById('update-log-frame').textContent = "Could not load update logs.";
    });
}

// Display update log content
function displayUpdateLog(logContent) {
  document.getElementById('update-log-frame').innerHTML = "<pre>" + logContent + "</pre>";
}

// Highlight active update log button
function highlightButton(activeBtn) {
  document.querySelectorAll('.log-btn').forEach(btn => btn.classList.remove('active'));
  activeBtn.classList.add('active');
}

// Show GitHub releases modal
function showReleases() {
  const releasesList = document.getElementById('releases-list');
  releasesList.innerHTML = "Loading releases...";
  fetch('https://api.github.com/repos/faffa81/FeX-V2-Client/releases')
    .then(res => res.json())
    .then(data => {
      if (data.length === 0) {
        releasesList.innerHTML = "No releases found.";
        return;
      }
      let html = "<ul>";
      data.forEach(release => {
        let assetsInfo = "";
        release.assets.forEach(asset => {
          assetsInfo += `<li>${asset.name} — ${asset.download_count} downloads — <a href="${asset.browser_download_url}" target="_blank">Download</a></li>`;
        });
        html += `<li>
                  <strong>${release.tag_name}</strong> (${release.name || "No name"})<br/>
                  <ul>${assetsInfo}</ul>
                 </li>`;
      });
      html += "</ul>";
      releasesList.innerHTML = html;
    })
    .catch(() => {
      releasesList.innerHTML = "Failed to load releases.";
    });

  document.getElementById('download-modal').style.display = "block";
}

// Close modal
function closeModal() {
  document.getElementById('download-modal').style.display = "none";
}

// Register
async function registerUser() {
  const username = document.getElementById('reg-username').value;
  const password = document.getElementById('reg-password').value;

  const res = await fetch(`${BACKEND_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  alert(data.message);
}

// Login
async function loginUser(usernameInput, passwordInput) {
  const username = usernameInput || document.getElementById('login-username').value;
  const password = passwordInput || document.getElementById('login-password').value;

  const res = await fetch(`${BACKEND_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (data.success) {
    alert(`Welcome ${data.username}, your time is ${data.time}`);
    localStorage.setItem('username', username);
    localStorage.setItem('password', password);
    startTimeSync(username);
  } else {
    alert(data.message);
  }
}

// Get online player count
function getOnlinePlayers() {
  fetch(`${BACKEND_URL}/online`)
    .then(res => res.json())
    .then(data => {
      console.log("Online players:", data.online);
    });
}
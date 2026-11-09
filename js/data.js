let all_clubs = [];
let all_councils = [];
let cosa_data = null;
let data_fetched = null;

async function get_CoSA_data() {
  if (cosa_data) {
    return { all_clubs, all_councils, cosa_data };
  }

  if (!data_fetched) {
    data_fetched = fetch('./../iit_bhilai_cosa_data.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        cosa_data = data;
        all_clubs = data.clubs || [];
        all_councils = data.councils || [];
        return { all_clubs, all_councils, cosa_data };
      });
  }
  return data_fetched;
}

function escape_html(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const escapeHTML = escape_html;

function init_theme_toggle() {
  const btn = document.getElementById("theme-toggle");
  const label = document.getElementById("theme-label");
  const icon = document.getElementById("theme-icon");
  if (!btn) return;

  function update_theme(theme) {
    const is_dark = theme === "dark";
    document.documentElement.setAttribute("data-theme", theme);
    btn.setAttribute("aria-pressed", is_dark);
    btn.setAttribute("aria-label", is_dark ? "Switch to light theme" : "Switch to dark theme");
    if (label) label.textContent = is_dark ? "Light mode" : "Dark mode";
    if (icon) icon.textContent = is_dark ? "☼" : "◐";
  }

  update_theme(document.documentElement.getAttribute("data-theme") || "light");

  btn.addEventListener("click", () => {
    const next_theme = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", next_theme); } catch (e) { }
    update_theme(next_theme);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init_theme_toggle);
  } else {
    init_theme_toggle();
  }
}



// ============================================================
// SHAWWAL TO SHA'BAN — Application Logic
// ============================================================

(function () {
  "use strict";

  // ── Utility: parse date string to comparable value ──────
  function parseDate(str) {
    return new Date(str.replace(/,/g, ""));
  }

  // ── Find today's lesson ─────────────────────────────────
  function getTodayLesson() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < LESSONS.length; i++) {
      const d = parseDate(LESSONS[i].date);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) return LESSONS[i];
    }
    return null;
  }

  // ── Show Today Banner ───────────────────────────────────
  function initTodayBanner() {
    const lesson = getTodayLesson();
    const banner = document.getElementById("todayBanner");
    const info = document.getElementById("todayLesson");
    if (lesson && banner && info) {
      banner.style.display = "flex";
      info.textContent = `Lesson ${lesson.lesson} — ${lesson.reading} (${lesson.date})`;
    }
  }

  // ── Build the schedule HTML ─────────────────────────────
  function buildSchedule(filterQuarter, searchQuery) {
    const container = document.getElementById("scheduleContainer");
    const noResults = document.getElementById("noResults");
    if (!container) return;

    const todayLesson = getTodayLesson();
    const query = (searchQuery || "").toLowerCase().trim();
    let totalVisible = 0;

    container.innerHTML = "";

    QUARTERS.forEach((quarter) => {
      if (filterQuarter !== "all" && quarter.id !== parseInt(filterQuarter)) return;

      // Filter weeks in this quarter
      const quarterWeeks = WEEKS.filter((w) => w.quarter === quarter.id);

      // Build week sections
      let quarterHTML = "";
      let hasVisibleLessons = false;

      quarterWeeks.forEach((week) => {
        if (week.eid) {
          // Eid break row
          if (!query) {
            quarterHTML += `
              <div class="week-group">
                <div class="week-header">
                  <span class="week-title">${week.label}</span>
                  <span class="week-dates">${week.dates}</span>
                </div>
                <table class="schedule-table">
                  <tr class="eid-break">
                    <td colspan="4">☪️ ʿĪd al-Aḍḥā Break — May 24–30, 2026 · No lessons this week. Enjoy the ʿĪd!</td>
                  </tr>
                </table>
              </div>`;
            hasVisibleLessons = true;
          }
          return;
        }

        const weekLessons = LESSONS.filter((l) => l.week === week.week && l.quarter === quarter.id);

        // Apply search filter
        const filteredLessons = weekLessons.filter((l) => {
          if (!query) return true;
          return (
            l.reading.toLowerCase().includes(query) ||
            l.date.toLowerCase().includes(query) ||
            l.day.toLowerCase().includes(query) ||
            String(l.lesson).includes(query) ||
            `lesson ${l.lesson}`.includes(query)
          );
        });

        if (filteredLessons.length === 0) return;

        hasVisibleLessons = true;
        totalVisible += filteredLessons.length;

        const rows = filteredLessons
          .map((l) => {
            const isToday = todayLesson && l.lesson === todayLesson.lesson;
            return `
            <tr class="${isToday ? "today-row" : ""}">
              <td class="td-lesson"><span class="lesson-num">${l.lesson}</span></td>
              <td class="td-date">${l.date}</td>
              <td class="td-day">${l.day}</td>
              <td class="td-reading"><span class="reading-portion">${l.reading}</span>${isToday ? ' <span style="font-size:0.75rem;color:var(--gold);margin-left:0.5rem;font-style:italic;">← Today</span>' : ""}</td>
            </tr>`;
          })
          .join("");

        quarterHTML += `
          <div class="week-group">
            <div class="week-header">
              <span class="week-title">${week.label}</span>
              <span class="week-dates">${week.dates}</span>
            </div>
            <table class="schedule-table">
              <thead>
                <tr>
                  <th class="td-lesson">Lesson</th>
                  <th class="td-date">Date</th>
                  <th class="td-day">Day</th>
                  <th class="td-reading">Reading Portion</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>`;
      });

      if (!hasVisibleLessons) return;

      const quarterSection = document.createElement("div");
      quarterSection.className = "quarter-section";
      quarterSection.dataset.quarter = quarter.id;
      quarterSection.innerHTML = `
        <div class="quarter-header">
          <div class="qh-num">Q${quarter.id}</div>
          <div class="qh-info">
            <div class="qh-title">${quarter.title}</div>
            <div class="qh-range">${quarter.range}</div>
            <div class="qh-range" style="margin-top:0.2rem; color: var(--text-muted);">${quarter.dates}</div>
          </div>
          <div class="qh-badge">Lessons ${quarter.lessons}</div>
        </div>
        ${quarterHTML}`;
      container.appendChild(quarterSection);
    });

    if (totalVisible === 0 && filterQuarter === "all" && query) {
      noResults.style.display = "block";
      container.style.display = "none";
    } else {
      noResults.style.display = "none";
      container.style.display = "flex";
    }

    // Scroll to today's lesson if visible
    if (!query && filterQuarter === "all") {
      setTimeout(() => {
        const todayRow = container.querySelector(".today-row");
        if (todayRow) {
          todayRow.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
    }
  }

  // ── Filter & Search logic ───────────────────────────────
  let activeQuarter = "all";
  let searchTimeout = null;

  function initFilters() {
    const filterBtns = document.querySelectorAll(".filter-btn");
    const searchInput = document.getElementById("searchInput");

    filterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        activeQuarter = btn.dataset.quarter;
        buildSchedule(activeQuarter, searchInput ? searchInput.value : "");
      });
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          buildSchedule(activeQuarter, searchInput.value);
        }, 250);
      });
    }
  }

  // ── Navigation ──────────────────────────────────────────
  function initNav() {
    const nav = document.querySelector(".nav");
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.querySelector(".nav-links");

    window.addEventListener("scroll", () => {
      if (nav) {
        nav.classList.toggle("scrolled", window.scrollY > 60);
      }
    });

    if (hamburger && navLinks) {
      hamburger.addEventListener("click", () => {
        navLinks.classList.toggle("open");
      });

      // Close on link click
      navLinks.querySelectorAll("a").forEach((a) => {
        a.addEventListener("click", () => {
          navLinks.classList.remove("open");
        });
      });
    }
  }

  // ── Scroll reveal animation ─────────────────────────────
  function initReveal() {
    if (!("IntersectionObserver" in window)) return;

    const targets = document.querySelectorAll(
      ".quote-card, .quarter-card, .level-card, .coord-card"
    );

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      obs.observe(el);
    });
  }

  // ── Progress bar ────────────────────────────────────────
  function initProgress() {
    const bar = document.createElement("div");
    bar.style.cssText =
      "position:fixed;top:0;left:0;height:2px;background:var(--gold);z-index:9999;transition:width 0.1s linear;pointer-events:none;";
    document.body.prepend(bar);

    window.addEventListener("scroll", () => {
      const scrolled = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = total > 0 ? (scrolled / total) * 100 + "%" : "0%";
    });
  }

  // ── Active nav link highlighting ─────────────────────────
  function initActiveNav() {
    const sections = document.querySelectorAll("section[id], header[id]");
    const navLinks = document.querySelectorAll(".nav-links a");

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((a) => {
              a.style.color = "";
              if (a.getAttribute("href") === `#${entry.target.id}`) {
                a.style.color = "var(--gold-light)";
              }
            });
          }
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach((s) => obs.observe(s));
  }

  // ── Init ────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    initNav();
    initTodayBanner();
    buildSchedule("all", "");
    initFilters();
    initReveal();
    initProgress();
    initActiveNav();
  });
})();

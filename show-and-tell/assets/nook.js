(function () {
  "use strict";

  const feed = document.getElementById("update-feed");
  const nextItem = window.NOOK_NEXT && typeof window.NOOK_NEXT === "object"
    ? window.NOOK_NEXT
    : { mode: "processing" };
  const projects = window.NOOK_PROJECTS && typeof window.NOOK_PROJECTS === "object"
    ? window.NOOK_PROJECTS
    : {};
  const updates = Array.isArray(window.NOOK_UPDATES)
    ? window.NOOK_UPDATES.slice().sort(function (a, b) {
        return `${b.date || ""}T${b.time || ""}`.localeCompare(`${a.date || ""}T${a.time || ""}`);
      })
    : [];

  function readableDate(date) {
    const parsed = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return date;
    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "2-digit"
    }).format(parsed);
  }

  function safeText(value) {
    return typeof value === "string" ? value : "";
  }

  function renderNextItem() {
    const display = document.querySelector(".next-display");
    const project = document.getElementById("next-project");
    const message = document.getElementById("next-message");
    if (!display || !project || !message) return;

    const isQueued = nextItem.mode === "queued" && safeText(nextItem.text);
    const projectName = isQueued ? safeText(nextItem.project) : "";
    display.dataset.mode = isQueued ? "queued" : "processing";
    project.textContent = projectName;
    project.hidden = !projectName;
    message.textContent = isQueued ? safeText(nextItem.text) : "PROCESSING";
  }

  function makeMark(update) {
    const stamp = document.createElement("span");
    stamp.className = "project-mark";
    stamp.setAttribute("aria-hidden", "true");
    const projectStyle = projects[update.project] || {};
    const stampColor = update.markColor || projectStyle.stampColor;
    if (stampColor) stamp.style.setProperty("--stamp-ink", stampColor);

    if (update.markImage) {
      const image = document.createElement("img");
      image.src = update.markImage;
      image.alt = "";
      stamp.appendChild(image);
    } else {
      stamp.textContent = safeText(projectStyle.shortName)
        || safeText(update.mark)
        || safeText(update.project).slice(0, 3).toUpperCase();
    }
    return stamp;
  }

  function makeEntry(update, index) {
    const entry = document.createElement("article");
    entry.className = "dispatch";
    entry.id = safeText(update.id);
    entry.style.setProperty("--print-order", index);

    const headingId = `${safeText(update.id) || `dispatch-${index}`}-title`;
    entry.setAttribute("aria-labelledby", headingId);

    const top = document.createElement("div");
    top.className = "dispatch__top";

    const date = document.createElement("time");
    date.dateTime = update.time ? `${update.date}T${update.time}` : update.date;
    date.textContent = `${readableDate(update.date)}${update.time ? ` · ${update.time}` : ""}`;
    top.append(date, makeMark(update));

    const project = document.createElement("p");
    project.className = "dispatch__project";
    project.textContent = safeText(update.project);

    if (update.isExample) {
      const label = document.createElement("span");
      label.className = "example-label";
      label.textContent = "Example entry";
      project.append(" ", label);
    }

    const title = document.createElement("h3");
    title.id = headingId;
    title.textContent = safeText(update.title);

    entry.append(top, project, title);

    if (update.body) {
      const body = document.createElement("p");
      body.className = "dispatch__body";
      body.textContent = safeText(update.body);
      entry.appendChild(body);
    }

    if (update.url) {
      const link = document.createElement("a");
      link.className = "dispatch__link";
      link.href = update.url;
      link.textContent = safeText(update.linkLabel) || `Visit ${safeText(update.project)}`;
      if (update.url === "#") {
        link.addEventListener("click", function (event) { event.preventDefault(); });
        link.setAttribute("aria-disabled", "true");
        link.title = "Placeholder link";
      }
      entry.appendChild(link);
    }

    const number = document.createElement("span");
    number.className = "dispatch__number";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(updates.length - index).padStart(3, "0");
    entry.appendChild(number);
    return entry;
  }

  function startPrintAnimation() {
    const receipt = document.querySelector(".receipt");
    const printer = document.querySelector(".printer");
    const paperEnd = document.querySelector(".paper-end");
    if (!receipt || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    receipt.style.setProperty("--feed-duration", "4.75s");
    if (paperEnd) {
      const startingOffset = Math.round((receipt.offsetHeight * 0.96) + 24);
      paperEnd.style.setProperty("--paper-start", `-${startingOffset}px`);
      paperEnd.style.setProperty("--feed-duration", "4.75s");
    }

    window.requestAnimationFrame(function () {
      receipt.classList.add("is-printing");
      printer?.classList.add("is-printing");
      paperEnd?.classList.add("is-printing");
    });

    receipt.addEventListener("animationend", function finishPrinting(event) {
      if (event.animationName !== "feed-paper") return;
      receipt.classList.remove("is-printing");
      printer?.classList.remove("is-printing");
      paperEnd?.classList.remove("is-printing");
      receipt.removeEventListener("animationend", finishPrinting);
    });
  }

  renderNextItem();
  if (!feed) return;

  if (!updates.length) {
    const empty = document.createElement("p");
    empty.className = "noscript-note";
    empty.textContent = "The printer is quiet. Check back soon.";
    feed.appendChild(empty);
    startPrintAnimation();
    return;
  }

  const fragment = document.createDocumentFragment();
  updates.forEach(function (update, index) {
    fragment.appendChild(makeEntry(update, index));
  });
  feed.appendChild(fragment);
  startPrintAnimation();
})();

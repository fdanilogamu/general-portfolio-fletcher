(function () {
  "use strict";

  const explorer = document.querySelector("[data-invention-explorer]");
  const sourcePaths = window.RESIDENT_INVENTOR_PATHS;
  if (!explorer || !Array.isArray(sourcePaths)) return;

  // Keep the model first; dated projects run newest to oldest. Undated
  // histories retain their existing relative order after dated projects.
  const paths = sourcePaths.slice().sort((a, b) => {
    if (Boolean(a.base) !== Boolean(b.base)) return a.base ? -1 : 1;
    return (b.updatedAt || "").localeCompare(a.updatedAt || "");
  });

  const tabs = explorer.querySelector(".ri-tabs");
  const panel = explorer.querySelector(".ri-panel");
  const intro = explorer.querySelector(".ri-panel-intro");
  const graph = explorer.querySelector(".ri-graph");
  const insight = explorer.querySelector(".ri-insight");
  const kindNames = {
    field: "Field",
    collision: "Collision",
    ding: "Ding 💡",
    form: "Form",
    reality: "Reality",
    dormant: "Dormant",
    note: "Record note"
  };

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function renderNode(item, index) {
    const li = element("li", `ri-node ri-node--${item.kind}`);
    const marker = element("span", "ri-node-marker", String(index + 1).padStart(2, "0"));
    marker.setAttribute("aria-hidden", "true");
    const body = element("div", "ri-node-body");
    body.append(element("p", "ri-node-kind", item.stateLabel || kindNames[item.kind] || item.kind));
    body.append(element("h4", "ri-node-title", item.title));
    if (item.quote) body.append(element("blockquote", "ri-node-quote", `“${item.quote.replace(/^“|”$/g, "")}”`));
    if (item.text) body.append(element("p", "ri-node-text", item.text));
    li.append(marker, body);
    return li;
  }

  function renderSequence(nodes, className) {
    const shell = element("div", "ri-sequence-shell");
    const hint = element("p", "ri-scroll-hint", "History continues → scroll");
    hint.setAttribute("aria-hidden", "true");
    const list = element("ol", `ri-sequence ${className || ""}`.trim());
    nodes.forEach((item, index) => list.append(renderNode(item, index)));
    shell.append(hint, list);

    function updateHint() {
      const overflows = list.scrollWidth > list.clientWidth + 2;
      const atEnd = list.scrollLeft + list.clientWidth >= list.scrollWidth - 4;
      hint.hidden = !overflows;
      hint.textContent = atEnd ? "End of this path" : "History continues → scroll";
      shell.classList.toggle("is-at-end", atEnd);
    }

    list.addEventListener("scroll", updateHint, { passive: true });
    requestAnimationFrame(updateHint);
    return shell;
  }

  function renderBase(path) {
    const field = element("section", "ri-field-environment");
    field.setAttribute("aria-label", "The Field and an emerging active invention path");
    const fieldHeader = element("div", "ri-field-environment-header");
    const title = element("h3", "", "The Field");
    const detail = element("p", "", "Most of what is here may never need to leave.");
    fieldHeader.append(title, detail);

    const fragments = element("ul", "ri-field-fragments");
    ["observation", "old idea", "question", "experience", "unfinished project", "learned skill", "constraint", "strange connection"].forEach((fragment) => {
      fragments.append(element("li", "", fragment));
    });

    const emergence = element("div", "ri-emergence");
    const collision = element("article", "ri-base-collision");
    const inputs = element("div", "ri-collision-inputs");
    inputs.append(element("span", "", "something retained"), element("span", "", "something newly available"));
    const collisionBody = element("div", "ri-base-phase");
    collisionBody.append(element("p", "ri-node-kind", "Event within the Field"));
    collisionBody.append(element("h4", "", path.nodes[1].title));
    collisionBody.append(element("p", "", path.nodes[1].text));
    collision.append(inputs, collisionBody);

    const activeLabel = element("p", "ri-active-label", "A temporary active path becomes perceptible");
    const activePath = element("div", "ri-base-active-path");
    path.nodes.slice(2, 5).forEach((item) => {
      const phase = element("article", `ri-base-phase ri-base-phase--${item.kind}`);
      phase.append(element("p", "ri-node-kind", item.kind === "ding" ? "Detected signal" : kindNames[item.kind]));
      phase.append(element("h4", "", item.title));
      phase.append(element("p", "", item.text));
      activePath.append(phase);
    });

    const returnLine = element("div", "ri-base-return");
    returnLine.innerHTML = '<span aria-hidden="true">↘</span><div><strong>Joins the Field again</strong><p>Changed, redirected, dormant, expanded, or available for another collision.</p></div>';

    emergence.append(collision, activeLabel, activePath, returnLine);
    field.append(fieldHeader, fragments, emergence);
    graph.append(field);
  }

  function renderLoops(path) {
    path.loops.forEach((loop, loopIndex) => {
      const section = element("section", `ri-loop${loop.featured ? " ri-loop--featured" : ""}`);
      section.setAttribute("aria-labelledby", `${path.id}-loop-${loopIndex}`);
      const heading = element("h3", "ri-loop-label");
      const numberedLoop = loop.label.match(/^(Loop \w+)\s*·\s*(.+)$/i);
      if (numberedLoop) {
        heading.append(element("span", "ri-loop-number", numberedLoop[1]), document.createTextNode(" "));
        heading.append(element("span", "ri-loop-name", numberedLoop[2]));
      } else heading.textContent = loop.label;
      heading.id = `${path.id}-loop-${loopIndex}`;
      section.append(heading, renderSequence(loop.nodes));
      if (loop.caption) section.append(element("p", "ri-loop-caption", loop.caption));
      if (loop.branch) {
        const targetIndex = paths.findIndex((candidate) => candidate.id === loop.branch.project);
        const branch = element("div", "ri-branch");
        branch.append(element("p", "ri-node-text", loop.branch.text));
        if (targetIndex !== -1) {
          const control = element("button", "ri-branch-control", loop.branch.label);
          control.type = "button";
          control.setAttribute("aria-label", `Switch to ${paths[targetIndex].title}, a separate invention`);
          control.addEventListener("click", () => {
            selectPath(targetIndex, true);
            panel.scrollIntoView({ block: "start" });
          });
          branch.append(control);
        } else branch.append(element("p", "ri-node-title", loop.branch.label));
        section.append(branch);
      }
      if (path.implicitReturns !== false && loopIndex < path.loops.length - 1) {
        const recur = element("div", "ri-recursion");
        recur.innerHTML = '<span aria-hidden="true">↩</span><strong>Back in the Field</strong><span>Later, a different collision begins another active loop.</span>';
        section.append(recur);
      }
      graph.append(section);
    });
  }

  function selectPath(index, moveFocus) {
    const path = paths[index];
    const buttons = Array.from(tabs.querySelectorAll('[role="tab"]'));
    buttons.forEach((button, buttonIndex) => {
      const selected = buttonIndex === index;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && moveFocus) button.focus();
    });

    panel.setAttribute("aria-labelledby", `ri-tab-${path.id}`);
    intro.replaceChildren();
    const heading = element("h3", "", path.title);
    const summary = element("p", "", path.summary);
    intro.append(heading, summary);
    graph.replaceChildren();
    graph.classList.toggle("ri-graph--base", Boolean(path.base));
    path.base ? renderBase(path) : renderLoops(path);
    insight.textContent = path.insight;
  }

  paths.forEach((path, index) => {
    const button = element("button", "ri-tab", path.label);
    button.type = "button";
    button.id = `ri-tab-${path.id}`;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", "invention-path-panel");
    button.addEventListener("click", () => selectPath(index, false));
    button.addEventListener("keydown", (event) => {
      let next = index;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % paths.length;
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") next = (index - 1 + paths.length) % paths.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = paths.length - 1;
      else return;
      event.preventDefault();
      selectPath(next, true);
    });
    tabs.append(button);
  });

  panel.id = "invention-path-panel";
  selectPath(0, false);
})();

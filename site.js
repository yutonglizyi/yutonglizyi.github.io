(function () {
  const data = window.siteContent || {};

  const fallback = {
    name: "Your Name",
    nameShort: "Personal Homepage",
    kicker: "Academic Profile",
    role: "Your identity or position",
    oneLine: "A concise one-sentence introduction will go here."
  };

  function value(key) {
    const raw = data[key];
    return typeof raw === "string" && raw.trim() ? raw.trim() : fallback[key] || "";
  }

  function setText(selector, text) {
    document.querySelectorAll(selector).forEach((node) => {
      node.textContent = text;
    });
  }

  function cleanArray(items) {
    return Array.isArray(items) ? items.filter(Boolean) : [];
  }

  function hasText(text) {
    return typeof text === "string" && text.trim().length > 0;
  }

  function makeElement(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (hasText(text)) node.textContent = text.trim();
    return node;
  }

  function makeLink(label, href) {
    if (!hasText(label) || !hasText(href)) return null;
    const rawHref = href.trim();
    const link = document.createElement("a");
    link.href = rawHref;
    link.textContent = label.trim();
    if (/^https?:\/\//.test(rawHref) || /\.pdf(?:[?#].*)?$/i.test(rawHref)) {
      link.target = "_blank";
      link.rel = "noopener";
    }
    return link;
  }

  function appendInlineContent(node, text) {
    const pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        node.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      const link = makeLink(match[1], match[2]);
      if (link) {
        node.appendChild(link);
      } else {
        node.appendChild(document.createTextNode(match[0]));
      }

      lastIndex = pattern.lastIndex;
    }

    if (lastIndex < text.length) {
      node.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
  }

  function makeContactIcon(type) {
    const icon = document.createElement("span");
    icon.className = "contact-icon";
    icon.setAttribute("aria-hidden", "true");
    const paths = {
      email: '<path d="M4 6h16v12H4z"/><path d="m4 7 8 6 8-6"/>',
      location: '<path d="M12 21s7-5.4 7-12a7 7 0 0 0-14 0c0 6.6 7 12 7 12z"/><path d="M12 9.5h.01"/>',
      affiliation: '<path d="M4 21h16"/><path d="M6 21V9l6-4 6 4v12"/><path d="M9 21v-7h6v7"/>',
      link: '<path d="M10 13a5 5 0 0 0 7.1 0l1.4-1.4a5 5 0 0 0-7.1-7.1L10.6 5"/><path d="M14 11a5 5 0 0 0-7.1 0l-1.4 1.4a5 5 0 0 0 7.1 7.1l.8-.8"/>'
    };
    icon.innerHTML = `<svg viewBox="0 0 24 24" focusable="false">${paths[type] || paths.link}</svg>`;
    return icon;
  }

  function renderParagraphs(containerId, paragraphs, placeholder) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const content = cleanArray(paragraphs).filter(hasText);
    if (content.length === 0) {
      container.appendChild(makeElement("p", "empty-state", placeholder));
      return;
    }

    content.forEach((paragraph) => {
      const node = makeElement("p");
      appendInlineContent(node, paragraph);
      container.appendChild(node);
    });
  }

  function renderKeywords() {
    const container = document.getElementById("keywords");
    if (!container) return;
    container.innerHTML = "";

    const keywords = cleanArray(data.keywords).filter(hasText);
    keywords.forEach((keyword) => {
      container.appendChild(makeElement("li", "", keyword));
    });

    container.hidden = keywords.length === 0;
  }

  function renderContact() {
    const container = document.getElementById("connect-list");
    if (!container) return;
    container.innerHTML = "";

    const contact = data.contact || {};
    const rows = [
      { type: "location", text: contact.location },
      { type: "affiliation", text: contact.affiliation },
      { type: "email", text: contact.email, href: hasText(contact.email) ? `mailto:${contact.email}` : "" },
      ...cleanArray(data.links).map((link) => ({
        type: "link",
        text: link.label,
        href: link.href
      }))
    ].filter((row) => hasText(row.text));

    if (rows.length === 0) {
      container.appendChild(makeElement("li", "connect-item empty-state", "Content pending."));
      return;
    }

    rows.forEach((row) => {
      const item = makeElement("li", "connect-item");
      item.appendChild(makeContactIcon(row.type));

      const content = makeElement("span", "connect-text");
      if (hasText(row.href)) {
        const link = makeLink(row.text, row.href);
        if (link) content.appendChild(link);
      } else {
        appendInlineContent(content, row.text.trim());
      }

      item.appendChild(content);
      container.appendChild(item);
    });
  }

  function renderExternalLinks() {
    const container = document.getElementById("external-links");
    if (!container) return;
    container.innerHTML = "";

    const links = cleanArray(data.links)
      .map((link) => makeLink(link.label, link.href))
      .filter(Boolean);

    links.forEach((link) => container.appendChild(link));

    if (links.length === 0) {
      container.appendChild(makeElement("span", "empty-state", "Content pending."));
    }
  }

  function itemLinks(links) {
    const validLinks = cleanArray(links)
      .map((link) => makeLink(link.label, link.href))
      .filter(Boolean);

    if (validLinks.length === 0) return null;

    const group = makeElement("div", "item-links");
    validLinks.forEach((link) => group.appendChild(link));
    return group;
  }

  function renderPublications() {
    const container = document.getElementById("publication-list");
    if (!container) return;
    container.innerHTML = "";

    const items = cleanArray(data.publications).filter((item) => hasText(item.title));
    if (items.length === 0) {
      renderEmptyItem(container, "Publication entries will appear here.");
      return;
    }

    items.forEach((item) => {
      const li = makeElement("li");
      const body = makeElement("article");

      if (hasText(item.authors)) {
        body.appendChild(makeElement("p", "publication-authors", item.authors));
      }

      body.appendChild(makeElement("h3", "publication-title", item.title));

      const venueParts = [item.venue, item.year, item.note].filter(hasText);
      if (venueParts.length) {
        body.appendChild(makeElement("p", "publication-venue", venueParts.join(", ")));
      }

      const links = itemLinks(item.links);
      if (links) body.appendChild(links);

      li.appendChild(body);
      container.appendChild(li);
    });
  }

  function renderTalks() {
    const container = document.getElementById("talk-list");
    if (!container) return;
    container.innerHTML = "";

    const items = cleanArray(data.talks).filter((item) => hasText(item.title));
    if (items.length === 0) {
      renderEmptyItem(container, "Talk entries will appear here.");
      return;
    }

    items.forEach((item) => {
      const li = makeElement("li");
      const body = makeElement("article");
      body.appendChild(makeElement("h3", "item-title", item.title));

      const metaParts = [item.event, item.place, item.date].filter(hasText);
      if (metaParts.length) body.appendChild(makeElement("p", "item-meta", metaParts.join(" · ")));

      const links = itemLinks(item.links);
      if (links) {
        body.appendChild(links);
      } else {
        const link = makeLink(item.linkLabel || "Slides", item.link);
        if (link) {
          const group = makeElement("div", "item-links");
          group.appendChild(link);
          body.appendChild(group);
        }
      }

      li.appendChild(body);
      container.appendChild(li);
    });
  }

  function renderAwards() {
    const container = document.getElementById("award-list");
    if (!container) return;
    container.innerHTML = "";

    const items = cleanArray(data.awards).filter((item) => hasText(item.title));
    if (items.length === 0) {
      renderEmptyItem(container, "Award entries will appear here.");
      return;
    }

    items.forEach((item) => {
      const li = makeElement("li");
      const body = makeElement("article");
      const title = hasText(item.year) ? `${item.title}, ${item.year}.` : item.title;
      body.appendChild(makeElement("h3", "item-title", title));

      if (hasText(item.organization)) {
        body.appendChild(makeElement("p", "item-note", `Awarded by ${item.organization}.`));
      }
      if (hasText(item.note)) body.appendChild(makeElement("p", "item-note", item.note));

      const links = itemLinks(item.links);
      if (links) body.appendChild(links);

      li.appendChild(body);
      container.appendChild(li);
    });
  }

  function renderEmptyItem(container, text) {
    const li = makeElement("li");
    const body = makeElement("article");
    body.appendChild(makeElement("p", "empty-state", text));
    li.appendChild(body);
    container.appendChild(li);
  }

  function renderPhoto() {
    const image = document.getElementById("profile-photo");
    if (!image) return;

    const photo = data.photo || {};
    if (hasText(photo.src)) image.src = photo.src.trim();
    if (hasText(photo.alt)) image.alt = photo.alt.trim();
  }

  function renderPage() {
    setText("[data-field='name']", value("name"));
    setText("[data-field='nameShort']", value("nameShort"));
    setText("[data-field='kicker']", value("kicker"));
    setText("[data-field='role']", value("role"));
    setText("[data-field='oneLine']", value("oneLine"));
    document.title = value("name") === fallback.name ? "Personal Homepage" : value("name");

    renderPhoto();
    renderParagraphs("about-copy", data.about, "Content pending.");
    renderParagraphs("about-me-copy", data.aboutMe, "Content pending.");
    renderKeywords();
    renderContact();
    renderExternalLinks();
    renderPublications();
    renderTalks();
    renderAwards();
  }

  renderPage();
})();

import axios from "axios";
import { htmlToText } from "html-to-text";
import { EXTERNAL_BASE_URL } from "../config/env.js";

// Strip HTML to plain text with fallback
export const stripHtmlToText = (html) => {
  if (typeof html !== "string") return "";
  try {
    return htmlToText(html, {
      wordwrap: false,
      selectors: [
        { selector: "a", options: { ignoreHref: true } },
        { selector: "img", format: "skip" },
      ],
    }).trim();
  } catch (e) {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
};

// Extract material HTML from common fields
export const extractMaterialHtml = (tutorial) => {
  if (!tutorial || typeof tutorial !== "object") return "";
  const candidates = [];
  const possibleFields = [
    "content",
    "html",
    "body",
    "material",
    "description_html",
    "descriptionHtml",
    "description",
    "article",
    "markdown",
    "text",
  ];
  for (const key of possibleFields) {
    const v = tutorial[key];
    if (typeof v === "string" && v.trim()) candidates.push(v);
  }
  if (tutorial.data) {
    const dv =
      tutorial.data.content || tutorial.data.html || tutorial.data.body;
    if (typeof dv === "string" && dv.trim()) candidates.push(dv);
  }
  const arrFields = ["sections", "parts", "items"];
  for (const k of arrFields) {
    const arr = tutorial[k];
    if (Array.isArray(arr) && arr.length) {
      const joined = arr
        .map((it) =>
          typeof it === "string"
            ? it
            : typeof it?.html === "string"
            ? it.html
            : typeof it?.content === "string"
            ? it.content
            : typeof it?.text === "string"
            ? it.text
            : ""
        )
        .filter(Boolean)
        .join("\n\n");
      if (joined.trim()) candidates.push(joined);
    }
  }
  return candidates.find((c) => c && c.trim()) || "";
};

// Fallback fetch of page HTML
export const fetchPageHtmlFallback = async (tutorialId) => {
  const possiblePaths = [
    `/tutorials/${encodeURIComponent(tutorialId)}`,
    `/tutorial/${encodeURIComponent(tutorialId)}`,
  ];
  for (const p of possiblePaths) {
    const url = `${EXTERNAL_BASE_URL.replace(/\/$/, "")}${p}`;
    try {
      const { data, headers } = await axios.get(url, { timeout: 15000 });
      const ct = headers["content-type"] || "";
      if (typeof data === "string" && /text\/html/i.test(ct)) {
        return { html: data, url };
      }
      if (typeof data === "string" && data.includes("</html>")) {
        return { html: data, url };
      }
    } catch (e) {
      // continue
    }
  }
  return { html: "", url: null };
};

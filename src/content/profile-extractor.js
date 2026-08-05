import { LIMITS } from "../shared/constants.js";

const NOISE_PATTERNS = [
  /status is (?:online|offline)/i,
  /people you may know/i,
  /more profiles for you/i,
  /recommendation transparency/i,
  /manage your account and privacy/i,
  /questions\? visit our help center/i,
  /select language/i,
  /linkedin corporation ©/i,
  /^messaging$/i,
  /^reactions$/i,
];

export function normalizeVisibleText(text) {
  const uniqueLines = new Set();
  return String(text || "")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(
      (line) => line && !NOISE_PATTERNS.some((pattern) => pattern.test(line)),
    )
    .filter((line) => {
      const key = line.toLowerCase();
      if (uniqueLines.has(key)) return false;
      uniqueLines.add(key);
      return true;
    })
    .join("\n")
    .slice(0, LIMITS.PROFILE_CHARACTERS);
}

function textFromFirst(root, selectors) {
  for (const selector of selectors) {
    const value = root.querySelector(selector)?.textContent?.trim();
    if (value) return value;
  }
  return "";
}

export function extractProfileData(root = document) {
  const main =
    root.querySelector("main") || root.querySelector(".scaffold-layout__main");
  if (!main)
    throw new Error("The main LinkedIn profile content was not found.");

  const name = textFromFirst(root, [
    "h1.text-heading-xlarge",
    ".pv-text-details__left-panel h1",
    "main h1",
  ]);
  const headline = textFromFirst(root, [
    ".text-body-medium.break-words",
    ".pv-text-details__left-panel .text-body-medium",
  ]);
  const fullText = normalizeVisibleText(main.innerText || main.textContent);

  if (!name && fullText.length < 100)
    throw new Error("This profile has not finished loading.");

  return { name, headline, fullText, extractedCharacters: fullText.length };
}

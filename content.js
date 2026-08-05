/**
 * AI Outreach Assistant content script.
 * Extracts visible profile text only after the popup explicitly requests it.
 */

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extractProfile") {
    try {
      const data = extractProfileData();
      sendResponse({ success: true, data: data });
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  // Return true to indicate asynchronous response
  return true;
});

/**
 * Extracts and sanitizes all visible text from the main profile container.
 */
function extractProfileData() {
  // 1. Extract Name
  const nameEl = document.querySelector('h1.text-heading-xlarge') ||
                 document.querySelector('.text-heading-xlarge') ||
                 document.querySelector('h1');
  const name = nameEl ? nameEl.innerText.trim() : '';

  // 2. Extract Headline
  const headlineEl = document.querySelector('.text-body-medium') ||
                     document.querySelector('.pv-text-details__left-panel .text-body-medium');
  const headline = headlineEl ? headlineEl.innerText.trim() : '';

  // 3. Extract the entire main profile container content (including posts, experience, details)
  const mainContent = document.querySelector('main') || document.querySelector('.scaffold-layout__main') || document.body;
  let fullCleanedText = "";

  if (mainContent) {
    // Split by newlines to filter line-by-line
    const lines = mainContent.innerText.split('\n');
    const cleanedLines = [];
    let consecutiveBlanks = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.length === 0) {
        consecutiveBlanks++;
        if (consecutiveBlanks <= 1) {
          cleanedLines.push("");
        }
      } else {
        consecutiveBlanks = 0;

        // Filter out common LinkedIn system/UI boilerplate to save tokens and avoid noise
        const lowerLine = line.toLowerCase();
        if (
          !lowerLine.includes("status is online") &&
          !lowerLine.includes("status is offline") &&
          !lowerLine.includes("messaging") &&
          !lowerLine.includes("compose message") &&
          !lowerLine.includes("people you may know") &&
          !lowerLine.includes("more profiles for you") &&
          !lowerLine.includes("explore premium profiles") &&
          !lowerLine.includes("linkedin corporation ©") &&
          !lowerLine.includes("about accessibility talent solutions") &&
          !lowerLine.includes("recommendation transparency") &&
          !lowerLine.includes("manage your account and privacy") &&
          !lowerLine.includes("questions? visit our help center") &&
          !lowerLine.includes("select language") &&
          !lowerLine.includes("try premium for") &&
          !lowerLine.includes("show translation") &&
          !lowerLine.includes("report this post") &&
          !lowerLine.includes("view my website") &&
          !lowerLine.includes("reactions")
        ) {
          cleanedLines.push(line);
        }
      }
    }

    fullCleanedText = cleanedLines.join('\n').trim();
  }

  return {
    name: name,
    headline: headline,
    fullText: fullCleanedText
  }
}

import { extractProfileData } from "./profile-extractor.js";

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action !== "extractProfile") return false;

  try {
    sendResponse({ success: true, data: extractProfileData() });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
  return true;
});

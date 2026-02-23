Phase 1: Injection Logic
Target: The #subscribe-button or #top-row on the YouTube watch page.

Mechanism: Use a MutationObserver in your content script. YouTube is a Single Page Application (SPA), so the button needs to be re-injected every time you click a new video without refreshing the page.

Phase 2: The Copy Flow
Trigger: Click the new icon.

Extraction: Find the captionTracks from the page source (as discussed).

Clipboard: Use the navigator.clipboard.writeText API.

Phase 3: The "Toast" Alert
UI: Instead of a standard browser alert() (which is ugly and stops the video), we will inject a small, stylish div at the top center that fades in and out.

📝 Task List for your Coding Tool (Vibe-Ready)
🟩 Task 1: Manifest Configuration
[ ] Create manifest.json (MV3).

[ ] Permissions: clipboardWrite, scripting.

[ ] Host Permissions: https://*.youtube.com/*.

[ ] Define content_scripts to run on https://www.youtube.com/watch*.

🟩 Task 2: UI Injection (The Button)
[ ] Create content.js.

[ ] Implement a MutationObserver to watch for the #subscribe-button.

[ ] Create a button element with a "Copy" icon (use a simple SVG).

[ ] Style the button to match YouTube's "Glow" or "Secondary" button style.

[ ] Inject it to the left or right of the Subscribe button.

🟩 Task 3: Extraction Logic
[ ] Function fetchTranscript():

[ ] Get current URL.

[ ] Fetch page source.

[ ] Extract captionTracks URL.

[ ] Fetch XML, strip tags, and return clean text.

🟩 Task 4: The Alert System (Toast)
[ ] Function showToast(message, type):

[ ] Create a div styled with: position: fixed, top: 20px, left: 50%, transform: translateX(-50%).

[ ] Add background (dark gray/white), rounded corners, and z-index 9999.

[ ] Animate: Fade in for 0.3s, stay for 2s, fade out and remove.

🟩 Task 5: Integration
[ ] Add click event listener to the injected button.

[ ] On click: Call fetchTranscript().

[ ] On success: Copy to clipboard and call showToast("Transcript Copied!", "success").

[ ] On failure: Call showToast("No Transcript Found", "error").
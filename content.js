/* ============================================================
   YouTube Transcript Copier — Content Script
   Injects a "Copy Transcript" button, extracts caption text
   from YouTube's internal player data, and copies it to
   the clipboard.
   ============================================================ */

(() => {
    "use strict";

    // ---- Constants ----
    const EXT_ATTR = "data-yt-transcript-ext";
    const BUTTON_ID = "yt-transcript-ext-copy-btn";

    // ---- SVG Icons ----
    const ICON_CLIPBOARD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>`;
    const ICON_SPINNER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1 .25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>`;
    const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
    const ICON_ERROR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;

    // ---- Toast ----

    /**
     * Show a toast notification at the top-center of the viewport.
     * @param {string} message
     * @param {"success"|"error"} type
     */
    function showToast(message, type = "success") {
        // Remove any existing toast
        const existing = document.querySelector(".yt-transcript-ext-toast");
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.className = "yt-transcript-ext-toast" +
            (type === "error" ? " yt-transcript-ext-toast--error" : "");

        const icon = type === "success" ? ICON_CHECK : ICON_ERROR;
        toast.innerHTML = `${icon}<span>${message}</span>`;

        document.body.appendChild(toast);

        // Start fade-out after 2 s, remove after animation ends
        setTimeout(() => {
            toast.classList.add("yt-transcript-ext-toast--out");
            toast.addEventListener("animationend", () => toast.remove(), { once: true });
        }, 2000);
    }

    // ---- Transcript Extraction (via Python backend) ----

    const BACKEND_URL = "https://yt-transcript-api.onrender.com";

    /**
     * Fetch the transcript from the local Python backend.
     * The backend uses youtube-transcript-api for reliable extraction.
     * @returns {Promise<string>}
     */
    async function getTranscript() {
        const videoId = new URL(location.href).searchParams.get("v");
        if (!videoId) throw new Error("Not a YouTube video page.");

        const resp = await fetch(`${BACKEND_URL}/transcript?video_id=${videoId}`);
        const data = await resp.json();

        if (!resp.ok) throw new Error(data.error || "Backend error");
        return data.text;
    }

    // ---- Button Injection ----

    /**
     * Create the "Copy Transcript" button element.
     * @returns {HTMLButtonElement}
     */
    function createButton() {
        const btn = document.createElement("button");
        btn.id = BUTTON_ID;
        btn.className = "yt-transcript-ext-btn";
        btn.setAttribute(EXT_ATTR, "true");
        btn.setAttribute("aria-label", "Copy Transcript");
        btn.innerHTML = `${ICON_CLIPBOARD}<span>Copy Transcript</span>`;

        btn.addEventListener("click", handleClick);
        return btn;
    }

    /**
     * Handle the button click — fetch, copy, and notify.
     */
    async function handleClick() {
        const btn = document.getElementById(BUTTON_ID);
        if (!btn || btn.classList.contains("yt-transcript-ext-btn--loading")) return;

        // Set loading state
        btn.classList.add("yt-transcript-ext-btn--loading");
        btn.innerHTML = `${ICON_SPINNER}<span>Fetching…</span>`;

        try {
            const transcript = await getTranscript();
            await navigator.clipboard.writeText(transcript);
            showToast("Transcript Copied!", "success");
        } catch (err) {
            console.warn("[YT Transcript Copier]", err);
            showToast(err.message || "Failed to copy transcript", "error");
        } finally {
            // Restore button state
            if (btn) {
                btn.classList.remove("yt-transcript-ext-btn--loading");
                btn.innerHTML = `${ICON_CLIPBOARD}<span>Copy Transcript</span>`;
            }
        }
    }

    /**
     * Try to inject the button into the YouTube UI.
     * Returns true if successfully injected, false otherwise.
     * @returns {boolean}
     */
    function tryInjectButton() {
        // Don't inject if not on a watch page
        if (!location.pathname.startsWith("/watch")) return false;

        // Don't duplicate
        if (document.getElementById(BUTTON_ID)) return true;

        // Try multiple anchor points in order of preference
        const anchors = [
            // Right side of the owner bar (next to Subscribe)
            () => {
                const owner = document.querySelector("#owner");
                if (!owner) return null;
                // Look for the subscribe button container
                const subscribeBtn = owner.querySelector("#subscribe-button, ytd-subscribe-button-renderer");
                if (subscribeBtn) return subscribeBtn;
                return owner;
            },
            // Fallback: the top-row actions area
            () => document.querySelector("#top-row #actions, #menu-container"),
            // Last resort: above the fold area
            () => document.querySelector("#above-the-fold #top-row"),
        ];

        for (const getAnchor of anchors) {
            const anchor = getAnchor();
            if (anchor) {
                const btn = createButton();
                anchor.insertAdjacentElement("afterend", btn);
                return true;
            }
        }

        return false;
    }

    // ---- MutationObserver for SPA Navigation ----

    let lastUrl = location.href;
    let rafPending = false;

    function onMutation() {
        if (rafPending) return;
        rafPending = true;

        requestAnimationFrame(() => {
            rafPending = false;

            // If URL changed, the old button reference is likely stale — remove and re-inject
            if (location.href !== lastUrl) {
                lastUrl = location.href;
                const old = document.getElementById(BUTTON_ID);
                if (old) old.remove();
            }

            tryInjectButton();
        });
    }

    // Start observing
    const observer = new MutationObserver(onMutation);
    observer.observe(document.body, { childList: true, subtree: true });

    // Also try an initial injection in case the page is already loaded
    tryInjectButton();
})();

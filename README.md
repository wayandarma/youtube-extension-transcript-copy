# YouTube Transcript Copier 📋

A Chrome Extension + Python backend that copies YouTube video transcripts to your clipboard with one click.

## Architecture

```
Chrome Extension (content.js)
    │
    │  GET /transcript?video_id=xxx
    ▼
Python Backend (Flask + youtube-transcript-api)
    │
    │  Fetches captions
    ▼
YouTube Servers
```

## Project Structure

```
├── manifest.json        # Chrome Extension manifest (MV3)
├── content.js           # Injected button + backend call
├── styles.css           # YouTube-native button + toast styles
├── server.py            # Flask API server
├── requirements.txt     # Python dependencies
├── Procfile             # Render deployment command
├── render.yaml          # Render service config
└── venv/                # Local virtual environment (gitignored)
```

## Setup

### Backend (Render — Production)

The backend is deployed on Render at:
```
https://yt-transcript-api.onrender.com
```

To deploy your own:
1. Fork this repo
2. Connect it to [Render](https://render.com)
3. It will auto-detect `render.yaml` and deploy

### Backend (Local Development)

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python server.py
```

### Chrome Extension

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select this project folder
4. Navigate to any YouTube video and click **📋 Copy Transcript**

## API

### `GET /transcript`

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `video_id` | ✅ | — | YouTube video ID |
| `lang` | ❌ | `en` | Preferred language code |

**Success** `200`:
```json
{ "text": "Full transcript text here..." }
```

**Error** `404`:
```json
{ "error": "No transcript available for this video." }
```

### `GET /health`

Returns `{"status": "ok"}` — used by Render for health checks.

## Tech Stack

- **Extension**: Manifest V3, vanilla JS, CSS
- **Backend**: Python, Flask, flask-cors, youtube-transcript-api
- **Hosting**: Render (free tier)

## License

MIT

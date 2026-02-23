"""
YouTube Transcript Copier — Backend Server
Flask API that fetches YouTube transcripts using youtube-transcript-api.
Deployed on Render (free tier).
"""

import os

from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
    CouldNotRetrieveTranscript,
)

app = Flask(__name__)

# Allow requests from YouTube and localhost (dev)
CORS(app, origins=[
    "https://www.youtube.com",
    "https://youtube.com",
    "http://localhost:*",
    "http://127.0.0.1:*",
])

# youtube-transcript-api v1.x uses instance methods
ytt_api = YouTubeTranscriptApi()


@app.route("/transcript", methods=["GET"])
def get_transcript():
    """
    GET /transcript?video_id=<id>[&lang=en]

    Returns JSON: { "text": "full transcript..." }
    Errors return:  { "error": "message" } with appropriate status code.
    """
    video_id = request.args.get("video_id")
    if not video_id:
        return jsonify({"error": "Missing 'video_id' query parameter."}), 400

    lang = request.args.get("lang", "en")

    try:
        # Fetch transcript — tries requested language, falls back to English
        transcript = ytt_api.fetch(video_id, languages=[lang, "en"])

        # Join all text segments into clean plain text
        text = "\n".join(snippet.text for snippet in transcript)

        return jsonify({"text": text})

    except TranscriptsDisabled:
        return jsonify({"error": "Transcripts are disabled for this video."}), 404
    except VideoUnavailable:
        return jsonify({"error": "Video is unavailable."}), 404
    except NoTranscriptFound:
        return jsonify({"error": f"No transcript found for language '{lang}'."}), 404
    except CouldNotRetrieveTranscript as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint used by Render."""
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8765))
    debug = os.environ.get("FLASK_ENV") != "production"
    print(f"🚀 YouTube Transcript Server running on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)

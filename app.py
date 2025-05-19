
import os
from flask import Flask, request, jsonify, Response, send_from_directory
import requests
import json
from dotenv import load_dotenv

load_dotenv()

EVOAI_API_URL = "https://api-evoai.evoapicloud.com/api/v1/a2a/2757cd88-6801-429f-94b7-34867330a826"
EVOAI_API_KEY = os.getenv("EVOAI_API_KEY")

if not EVOAI_API_KEY:
    raise RuntimeError("Defina EVOAI_API_KEY no ambiente.")

app = Flask(__name__, static_folder="public", static_url_path="")

def sse_format(data: str) -> str:
    return f"data: {data}\n\n"

def evoai_stream(prompt: str):
    headers = {
        "x-api-key": EVOAI_API_KEY,
        "Content-Type": "application/json",
        "Accept": "text/event-stream"  # Importante para SSE
    }
    data = {
        "jsonrpc": "2.0",
        "id": "call-123",
        "method": "tasks/sendSubscribe",
        "params": {
            "id": "task-456",
            "sessionId": "session-789",
            "message": {
                "role": "user",
                "parts": [
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        }
    }
    try:
        response = requests.post(EVOAI_API_URL, headers=headers, json=data, stream=True)
        response.raise_for_status()

        for line in response.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data:"):
                    json_data = decoded_line[6:]  # Remover "data: "
                    yield sse_format(json_data)

    except requests.exceptions.RequestException as e:
        yield sse_format(json.dumps({"error": str(e)}))
    except Exception as e:
        yield sse_format(json.dumps({"error": "Erro desconhecido"}))


@app.post("/ask")
def ask():
    payload = request.get_json() or {}
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        return jsonify(error="Prompt vazio."), 400

    return Response(evoai_stream(prompt), mimetype="text/event-stream")


@app.post("/feedback")
def feedback():
    data = request.get_json() or {}
    app.logger.info("Feedback recebido: %s", data)
    return jsonify(message="Feedback recebido com sucesso"), 200


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def frontend(path):
    target = os.path.join(app.static_folder, path)
    if path and os.path.exists(target):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
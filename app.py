
import os
from flask import Flask, request, jsonify, send_from_directory
import requests
from dotenv import load_dotenv

load_dotenv()

EVOAI_API_URL = "https://api-evoai.evoapicloud.com/api/v1/a2a/2757cd88-6801-429f-94b7-34867330a826"
EVOAI_API_KEY = os.getenv("EVOAI_API_KEY")

if not EVOAI_API_KEY:
    raise RuntimeError("Defina EVOAI_API_KEY no ambiente.")

app = Flask(__name__, static_folder="public", static_url_path="")

@app.post("/ask")
def ask():
    payload = request.get_json() or {}
    prompt = payload.get("prompt", "").strip()
    if not prompt:
        return jsonify(error="Prompt vazio."), 400

    headers = {
        "x-api-key": EVOAI_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "text": prompt
    }

    try:
        response = requests.post(EVOAI_API_URL, headers=headers, json=data)
        response.raise_for_status()  # Raises HTTPError for bad responses (4xx or 5xx)
        answer = response.json().get("response")  # Adjust based on actual EVO AI response structure
        return jsonify(answer=answer)
    except requests.exceptions.RequestException as exc:
        app.logger.exception("Erro ao chamar a API EVO AI: %s", exc)
        return jsonify(error=str(exc)), 500
    except ValueError as exc:
        app.logger.exception("Erro ao decodificar a resposta da API EVO AI: %s", exc)
        return jsonify(error=str(exc)), 500


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
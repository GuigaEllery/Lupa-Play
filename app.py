
import os
import requests
from flask import Flask, request, jsonify, send_from_directory
from dotenv import load_dotenv

load_dotenv()

EVO_AI_URL = "https://api-evoai.evoapicloud.com/api/v1/a2a/2757cd88-6801-429f-94b7-34867330a826"
EVO_API_KEY = os.getenv("EVO_API_KEY")

if not EVO_API_KEY:
    raise RuntimeError("Defina EVO_API_KEY no ambiente.")

app = Flask(__name__, static_folder="public")

@app.route("/ask", methods=["POST"])
def ask_agent():
    data = request.get_json()
    user_message = data.get("message")

    if not user_message:
        return jsonify({"error": "Mensagem não fornecida"}), 400

    headers = {
        "Content-Type": "application/json",
        "x-api-key": EVO_API_KEY
    }

    payload = {
        "message": user_message
    }

    try:
        response = requests.post(EVO_AI_URL, headers=headers, json=payload)
        app.logger.info("Resposta bruta da EVO AI: %s", response.text)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.exceptions.RequestException as e:
        app.logger.error("Erro na requisição à EVO AI: %s", e)
        return jsonify({"error": str(e)}), 500

@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)

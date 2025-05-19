
import os, json, uuid, requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

EVO_AI_URL = "https://api-evoai.evoapicloud.com/api/v1/a2a/2757cd88-6801-429f-94b7-34867330a826"
EVO_API_KEY = os.environ.get("EVO_API_KEY")

if not EVO_API_KEY:
    raise RuntimeError("Defina a variável de ambiente EVO_API_KEY no Render")

HEADERS = {
    "Content-Type": "application/json",
    "x-api-key": EVO_API_KEY
}

app = Flask(__name__, static_folder="public")
CORS(app)

def call_evo_ai(message:str)->str:
    """Envia a pergunta para o agente EVO AI via tasks/send
    e devolve o texto da resposta."""
    payload = {
        "jsonrpc": "2.0",
        "id": f"call-{uuid.uuid4()}",
        "method": "tasks/send",
        "params": {
            "id": f"task-{uuid.uuid4()}",
            "sessionId": f"session-{uuid.uuid4()}",
            "message": {
                "role": "user",
                "parts": [
                    {"type": "text", "text": message}
                ]
            }
        }
    }
    resp = requests.post(EVO_AI_URL, headers=HEADERS, data=json.dumps(payload), timeout=60)
    resp.raise_for_status()
    resp_json = resp.json()
    try:
        text = resp_json["result"]["status"]["message"]["parts"][0]["text"]
    except (KeyError, IndexError):
        text = json.dumps(resp_json)  # devolve bruto em caso inesperado
    return text

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json() or {}
    user_msg = data.get("message") or data.get("prompt") or ""
    if not user_msg:
        return jsonify({"error": "Mensagem vazia"}), 400
    try:
        answer = call_evo_ai(user_msg)
        return jsonify({"text": answer})
    except Exception as e:
        app.logger.error("Erro EVO AI: %s", e)
        return jsonify({"error": str(e)}), 500

# arquivos estáticos (single‑page)
@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def static_files(path):
    return send_from_directory(app.static_folder, path)


import os, json, uuid, requests
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

WATCHMODE_API_KEY = os.environ.get("WATCHMODE_API_KEY")
EVO_API_KEY = os.environ.get("EVO_API_KEY")
EVO_AI_URL = "https://api-evoai.evoapicloud.com/api/v1/a2a/2757cd88-6801-429f-94b7-34867330a826"

if not WATCHMODE_API_KEY or not EVO_API_KEY:
    raise RuntimeError("Defina as variáveis WATCHMODE_API_KEY e EVO_API_KEY no ambiente")

HEADERS_EVO = {
    "Content-Type": "application/json",
    "x-api-key": EVO_API_KEY
}
WATCHMODE_BASE = "https://api.watchmode.com/v1"

app = Flask(__name__, static_folder="public")
CORS(app)

def call_evo_ai(message:str)->str:
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
    resp = requests.post(EVO_AI_URL, headers=HEADERS_EVO, data=json.dumps(payload), timeout=60)
    resp.raise_for_status()
    resp_json = resp.json()
    try:
        return resp_json["result"]["status"]["message"]["parts"][0]["text"]
    except (KeyError, IndexError):
        return json.dumps(resp_json)

def search_title_on_watchmode(query):
    search_url = f"{WATCHMODE_BASE}/search/"
    params = {
        "apiKey": WATCHMODE_API_KEY,
        "search_field": "name",
        "search_value": query
    }
    res = requests.get(search_url, params=params)
    res.raise_for_status()
    results = res.json().get("title_results", [])
    return results[0] if results else None

def get_sources_for_title(title_id):
    url = f"{WATCHMODE_BASE}/title/{title_id}/sources/"
    params = {"apiKey": WATCHMODE_API_KEY}
    res = requests.get(url, params=params)
    res.raise_for_status()
    return res.json()

@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json() or {}
    user_msg = data.get("message") or ""
    if not user_msg:
        return jsonify({"error": "Mensagem vazia"}), 400
    try:
        evo_response = call_evo_ai(user_msg)

        title = search_title_on_watchmode(user_msg)
        if title:
            sources = get_sources_for_title(title["id"])
            stream_list = [
                f"{s['name']} ({'assinatura' if s['type'] == 'sub' else 'aluguel'})"
                for s in sources if s['region'] == 'BR'
            ]
            if stream_list:
                evo_response += "\n\n📺 Plataformas disponíveis no Brasil:\n- " + "\n- ".join(stream_list)
            else:
                evo_response += f"\n\n⚠️ O título '{title['name']}' não está disponível no Brasil no momento."
        else:
            evo_response += f"\n\n🔍 Nenhum resultado encontrado nas plataformas de streaming para: '{user_msg}'."

        return jsonify({ "text": evo_response })
    except Exception as e:
        app.logger.error("Erro geral: %s", e)
        return jsonify({"error": str(e)}), 500

@app.route("/", defaults={"path": "index.html"})
@app.route("/<path:path>")
def serve_static(path):
    return send_from_directory(app.static_folder, path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)

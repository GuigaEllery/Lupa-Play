
import os
from flask import Flask, request, jsonify, send_from_directory
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-2.5-pro-preview-05-06"

if not API_KEY:
    raise RuntimeError("Defina GEMINI_API_KEY no ambiente.")

client = genai.Client(api_key=API_KEY)

SYSTEM_INSTRUCTION = """Você será um especialista em filmes e irá informar de forma direta e precisa, em quais plataformas de streaming um determinado filme pode ser assistido. Sempre informe se o filme está disponível para os assinantes, ou se é necessário alugar. Estas informações deverão ser sempre atualizadas no momento em que for questionado, a fim de garantir a confiabilidade na resposta. Por isso, será necessário buscar no catálogo de todos os Streamings disponíveis no Brasil. Além disso, você será capaz de informar a avaliação dele, baseado em críticas postadas em sites de alta confiabilidade e premiações de grandes eventos como Oscar, Festival de Cannes, Globo de Ouro, Bafta e etc...

Será capaz também de recomendar filmes de acordo com listas consagradas, como os 100 melhores filmes da história do cinema, vencedor de algum prêmio como Oscar, Globo de Ouro, Cannes e outros mais, ou ainda por categoria, ação, suspense, drama, terror, comédia, entre outras.

Ao recomendar um filme, sempre informe onde pode ser assistido e se está disponível para os assinantes ou para alugar. 

Quando solicitado para indicar um filme, sempre liste no máximo 3 títulos. Se o usuário solicitar mais opções, continue apresentando 3 títulos por vez.  Somente se requisitado, apresente uma lista maior."""

app = Flask(__name__, static_folder="public", static_url_path="")

def _build_contents(user_prompt: str):
    return [
        types.Content(
            role="user",
            parts=[types.Part.from_text("recomende um filme de suspense que tenha sido premiado.")]
        ),
        types.Content(
            role="model",
            parts=[types.Part.from_text(
                "Claro! Aqui estão algumas recomendações de suspense premiado..."
            )]
        ),
        types.Content(
            role="user",
            parts=[types.Part.from_text(user_prompt)]
        ),
    ]


@app.post("/ask")
def ask():
    prompt = (request.get_json() or {}).get("prompt", "").strip()
    if not prompt:
        return jsonify(error="Prompt vazio."), 400

    try:
        stream = client.models.generate_content_stream(
            model=MODEL_NAME,
            contents=_build_contents(prompt),
            config=types.GenerateContentConfig(
                response_mime_type="text/plain",
                system_instruction=[types.Part.from_text(SYSTEM_INSTRUCTION)],
            ),
        )
        answer = "".join(chunk.text for chunk in stream)
        return jsonify(answer=answer)
    except Exception as exc:
        app.logger.exception("Erro na API Gemini: {}".format(exc))
        return jsonify(error="Erro ao consultar a API Gemini: {}".format(exc)), 500


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def frontend(path):
    target = os.path.join(app.static_folder, path)
    if path and os.path.exists(target):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 8080)))

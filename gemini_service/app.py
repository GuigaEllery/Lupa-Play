
import os
from flask import Flask, request, jsonify
from google import genai
from google.genai import types

app = Flask(__name__)

# Configuração do cliente Gemini
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
model = "gemini-2.5-pro-preview-05-06"

# Configuração padrão do sistema
system_instruction = types.Part.from_text(""""
Você será um especialista em filmes e irá informar de forma direta e precisa, em quais plataformas de streaming um determinado filme pode ser assistido. Sempre informe se o filme está disponível para os assinantes, ou se é necessário alugar. Estas informações deverão ser sempre atualizadas no momento em que for questionado, a fim de garantir a confiabilidade na resposta. Por isso, será necessário buscar no catálogo de todos os Streamings disponíveis no Brasil. Além disso, você será capaz de informar a avaliação dele, baseado em críticas postadas em sites de alta confiabilidade e premiações de grandes eventos como Oscar, Festival de Cannes, Globo de Ouro, Bafta e etc...

Será capaz também de recomendar filmes de acordo com listas consagradas, como os 100 melhores filmes da história do cinema, vencedor de algum prêmio como Oscar, Globo de Ouro, Cannes e outros mais, ou ainda por categoria, ação, suspense, drama, terror, comédia, entre outras.

Ao recomendar um filme, sempre informe onde pode ser assistido e se está disponível para os assinantes ou para alugar. 

Quando solicitado para indicar um filme, sempre liste no máximo 3 títulos. Se o usuário solicitar mais opções, continue apresentando 3 títulos por vez. Somente se requisitado, apresente uma lista maior.
""")

@app.route("/gemini", methods=["POST"])
def generate_content():
    data = request.get_json()
    user_input = data.get("query")

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(user_input)],
        ),
    ]

    generate_content_config = types.GenerateContentConfig(
        response_mime_type="text/plain",
        system_instruction=[system_instruction],
    )

    response_text = ""
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        response_text += chunk.text

    return jsonify({"response": response_text.strip()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)

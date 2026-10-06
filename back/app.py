from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route("/")
def inicio():
    return jsonify({
        "mensagem": "Backend do Taxidog funcionando!"
    })


@app.route("/usuarios", methods=["POST"])
def criar_usuario():
    dados = request.json

    print("Usuário recebido:", dados)

    return jsonify({
        "mensagem": "Usuário recebido com sucesso!",
        "usuario": dados
    })


if __name__ == "__main__":
    app.run(debug=True)
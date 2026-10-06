<<<<<<< HEAD
=======

>>>>>>> 295c0d25df77d932429d4b14210a85c568f5f7d2
from flask import Flask, jsonify, request

app = Flask(__name__)

<<<<<<< HEAD

=======
>>>>>>> 295c0d25df77d932429d4b14210a85c568f5f7d2
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
<<<<<<< HEAD
    app.run(debug=True)
=======
    app.run(debug=True)
>>>>>>> 295c0d25df77d932429d4b14210a85c568f5f7d2

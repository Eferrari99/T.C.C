from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def inicio():
    return jsonify({
        "mensagem": "Backend do Taxidog funcionando!"
    })

if __name__ == "__main__":
    app.run(debug=True)
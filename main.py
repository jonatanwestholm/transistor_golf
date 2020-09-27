from flask import Flask
from flask import make_response, request
from flask_cors import CORS

import circuit

app = Flask(__name__)
CORS(app)

@app.route("/ec", methods=["GET", "POST"])
def evaluate_circuit():
    resp = circuit.evaluate_circuit(request.json)
    return ""

if __name__ == '__main__':
    app.run()
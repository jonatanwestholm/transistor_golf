from flask import Flask
from flask import make_response, request, render_template
from flask_cors import CORS

import circuit

app = Flask(__name__)
CORS(app)

@app.route("/")
def main():
    return render_template("index.html")

@app.route("/ec", methods=["GET", "POST"])
def evaluate_circuit():
    resp = circuit.evaluate_circuit(request.json)
    return resp

@app.route("/hcr", methods=["GET", "POST"])
def highlight_connected_region():
    resp = circuit.get_connected_region(request.json)
    return resp

@app.route("/transistor_golf.js", methods=["GET"])
def tgolf():
    response = make_response(open("transistor_golf.js","r").read())
    return response

@app.route("/sprites/<string:filename>", methods=["GET"])
def get_sprite(filename):
    response = make_response(open("sprites/{0:s}".format(filename),"rb").read())
    response.headers["Content-type"] = "image/svg+xml"
    return response

if __name__ == '__main__':
    app.run()
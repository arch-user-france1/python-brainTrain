from flask import Flask

app = Flask(__name__)

@app.route("/")
def index():
    with open("web/index.html") as INDEX:
        html = INDEX.read()
    return html
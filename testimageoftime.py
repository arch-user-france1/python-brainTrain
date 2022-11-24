#!/usr/bin/env python3

import time
import threading
import requests
import termcolor
import flask
app = flask.Flask(__name__, template_folder="web")
class ImageOfTime():
    def __init__(self, interval=300):
        imageloader = threading.Thread(target=self.getImagesThread)
        imageloader.start()
        self.image = None
        self.interval = interval

    def getImagesThread(self):
        request = requests.get("https://picsum.photos/4000/3000.webp")
        if request.status_code == 200:
            self.image = request.content
            time.sleep(self.interval)  # 5 minutes
        else:
            print(termcolor.colored("failed getting new image from https://picsum.photos", "red"))
            time.sleep(120)

index_image = ImageOfTime()
@app.route("/")
def flaskimg():
    return flask.make_response(index_image.image)

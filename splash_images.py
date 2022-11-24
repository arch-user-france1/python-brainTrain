#!/usr/bin/env python3

import os
import requests
import termcolor
import time
import threading
import random
import flask
import imageio
import io


app = flask.Flask(__name__)


class ImageOfTime():
    def __init__(self, interval=300, path="img/webp/"):
        self.path = path
        self.image = None
        self.interval = interval
        self.version = 0
        self.updateImageList()

        imageloader = threading.Thread(target=self._thread)
        imageloader.start()

    def updateImageList(self):
        self.images = os.listdir(self.path)
        print(termcolor.colored(f"{len(self.images)} images found", "cyan"))

    def _thread(self):
        self.version = 0
        while True:
            image_path = self.path + random.choice(self.images)
            self.image = open(image_path, "rb")

            time.sleep(self.interval)

            self.image.close()
            self.version += 1


image_index = ImageOfTime()
@app.route("/")
def dlaksjdlasjd():
    return flask.send_file(
        image_index.image,
        mimetype="image/webp",
    )

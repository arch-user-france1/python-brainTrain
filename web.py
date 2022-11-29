#!/bin/python
import os
import platform
import sys
import time
import termcolor
from time import sleep
import random
import bcrypt
import base64
import urllib.request
import json
import hashlib
import socket
import shutil

import flask
import werkzeug
import logging
import threading
import queue

import requests

import firewall
import iostream

import storage
import pathlib

from Cache import Cache

firewall = firewall.module(max_stress=1000)
app = flask.Flask(__name__, template_folder="web")
app.secret_key = '-----'
app.config['SESSION_COOKIE_SAMESITE'] = "Strict"


iostr = iostream.iostream()
#client = {}  # session ids


# SETTINGS
dtpth = "data/" # path where data is stored
FILES_SET = ['set.json', 'data.json', 'settings.json'] # json files for new sets (see eg. create_set)


###  Database Setup  ###
# store for users
userdb = storage.Storage(pathlib.Path(dtpth + "brainTrain-users"), "users")
# store for sets (store [user] => setname)
setdb = storage.Storage(pathlib.Path(dtpth + "brainTrain-sets"), "sets")
# store for settings (sets)
settingsdb = storage.Storage(pathlib.Path(dtpth + "brainTrain-users"), "settings")
# store for folders
folderdb = storage.Storage(pathlib.Path(dtpth + "brainTrain-folders"), "folders")
# store for caching (unused)
diskcache = storage.Storage(pathlib.Path(dtpth + "brainTrain-cache"), "diskcache")


class ImageOfTime():
    def __init__(self, path, interval=300):
        self.path = path
        self.image = None
        self.interval = interval
        self.version = 0
        self.updateImageList()

        imageloader = threading.Thread(target=self._thread, daemon=True)
        imageloader.start()

    def updateImageList(self):
        self.images = os.listdir(self.path)
        print(termcolor.colored(f"{len(self.images)} images found", "cyan"))

    def _thread(self):
        self.version = 0
        while True:
            self.image_name = random.choice(self.images)
            self.image_path = self.path + self.image_name
            self.image = open(self.image_path, "rb")
            self.last_modified = time.ctime()
            self.last_modified_unix = time.time()
            self.if_modified_since = time.ctime(self.last_modified_unix+30)
            self.version += 1

            time.sleep(self.interval)
            self.image.close()


image_index = ImageOfTime("img/webp/")


class Monitoring():
    def __init__(self, ADDR='0.0.0.0', PORT=5001):
        self.connections = []
        self.history = []
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.bind((ADDR, PORT))
        self.listenerThread = threading.Thread(target=self.listener, daemon=True)
        self.listenerThread.start()

        self.send_lock = threading.Lock()
        self.history_lock = threading.Lock()

        self.send_queue = queue.Queue()
        self.sendThread = threading.Thread(target=self._send, args=(self.send_queue,))
        self.sendThread.setDaemon(True)
        self.sendThread.start()

        self.PORT = PORT
        self.ADDR = ADDR

    def listener(self):
        while (True):
            self.socket.listen()
            conn = self.socket.accept()[0]

            if conn.recv(1024).decode() == "brainTrainLPWD":
                self.send(termcolor.colored(f"new client, {len(self.connections)+1} current connections\n", "cyan"))
                self.connections.append(conn)

                for data in self.history:
                    conn.sendall(data.encode())

            else:
                self.send(termcolor.colored("!!! someone tried logging in with wrong password !!!\n", "red"))
                conn.sendall(b"password wrong")
                conn.close()

    def send(self, data):

        self.send_lock.acquire()

        if type(data) == int:
            data = str(data)
        self.send_queue.put(data)
        threading.Thread(target=self._history, args=(data,), daemon=True).start()

        self.send_lock.release()


    def _history(self, data):
        self.history_lock.acquire()

        self.history.append(data)
        if len(self.history) > 1000:
            del self.history[0]

        self.history_lock.release()

    def _send(self, queue):
        while True:
            data = queue.get()
            for i,client in enumerate(self.connections):
                try:
                    client.sendall(data.encode())
                except:
                    del self.connections[i]
                    self.send(termcolor.colored(f"client disconnected, {len(self.connections)+1} clients remaining\n", "cyan"))


portInUse = True
while portInUse:
    try:
        monitoring = Monitoring()
        portInUse = False
    except OSError:
        print(termcolor.colored("monitoring port not free: trying again in 45 seconds...", "red"))
        time.sleep(45)

print(termcolor.colored(f"Monitoring service started and listening at {monitoring.ADDR}:{monitoring.PORT}", "green"))

python_print = print
def print(*args, end="\n"):
    for data in args:
        monitoring.send(data)
        monitoring.send(" ")

    monitoring.send(end)
cache = Cache()

client = cache.file_read(dtpth+"client.json", create=True)
def save_client():
    cache.file_write(dtpth+"client.json", client, immediate=True)

def get_userstorage(username):
    raise DeprecationWarning("get_userstorage used")
    return dtpth + username + "/"

def check_session(flask_session, client=client, functionName=None):
    if flask_session == None:
        flask_session == flask.session
    if 'id' in flask_session and flask_session['id'] in client:
        return [True, flask_session['id']]
    else:
        return [False]

def get_ip():
    if flask.request.environ.get('HTTP_X_FORWARDED_FOR') is None:
        return flask.request.environ['REMOTE_ADDR']
    else:
        return flask.request.environ['HTTP_X_FORWARDED_FOR']

def on_banned():
    return flask.Response(status=418)


def create_set(setName, setWords, userName):
    setstore = setdb.open_store(userName)
    all_sets = setstore.get_entries()

    if setName not in all_sets:
        editmode = False
    else:
        editmode = True


    if editmode:
        previous = setstore.get(setName)
        keep = []
        for previousword in previous:
            if previousword not in setWords:
                remove.append(previousword)
            elif previous[previousword]["answer"] == setWords[previousword]:
                keep.append(previousword)

        new = {}
        for word in keep:
            data = previous[word]
            keep[word] = data
        missing = []
        for word in setWords:
            if word not in new:
                new[word] = {"counters": [0,0], "answer": setWords[word], "version": 0}

    else:
        settingsdb.open_store(userName).put(setName, {})

        new = {}
        for word in setWords:
            new[word] = {"counters": [0,0], "answer": setWords[word], "version": 0}

    setstore.put(setName, new)


def delete_set(setName, username):
    setstore = setdb.open_store(userName)
    all_sets = setstore.get_entries()

    if setName in all_sets:
        setstore.delete(setName)

        return True
    else:
        return False


def check_set(setName, username):
    setstore = setdb.open_store(username)
    all_sets = setstore.get_entries()

    if setName in all_sets:
        return True
    else:
        return False


def load_set(setName, username):
    setstore = setdb.open_store(username)
    response = {}
    response["data"] = {}
    response["settings"] = {}

    setData = setstore.get(setName)["data"]
    python_print(setData)
    for question in setData:
        response["data"][question] = setData[question]

        #response["data"][question]["answer"] = setData[question]["answer"]
        #response["data"][question]["counters"] = setData[question]["counters"]
        #response["data"][question]["version"] = setData[question]["version"]


    return response



VALID_SET_SETTINGS = ["stopaskingpercentage"]
SET_DEFAULT_VALUES = {"stopaskingpercentage": 95}

def set_settings_change(setName: str, settings_change: dict, username: str):
    store = settingsdb.open_store(username)
    settingsdata = store.get(setName)


    failed = []
    successed = []
    for settingname in settings_change:
        if settingname not in settingsdata:  # check if setting doesn't exist
            if settingname in VALID_SET_SETTINGS:  # check wether it is valid or not
                settingsdata[settingname] = {"history": [], "value": "default", "changed_date": None}
            else:
                failed.append(settingname)
                continue

        new_value = settings_change[settingname]
        changed_time = time.time()
        history = settingsdata[settingname]["history"]
        history.append(new_value)
        if len(history) > 25:
            del history[0]
        settingsdata[settingname] = {"value": new_value,
                                     "changed_date": changed_time,
                                     "history": history}
        successed.append(settingname)
    #
    store.put(setName, settingsdata)
    return successed, failed


def set_settings_get(setName: str, settings_get: list, username: str):
    store = settingsdb.open_store(username)
    settingsdata = store.get(setName)


    failed = []
    successed = {}
    for settingname in settings_get:
        if settingname not in settingsdata:
            if settingname in VALID_SET_SETTINGS:
                successed[settingname] = {"value": set_settings_default(settingname),
                                          "changed_date": None,
                                          "history": []}
            else:
                failed.append(settingname)
        else:
            successed[settingname] = settingsdata[settingname]

    return successed, failed


def set_settings_default(setting: str):
    if setting in SET_DEFAULT_VALUES:
        return SET_DEFAULT_VALUES[setting]
    else:
        return None


def set_settings_valid_value(setting: str, value):
    if setting == "stopaskingpercentage":
        if type(value) == int or type(value) == float:
            return True
        else:
            return False
    else:
        return None


def set_update(setName: str, definitions: dict, username: str):
    setstore = setdb.open_store(username)
    setData = setstore.get(setName)


    errors = []
    successes = []
    ignored = []
    outdated = {}
    missing = {}
    total = []
    for definition in definitions:
        counters = definitions[definition]['counters']
        version = definitions[definition]['version']
        answer = definitions[definition]['answer']

        if definition in setData:
            total.append(definition)
            if answer != setData[definition]["answer"]:  # if the answers are not similar it's outdated
                outdated[definition] = {}
                outdated[definition]['counters'] = setData[definition]['counters']
                outdated[definition]['version'] = setData[definition]['version']
                outdated[definition]['answer'] = setData[definition]["answer"]
            else:
                if setData[definition]['version'] <= version:  # if the version is greater or equal it's newer
                    setData[definition]['counters'][0] = counters[0]
                    setData[definition]['counters'][1] = counters[1]

                    setData[definition]['version'] = version + 1
                    successes.append(definition)
                else:  # if the version is less it's outdated
                    outdated[definition] = {}
                    outdated[definition]['counters'] = setData[definition]['counters']
                    outdated[definition]['version'] = setData[definition]['version']
                    outdated[definition]['answer'] = setData[definition]["answer"]
        else:  # if the question could not be found, tell the client
            errors.append([definition, "notFoundInSet"])

    for definition in dataJson:
        if definition not in total:
            missing[definition] = {}
            missing[definition]['counters'] = setData[definition]['counters']
            missing[definition]['version'] = setData[definition]['version']
            missing[definition]['answer'] = setData[definition]["answer"]


    print(termcolor.colored(f"SYNCHRONISATION SUMMARY: updated: {len(successes)} outdated: {len(outdated)} ignored: {len(ignored)} failed: {len(errors)} missing: {len(missing)} ", "cyan"))

    setstore.put(setName, setData)
    return {'successes': successes, 'errors': errors, 'outdated': outdated, 'ignored': ignored, 'missing': missing}


def set_update_time(setName, access_time, username): # removed
    pass


def get_setting_REMOVE(key):
    """ removal pending """
    username = flask.session['username']
    userstorage = get_userstorage(username)
    settings = cache.file_read(userstorage + "settings.json", create=True)

    if key in settings:
        return settings[key]
    else:
        if key == "autosync":
            settings["autosync"] = False
            cache.file_write(userstorage+"settings.json", settings)
            return False
def get_setting(key):
    if not check_session(flask.session):
        return flask.Response(status=401)

    username = flask.session["username"]
    store = userdb.open_store(username)
    settings = store.get("settings")


    if key in settings:
        return settings[key]
    else:
        if key == "autosync":
            settings["autosync"] = False
            store.put("settings", settings)
            return False



def change_settings(data: dict):
    if not check_session(flask.session):
        return flask.Response(status=401)
    if firewall.check(get_ip()):
        return on_banned()
    else:
        firewall.trigger(get_ip(), 1)


    username = flask.session['username']
    userstorage = get_userstorage(username)
    settings = cache.file_read(userstorage + "settings.json", create=True)
    store = userdb.open_store(username)
    settings = store.get("settings")

    success = []
    error = {}

    if len(data) > 500:
        firewall.trigger(get_ip(), 200)
        print(termcolor.colored("SETTINGS dos_attack: ", "blue"), termcolor.colored("user tried DoSing", "red"))
        print(termcolor.colored("→  user: "+str(username),"cyan"))
        return "tooManyKeys"
    for key in data:
        if key == "autosync":
            if data[key] == "True":
                settings[key] = True
                success.append(key)
            elif data[key] == "False":
                settings[key] = False
                success.append(key)
            else:
                error[key] = "invalidBoolean"
        else:
            error[key] = "invalidKey"



    store.put("settings", settings)
    print(termcolor.colored("SETTINGS change: ", "blue"), termcolor.colored(str(username), "cyan"))
    print(termcolor.colored(f"→  successes: {len(success)}, errors: {len(error)}"+str(username),"cyan"))
    return {'success': success, 'error': error}



def create_folder(folder, username):
    userstorage = get_userstorage(username)
    folders = cache.file_read(userstorage + "folders.json", create=True)

    if folder in folders:
        return "folder exists already"

    folders[folder] = []
    cache.file_write(userstorage + "folders.json", folders)
    return True

def folders_get(username):
    folders = cache.file_read(get_userstorage(username) + "folders.json")
    folderArr = []
    for folder in folders:
        folderArr.append(folder)

    return folderArr

def folders_getSets(folder, username):
    folders = cache.file_read(get_userstorage(username) + "folders.json")
    return folders[folder]

def folders_checkFolder(foldername, username):
    folders = cache.file_read(get_userstorage(username) + "folders.json")
    if foldername in folders:
        return True
    else:
        return False

def folders_addSet(setName, foldername, username):
    userstorage = get_userstorage(username)
    folders = cache.file_read(userstorage + "folders.json")
    if not check_set(setName, username):
        return "set does not exist"
    if setName in folders[foldername]:
        return "set already in folder"

    folders[foldername].append(setName)
    cache.file_write(userstorage + "folders.json", folders)
    return "True"

def folders_removeSet(setName, foldername, username):
    userstorage = get_userstorage(username)
    folders = cache.file_read(userstorage + "folders.json")
    if foldername in folders:
        folders[foldername].remove(setName)
        cache.file_write(userstorage + "folders.json", folders)
        return "True"
    else:
        return "False"

def folders_removeFolder(foldername, username):
    userstorage = get_userstorage(username)
    if folders_checkFolder(foldername, username):
        folders = cache.file_read(userstorage + "folders.json")
        del folders[foldername]
        cache.file_write(userstorage + "folders.json", folders)
        return "true"
    else:
        return "folder does not exist"







def serveFile(filepth):
    """this function sucks"""
    with open(f"web/{filepth}") as INDEX:
        return INDEX.read()

def initialize(setName=None):
    """generates a unique ID using urandom and prepares everything"""
    validNumber = False
    while not validNumber:
        clientNumber = str(os.urandom(10).hex())
        if clientNumber not in client:
            validNumber = True
            client[clientNumber] = {}
            flask.session['id'] = clientNumber
            sessid = flask.session['id']
        else:
            print(termcolor.colored("OMG ID EXISTS ALREADY","red"))
            time.sleep(0.5)









class newSharedSet():
    def __init__(self, URL, setname, username, allowedit=False, allowedusers=[], allow_not_signed_in=True, share_progress=False):
        self.URL = URL
        self.allowedit = allowedit
        self.allowedusers = allowedusers # empty array means allow everyone
        self.allow_not_signed_in = allow_not_signed_in
        self.share_progress = share_progress
        self.setname = setname
        self.sharer_name = username
        self.my_name = username

        self.i_am_sharer = True


    def clone(newuser):
        myClone = copy.deepcopy(self)
        myClone.i_am_sharer = False
        myClone.my_name = newuser
        return myClone



def share_set(setname, username, allowedit=False, allowedusers=[], allow_not_signed_in=True, share_progress=False):
    if not check_set(setname, username):
        return "set does not exist"

    userstorage = get_userstorage(username)
    setpth = userstorage + setname + "/"
    settingspth = setpth + "settings.json"
    settings = cache.file_read(settingspth, create=True)
    URL = "/shared/" + username + "/" + setname
    settings["setsharing"] = newSharedSet(URL, setname, username,
                                          allowedit=allowedit,
                                          allowedusers=allowedusers,
                                          allow_not_signed_in=allow_not_signed_in,
                                          share_progress=share_progress)
    cache.file_write(settingspth, settings, immediate=True)
    return URL

def set_shared_get(username, setname):
    if not check_set(setname, username):
        return "set does not exist"

    setpth = get_userstorage(username, create=True)
    settingspth = setpth + "settings.json"
    settings = cache.file_read(setpth, create=True)
    if "setsharing" in settings:
        return settings["setsharing"]
    else:
        return False

def set_shared_clone(username, username_sharer, setname):
    shared_set = set_shared_get(username_sharer, setname)
    if shared_set == "set does not exist":
        return "set does not exist"
    elif shared_set == False:
        return "set not shared"

    # shared_set is newSharedSet()
    userstorage = get_userstorage(username)
    cloned_sets = cache.file_read(userstorage + "clonedsets.json", create=True)
    if not username in cloned_sets:
        cloned_sets[username] = {}

    cloned_sets_username = cloned_sets[username]
    if setname in cloned_sets_username:
        return "set cloned already"

    userstorage_sharer = get_userstorage(username_sharer)
    setjsn = cache.file_read(userstorage_sharer + setname + "/set.json")
    cloned_sets_username[setname] = [shared_set.clone(), setjsn]
    cache.file_write(cloned_sets)
    return True


class NotModified(werkzeug.exceptions.HTTPException):
    code = 304
    def get_response(self, environment):
        return flask.Response(status=304)

@app.route("/checksession")
def flaskCheckSession():
    session = check_session(flask.session)
    if session[0]:
        return "true"
    else:
        return "false"

@app.route("/")
def flaskIndex723645987():
    return flask.render_template("start.html")

@app.route("/imageofthetime.webp")
def flaskimageoftime():
    etag = image_index.image_name

    if "If-None-Match" in flask.request.headers and 'W/"'+etag+'"' in flask.request.headers["If-None-Match"]:
        raise NotModified


    image = open(image_index.image_path, "rb")
    resp = flask.send_file(
        image,
        mimetype="image/webp")

    #resp.headers["Cache-Control"] = "must-revalidate"
    resp.set_etag(image_index.image_name, weak=True)
    resp.headers["If-Match"] = image_index.image_name
    resp.headers["Last-Modified"] = image_index.last_modified
    resp.headers["If-Modified-Since"] = image_index.if_modified_since
    return resp

@app.route("/imageofthetime-version")
def flask092183091283098123098123098():
    return str(image_index.version)

@app.route("/home")
def flaskIndex198234872684():
    return flask.render_template("start.html")

@app.route("/main_html.html")
def flask219387213497():
    return flask.send_file("web/main_html.html")

@app.route("/main_html.js")
def flask123498723947():
    return flask.send_file("web/main_html.js")

@app.route("/index2.html")
def flaskIndex2Optimized_testing():
    return flask.render_template("optimized/index2.html")
@app.route("/index.html")
def flaskIndexOptimized_testing():
    return flask.render_template("optimized/index.html")

@app.route("/navbar")
def testNavbar():
    return flask.render_template("navigationbar.html")

@app.route("/introduction")
def introductionText():
    return serveFile("introduction.txt")

@app.route("/getSets")
def serveSetList():
    session = check_session(flask.session)
    if not session[0]:
        print(termcolor.colored("an unauthorized user tried listing sets", "red"))
        return flask.Response(status=401)


    username = flask.session['username']

    defaultSets = setdb.open_store(username).get_entries()

    # shared sets later
    # last sets?
    return flask.make_response({'defaultSets': defaultSets})

@app.route("/favicon.ico")
def serveFavicon():
    return flask.send_file("web/favicon.ico")

@app.route("/static/inputfield.js")
def serveInputfieldJs():
    return flask.send_file("web/inputfield.js")
@app.route("/static/switch.css")
def serveSwitchCss():
    return flask.send_file("web/switch.css")

@app.route("/login")
def serveLogin():
    return flask.send_file("web/login.html")

@app.route("/static/login.js")
def serveLoginJs():
    return flask.send_file("web/login.js")

@app.route("/static/register.js")
def serveRegisterJs():
    return flask.send_file("web/register.js")
@app.route("/logout")
def logout():
    print(termcolor.colored(f"LOGOUT: {len(client)} users were logged in", "cyan"))
    def delCookies():
        resp = flask.redirect("/")
        for cookie in flask.request.headers.getlist('Cookie'):
            resp.delete_cookie(cookie)
        return resp

    if 'id' in flask.session and flask.session['id'] in client:
        sessid = flask.session['id']
        del client[sessid]

    save_client()
    return delCookies()

@app.route("/loginpost", methods=["POST"])
def login_post():
    if firewall.check(get_ip()):
        return on_banned()

    usernames = userdb.get_stores()

    json = flask.request.get_json(cache=False)
    username = json["username"]
    print(termcolor.colored("LOGIN new_login: "+str(username), "cyan"))
    password = json["password"].encode("utf-8")

    python_print(usernames)
    if username not in usernames:
        firewall.trigger(get_ip(), 1)
        del password
        req = flask.Response({'success': 'false', 'error': 'invalid credentials'}, status=401)
        print(termcolor.colored("LOGIN wrong_username: "+str(username), "cyan"))
        return req

    userdata = userdb.open_store(username)

    credentials = userdata.get("credentials")["data"]
    real_hash = credentials["hash"].encode("utf8")
    #salt = credentials["salt"].encode("utf8")

    #password_hash = bcrypt.hashpw(password, salt)
    #python_print(password_hash, real_hash)

    if bcrypt.checkpw(password, # entered password
                      real_hash): # stored hash
        # password equal
        del password

        initialize()
        sessid = flask.session['id']
        flask.session['username'] = username

        save_client()
        print(termcolor.colored("LOGIN login_success: "+str(username), "cyan"))

        req = flask.Response({'success': 'true'}, status=200)
        return req
    else:
        firewall.trigger(get_ip(), 20)
        del password
        print(termcolor.colored("LOGIN wrong_password: "+str(username), "cyan"))
        req = flask.Response({'success': 'false', 'error': 'invalid credentials'}, status=401)
        return req


@app.route("/register")
def serveRegister():
    return flask.send_file("web/register.html")

@app.route("/registerpost", methods=["POST"])
def register_post():
    if firewall.check(get_ip()):
        return on_banned()

    usernames = userdb.get_stores()
    json = flask.request.get_json(cache=False)
    username = json['username']
    password = json['password']


    if username in usernames or username == "":
        del password
        firewall.trigger(get_ip(), 5)
        req = flask.Response({"success": "false"}, status=401, mimetype='application/json')
        return req

    # encode password and generate salt
    passwordEncoded = password.encode('utf-8')
    salt = (bcrypt.gensalt(14))
    password_hash = bcrypt.hashpw(password.encode("utf-8"), salt)

    # save data
    userdb.new_store(username)
    userdata = userdb.open_store(username)
    #userdata.add("credentials", {"salt": base64.b64encode(salt).hex(), "hash": base64.b64encode(bcrypt.hashpw(password.encode('utf-8'), salt)).hex()})
    userdata.add("credentials", {"salt": salt.decode("utf8"), "hash": password_hash.decode("utf8")})
    userdata.add("registerTime", time.time())
    userdata.add("settings", {})
    setdb.new_store(username)

    firewall.trigger(get_ip(), 100)

    initialize()
    del password
    del passwordEncoded
    del salt
    req = flask.Response({"success": "true"}, status=200, mimetype='application/json')
    return req



@app.route("/getUsername")
def putUsername():
    if check_session(flask.session)[0]:
        resp = flask.Response(flask.session['username'])
        return resp
    else:
        resp = flask.Response(status=401)
        return resp

@app.route("/set/<setName>")
@app.route("/set/<setName>/set")
def setOverview(setName):
    return flask.render_template("set_mainpage.html", setName=setName)

@app.route("/set_mainpage.html")
def flasksetmainpage():
    return flask.render_template("set_mainpage.html")

@app.route("/set/<setName>/edit")
def setEdit(setName):
    return flask.render_template("newset.html", edit=True)

@app.route("/set/<setName>/learn")
def serveTrainer2(setName):
    session = check_session(flask.session)
    if session[0]:
        resp = flask.render_template("trainingv2.html")
        return resp
    else:
        resp = flask.redirect("/login")
        return resp

@app.route("/change_set_settings", methods=["POST"])
def flaskchangesetsettings():
    session = check_session(flask.session)
    if session[0]:
        username = flask.session['username']
        jsn = flask.request.get_json()
        print(termcolor.colored("CHANGE_SET_SETTINGS", "blue"), termcolor.colored(username, "cyan"))
        setName = jsn["set"]
        settings = jsn["settings"]
        if not check_set(setName, username):
            return flask.make_response("set does not exist")
        status = set_settings_change(setName, settings, username)
        return flask.make_response({"successed": status[0], "failed": status[1]})

@app.route("/get_set_settings", methods=["POST"])
def flaskgetsettings():
    session = check_session(flask.session)
    if session[0]:
        username = flask.session['username']
        jsn = flask.request.get_json()
        print(termcolor.colored("GET_SET_SETTINGS", "blue"), termcolor.colored(username, "cyan"))
        setName = jsn["set"]
        settings = jsn["settings"]
        if not check_set(setName, username):
            return flask.make_response("set does not exist")
        settings = set_settings_get(setName, settings, username)
        return flask.make_response({
            "successed": settings[0],
            "failed": settings[1]
        })


@app.route("/learn.html")
def flaskLearnHTML():
    session = check_session(flask.session)
    if session[0]:
        resp = flask.render_template("trainingv2.html")
        return resp
    else:
        return flask.Response(status=401)

@app.route("/set/<setName>/init")
def initializeTraining(setName):
    session = check_session(flask.session)
    if session[0]:
        if check_set(setName, flask.session['username']):
            set_update_time(setName, time.time(), flask.session['username'])
            resp = flask.make_response({'exists': 'True'})
            return resp
        else:
            resp = flask.make_response({'exists': 'False'})
            print(termcolor.colored(str(session[1])+"tried accessing a set that does not exist"), "red")
            return resp
    else:
        return flask.Response(status=401)
@app.route("/set/<setName>/setData")
def serveSetData(setName):
    session = check_session(flask.session)
    if session[0]:
        if check_set(setName, flask.session['username']):
            respJson = load_set(setName, flask.session['username'])
            respJson['exists'] = 'True'
            return flask.make_response(respJson)
        else:
            respJson = {'exists': 'False'}
            return flask.make_response(respJson)
@app.route("/set/<setName>/updateStatus", methods=["POST"])
def updateSetStatus(setName):
    if firewall.check(get_ip()):
        return on_banned()
    firewall.trigger(get_ip(), 1)

    session = check_session(flask.session)
    if session[0]:
        username = flask.session['username']
        if check_set(setName, username=username):
            print(termcolor.colored("SET SYNCHRONISATION:  ", "blue"),termcolor.colored(username+", "+setName, "green"))
            data = flask.request.get_json(cache=False)
            respJson = set_update(setName=setName, definitions=data, username=username)

            return flask.make_response(respJson)
        else:
            return flask.make_response({'exists': 'False'})
    else:
        return flask.make_response(status=403)

@app.route("/set/<setName>/delete", methods=["POST"])
def deleteSet(setName):
    if firewall.check(get_ip()):
        return on_banned()
    firewall.trigger(get_ip(), 1)
    session = check_session(flask.session)
    if session[0] and check_set(setName, username=flask.session['username']):
        username = flask.session['username']
        print(termcolor.colored("SET delete:  ", "blue"), termcolor.colored(username+", "+setName, "green"))
        delete_set(setName, username)
        return flask.make_response("true")
    else:
        return flask.make_response("false")


@app.route("/newset")
def serveNewset():
    return flask.render_template("newset.html", edit=False)

@app.route("/uploadset/<name>", methods=['POST'])
def uploads(name):
    if firewall.check(get_ip()):
        return on_banned()
    firewall.trigger(get_ip(), 10)


    if flask.request.method == "POST":
        if 'id' in flask.session:               # refactor to use new functions; code readability  TODO
            if flask.session['id'] in client:
                sessid = flask.session['id']
                username = flask.session['username']

                userstore = setdb.open_store(username)
                cards = setdb.get_stores()

                jsn = flask.request.get_json()

                if name == "":
                    return {'success': False, 'error': 'wrong name', 'usrmsg': 'Please name your set.'}

                if name not in cards or jsn['replace']:
                    jsn = jsn['data']
                    try:
                        if processUploadedSet(jsn, name, username):
                            error = False
                            success = True
                        else:
                            error = "response from set processer not True"
                            success = False
                    except Exception as e:
                        print("Exception occurred in processing an uploaded set:", e, ". session:", sessid)
                        error = "unknown"
                        success = False
                    finally:
                        if success:
                            return {'success': True}
                        else: # unknown error (eg. json invalid, only 1 def...)
                            return {'success': False, 'error': 'unknown', 'usrmrg': 'An unknown error occurred. You may want to contact the developer.'}
                else: # name "" or already in cards (set exists already)
                    return {'success': False, 'error': 'wrong name', 'usrmsg': 'A set with the same name exists already.\n Please change the name of your set.'}
            else: # invalid session
                return {'success': False, 'error': 'session invalid', 'usrmsg': 'Your session has expired. Please log in again.'}
        else: # no session
            return {'success': False, 'error': 'no session id', 'usrmsg': 'You are not logged in. Please log in first!'}


@app.route("/folders/new", methods=["POST"])
def flaskNewfolder():
    if firewall.check(get_ip()):
        return on_banned()
    firewall.trigger(get_ip(), 1)
    session = check_session(flask.session)
    if session[0]:
        username = flask.session['username']
        jsn = flask.request.get_json()
        folderName = jsn['name']
        print(termcolor.colored("FOLDER create:  ", "blue"), termcolor.colored(username+", "+folderName, "green"))

        return flask.make_response(str(create_folder(folderName, username)))
    else:
        return flask.Response(status=401)


@app.route("/folders/all")
def flaskListfolders():
    session = check_session(flask.session)
    if session[0]:
        username = flask.session["username"]
        folders = folders_get(username)
        foldersDict = {}
        for folder in folders:
            foldersDict[folder] = folders_getSets(folder, username)

        return flask.make_response(foldersDict)
    else:
        return flask.Response(status=401)

@app.route("/folders/addSet", methods=["POST"])
def flaskAddSetfolders():
    session = check_session(flask.session)
    if session[0]:
        username = flask.session["username"]
        jsn = flask.request.get_json()
        folder = jsn['folder']
        setName = jsn['set']
        if folders_checkFolder(folder, username):
            return flask.make_response(folders_addSet(setName, folder, username))
        else:
            return flask.make_response("folder does not exist")
@app.route("/folders/removeSet", methods=["POST"])
def flaskRemoveSetfolders():
    session = check_session(flask.session)
    if session[0]:
        username = flask.session["username"]
        jsn = flask.request.get_json()
        folder = jsn['folder']
        setName = jsn['set']
        if folders_checkFolder(folder, username):
            return flask.make_response(folders_removeSet(setName, folder, username))
        else:
            return flask.make_response("folder does not exist")

@app.route("/folders/delete", methods=["POST"])
def flaskRemovefolder():
    session = check_session(flask.session)
    if session[0]:
        username = flask.session["username"]
        jsn = flask.request.get_json()
        folder = jsn['folder']
        return flask.make_response(folders_removeFolder(folder, username))
    else:
        return flask.Response(status=401)


@app.route("/serviceworker.js")
def flaskserviceworker():
    return flask.send_file("web/serviceworker.js")

    
def save_exit(status=None, save_set=False, setName=None, setData=None):
    print(termcolor.colored("Using deprecated function save_exit. Please use save instead.", "red"))
    if save_set:
        iostr.saveDictionary(setData, setName)
    iostr.saveDictionary(cards, 'cards')

def save(save_set=False, setName=None, setData=None):
    """To be called when a set-data changed"""
    if save_set:
        iostr.saveDictionary(setData, setName)
    iostr.saveDictionary(cards, 'cards')


def getArgument(argumentNr, usage, exitStatus=0):
    try:
        return sys.argv[argumentNr]
    except IndexError:
        print(f"argument {argumentNr} is missing\n"
              f"argument {argumentNr}: {usage}")
        sys.exit(exitStatus)

def processUploadedSet(dictionary, name, username):
    """This function checks if the received set is okay
    and either returns True or False"""
    length = len(dictionary)
    if length < 1: # return false if there's less than one definition
        return False

    print(f"Saving a set with {length} definitions, username {username}...")

    create_set(name, dictionary, username)
    return True


@app.route("/settings", methods=["GET", "POST"])
def appSettings():
    if flask.request.method == "GET":
        return flask.render_template("settings.html")
    elif flask.request.method == "POST":
        json = flask.request.get_json()
        return change_settings(json)

@app.route("/settings/<name>", methods=["GET", "POST"])
def getSettings(name):
    if check_session(flask.session)[0]:

        if flask.request.method != "POST":
            setting = get_setting(name)
            if setting == None:
                resp = flask.make_response("invalid")
            else:
                resp = flask.make_response(str(setting))
            return resp
        else:
            data = flask.request.get_data()
            success = change_settings({name, data})
            if len(success['success'] == 1):
                return flask.make_response("success")
            else:
                return flask.make_response("error")

    else:
        return flask.Response(status=401)





@app.route("/sharing/new")
def flasksharenewset():
    session = check_session(flask.session)
    if not session[0]:
        return flask.Response(status=401)

    username = flask.session["username"]
    jsn = flask.request.get_json()
    setname = jsn["set"]
    if set_shared_get != False:
        return "set shared already"

    allowedit = jsn["allowedit"]
    if type(jsn["allowedusers"]) != list:
        allowedusers = []
    else:
        allowedusers = jsn["allowedusers"]

    allow_not_signed_in = jsn["allow_not_signed_in"]
    if allow_not_signed_in == "true":
        allow_not_signed_in = True
    elif allow_not_signed_in == "false":
        allow_not_signed_in = False
    else:
        allow_not_signed_in = True
    share_progress = jsn["share_progress"]
    if share_progress == "true":
        share_progress == True
    else:
        share_progress == False

    status = share_set(setname, username,
                       allowedit=allowedit,
                       allowedusers=allowedusers,
                       allow_not_signed_in=allow_not_signed_in,
                       share_progress=share_progress)
    if status == "set does not exist":
        return flask.make_response("set does not exist")
    else:
        URL = status
        return flask.make_response(URL)

@app.route("/sharing/clone", methods=["POST"])
def flaskaslkdjaslkjdlj():
    session = check_session(flask.session)
    if not session[0]:
        return flask.Response(status=401)
    
    jsn = flask.request.get_json()
    username = jsn["user"]
    setname = jsn["set"]
    status = set_shared_clone(flask.session["username"], username, setname)
    if status == "set does not exist":
        return flask.make_response("set does not exist")
    elif status == "set not shared":
        return flask.make_response("set does not exist")
    elif status == "set cloned already":
        return flask.make_response(status)
    elif status:
        return flask.make_response("success")
    else:
        print(termcolor.colored("invalid return in /sharing/clone from set_shared_clone", "red"))
        return flask.Response(status=500)




@app.route("/shared/<username>/<setname>/isshared")
def flaskissetshared23(username, setname):
    if check_set(setname, username):
        if set_shared_get(username, setname) != False:
            return flask.make_response("true")
    return flask.make_response("false")


@app.route("/shared/<username>/<setname>")
def flasksetsharedpage10293812(username, setname):
    return flask.render_template("set_sharedpage_loader.html")


@app.route("/static/navigationbar.html")
def flasknavigationbar():
    return flask.render_template("navigationbar.html")

@app.route("/static/set_sharedpage.html")
def flask92813091823098210301283092183092180938201380912830921830920498():
    return flask.render_template("set_sharedpage.html")

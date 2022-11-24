#!/usr/bin/env python3

import socket
import threading
import time
import termcolor

class Monitoring():
    def __init__(self, ADDR='0.0.0.0', PORT=5001):
        self.connections = []
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.bind((ADDR, PORT))
        self.listenerThread = threading.Thread(target=self.listener)
        self.listenerThread.start()

    def listener(self):
        while (True):
            self.socket.listen()
            conn = self.socket.accept()[0]

            if conn.recv(1024).decode() == "brainTrainLPWD":
                self.connections.append(conn)
                self.send(termcolor.colored(f"new client, {len(self.connections)} current connections", "cyan"))
            else:
                self.send(termcolor.colored("!!! someone tried logging in with wrong password !!!", "red"))
                conn.close()

    def send(self, data):
        for i,client in enumerate(self.connections):
            try:
                client.sendall(data.encode())
            except:
                del self.connections[i]
                self.send(termcolor.colored(f"client disconnected, {len(self.connections)} clients remaining", "cyan"))
#

monitoring = Monitoring()

def print(data, flush=False):
    monitoring.send(data)

while(True):
    time.sleep(1)
    print(termcolor.colored("this is a red text", "red"), end="")

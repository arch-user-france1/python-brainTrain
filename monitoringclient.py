#!/usr/bin/env python3

import socket, sys

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

#password = input("enter fucking password: ")
password = "brainTrainLPWD"
s.connect((sys.argv[1], 5001))
s.sendall(password.encode())

while True:
    print(s.recv(1024).decode(), end="")

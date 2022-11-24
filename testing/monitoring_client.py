#!/usr/bin/env python3

import socket

s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)

password = input("enter fucking password: ")
s.connect(('localhost', 5001))
s.sendall(password.encode())

while True:
    print(s.recv(1024).decode())

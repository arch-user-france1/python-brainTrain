#!/usr/bin/env python3

"""
Firewall module for web.py
"""


import hashlib, os, time, termcolor, threading
class Firewall:
    def __init__(self, max_stress=1000):
        self.store = {}
        self.bannedIndex = []
        self.max_stress = max_stress
        self.trusted_ips = ['192.168.0.1']

        threading.Thread(target=self.thread).start()
        self.lock = threading.Lock()

    def hash_ip(self, ip, salt=False):
        hash = hashlib.blake2b(ip.encode('utf-8')).digest()
        return hash

    def init_ip(self, hash):
        self.store[hash] = {}
        self.store[hash]['stress'] = 0
        self.store[hash]['banned'] = False

    def check(self, ip, weight):
        self.lock.acquire()
        if ip in self.trusted_ips:
            self.lock.release()
            return False

        hash = self.hash_ip(ip)
        if hash not in self.store:
            self.init_ip(hash)

        if self.store[hash]['banned']:
            self.lock.release()
            return True

        self.store[hash]['stress'] += weight
        if self.store[hash]['stress'] >= self.max_stress:
            self.store[hash]['banned'] = True
            self.bannedIndex.append(hash)
            print(termcolor.colored(f"FIREWALL ip_ban: {len(self.bannedIndex)} banned", "red"))
            self.lock.release()
            return True
        else:
            self.lock.release()
            return False



    def thread(self):
        while True:
            time.sleep(120)
            self.lock.acquire()
            remove = []
            for hash in self.store:
                try:
                    if self.store[hash]['stress'] > 0:
                        self.store[hash]['stress'] -= 1
                        if self.store[hash]['stress'] <= 0:
                            remove.append(hash)

                    else:
                        remove.append(hash)
                except Exception as e:
                    print(termcolor.colored("FIREWALL thread_exception: "+str(e), "red"))

            for hash in remove:
                if self.store[hash]['banned']:
                    print(termcolor.colored(f"FIREWALL ip_unban: {len(self.bannedIndex)-1} banned", "cyan"))
                del self.store[hash]
            self.lock.release()
            del remove
#




firewall = Firewall()
IPs=['1.2.3.4','3.4.3.2', '192.168.0.1']

import random
random.seed()

i = 0
banned = []

while True:
    i += 1
    ip = random.choice(IPs)
    weight = random.random()
    if firewall.check(ip, weight):
        print(ip, banned)
        while True:
            print(firewall.check(ip, 1))
            time.sleep(.5)

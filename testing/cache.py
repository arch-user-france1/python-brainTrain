#!/usr/bin/env python3
class Cache():
    def __init__(self, maxmem=60.0, free=0.2, avgmem=40):
        self.cache = {}
        self.cacheNrs = {}
        self.accesses = []

        self.maxmem = maxmem
        self.minmem = maxmem - free
        self.avgmem = avgmem

        self.usedmem = 0
        self.lock = False


        import psutil
        import time
        self.time = time
        self.psutil = psutil

        import threading
        self.managementThread = threading.Thread(target=self.management)
        self.managementThread.start()
        self.sysThread = threading.Thread(target=self.update_RAM)
        self.sysThread.start()


    def exists(self, element):
        if element in self.cache:
            return True
        else:
            return False

    def write(self, element, data):
        if not self.lock:
            self.cache[element] = data
            self.cacheNrs[element] = len(self.accesses)
            self.accesses.append(element)
            return True
        else:
            return False

    def read(self, element):
        del self.accesses[self.cacheNrs[element]]
        self.cacheNrs[element] = len(self.accesses)
        self.accesses.append(element)
        return self.cache[element]


    def file_read(self, filepth, create=False):
        if exists(filepth):
            return self.read(filepth)
        else:
            f = iostr.openDictionary(filepth, create=create)
            cache.write(f)
            return f


    def management(self):
        while True:
            self.management_memory()
            self.time.sleep(1)

    def update_RAM(self):
        while True:
            self.usedmem = self.psutil.virtual_memory().percent
            self.time.sleep(0.5)

    def management_memory(self):
        nrKeys = len(self.accesses)
        if self.usedmem > self.avgmem and 0 < nrKeys:
            if self.usedmem > self.maxmem:
                self.lock = True
            print("Cache: freeing RAM")
            i=0
            while self.usedmem > self.avgmem and 0 < nrKeys:
                element = self.accesses[0]
                del self.cache[element], self.accesses[0], self.cacheNrs[element]
                if self.usedmem < self.maxmem:
                    self.time.sleep(0.1)

                i += 1
            self.lock = False
            print("Cache: done freeing RAM")


cache = Cache()

i = 0
import time
while True:
    if cache.write(i, "test") == False:
        time.sleep(10)
    i += 1

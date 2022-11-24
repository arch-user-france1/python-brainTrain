#!/usr/bin/env python3

import magic
import termcolor
import threading
import queue
import pathlib
from iostream import iostream
iostr = iostream()

class Cache():
    def __init__(self, maxmem=90.0, free=0.2, avgmem=70):
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
        self.managementThread.setDaemon(True)
        self.managementThread.start()
        self.sysThread = threading.Thread(target=self.update_RAM)
        self.sysThread.setDaemon(True)
        self.sysThread.start()


    def exists(self, element):
        if element in self.cache:
            return True
        else:
            return False

    def write(self, element, data, force=False, isUpdate=False):
        if not self.lock or force:
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

    def delete(self, element):
        if self.exists(element):
            del self.cache[element]
            del self.accesses[self.cacheNrs[element]]
            del self.cacheNrs[element]
            return True
        else:
            return False

    def file_read(self, filepth, create=False):
        if isinstance(filepth, pathlib.PurePath):
            filepth = str(filepth.absolute())

        if self.exists(filepth):
            print(termcolor.colored("CACHE FILE_HIT:", "blue"), termcolor.colored(filepth,"green"))
            return self.read(filepth)
        else:
            print(termcolor.colored("CACHE FILE_MISS:", "blue"), termcolor.colored(filepth,"red"))
            f = self._read_file(filepth, create=create)
            if f == None: # don't cache file-not-found
                print(termcolor.colored("FileNotFoundError (cache.file_read): "+filepth, "red"))
                return None
            if self.write(filepth,f):
                print(termcolor.colored("→   successfully added file to the cache", "cyan"))
            else:
                print(termcolor.colored("→   could not add file to cache", "cyan"))
            return f

    def file_write(self, filepth, data, remove_from_cache=False, immediate=None):
        """update a file if it's in the cache and save it to disk,
        may be used for write-caching implementation sometime"""#
        if isinstance(filepth, pathlib.PurePath):
            filepth = str(filepth.absolute())


        self._save_file(filepth, data)
        if self.exists(filepth):
            if remove_from_cache:
                self.delete(filepth)
                return True

            self.write(filepth, data, force=True)
            return True
        else:
            return False

    @staticmethod
    def _read_file(filepth, create=False):
        try:  # exceptions are faster than if unless one really occurs
            magicString = magic.from_file(filepth)
        except FileNotFoundError:
            if create: # create will return an empty json
                return {}
            else:
                return None


        if magicString == 'JSON data':
            return iostr.openDictionary(filepth, create=False)
        magicStringWords = magicString.split(" ")
        if magicString[-1] == 'text':
            with open(filepth, "r") as f:
                return f.read()
        else:
            with open(filepth, "rb") as f:
                return f.read()


    @staticmethod
    def _save_file(filepth, data):
        """decides which tool to use"""
        if type(data) == dict:
            return iostr.saveDictionary(filepth, data)
        elif type(data) == bytes:
            with open(filepth, "wb") as f:
                f.write(data)
        else:
            with open(filepth, "w") as f:
                f.write(data)


    def management(self):
        while True:
            self.management_memory()
            self.time.sleep(1)

    def update_RAM(self):
        while True:
            self.usedmem = self.psutil.virtual_memory().percent
            self.time.sleep(10)

    def management_memory(self):
        nrKeys = len(self.accesses)
        if self.usedmem > self.avgmem and nrKeys > 0:
            if self.usedmem > self.maxmem:
                self.lock = True
            print(termcolor.colored("CACHE MANAGEMENT: removing elements", "blue"))
            i=0
            while self.usedmem > self.avgmem and i <= nrKeys:
                try:
                    element = self.accesses[0]
                    print(termcolor.colored("CACHE MANAGEMENT: removing "+str(element),"cyan"))
                    del self.cache[element], self.accesses[0], self.cacheNrs[element]
                except Exception as e:
                    print(termcolor.colored("CACHE MANAGEMENT: failed removing element: "+str(e), "red"))

                if self.usedmem < self.maxmem:
                    self.time.sleep(0.1)

                i += 1
            self.lock = False

#!/usr/bin/env python3

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
        self.managementThread = threading.Thread(target=self.management, daemon=True)
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
        if self.exists(filepth):
            print(termcolor.colored("CACHE FILE_HIT:", "blue"), termcolor.colored(filepth,"green"))
            return self.read(filepth)
        else:
            print(termcolor.colored("CACHE FILE_MISS:", "blue"), termcolor.colored(filepth,"red"))
            f = iostr.openDictionary(filepth, create=create)
            if f == None: # don't cache file-not-found
                print(termcolor.colored("FileNotFoundError (cache.file_read): "+filepth, "red"))
                return None
            if self.write(filepth,f):
                print(termcolor.colored("→   successfully added file to the cache", "cyan"))
            else:
                print(termcolor.colored("→   could not add file to cache", "cyan"))
            return f

    def file_write(self, filepth, data, remove_from_cache=False, immediate=None):
        """update a file if it's in the cache, and always save it to it's origin, may be used for write-caching implementation"""
        iostr.saveDictionary(data, filepth)
        if self.exists(filepth):

            if remove_from_cache:
                self.delete(filepth)
                return True

            self.write(filepth, data, force=True)
            return True
        else:
            return False

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

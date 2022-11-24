#!/usr/bin/env python3

import pathlib
import termcolor
import threading
import queue
import time
import copy
import os
import iostream
import shutil
from Cache import Cache
iostr = iostream.iostream()


class Storage():
    def __init__(self, path: pathlib.Path, name):
        self.name = str(name)
        self.pathObj = path
        self.path = path.resolve()
        self.cache = Cache()
        self.locks = {}
        self.storeIndexes = {}


        if path.exists():
            if not path.is_dir():
                print(termcolor.colored("Storage path is not a folder: "+self.name, "red"))
                print(termcolor.colored("→  deleted: "+str(path.resolve()), "magenta"))
                path.unlink()
                self._initialize_storage()
            else:
                print(termcolor.colored(self.name+" running", "cyan"))
        else:
            self._initialize_storage()

    def new_store(self, storename):
        index = self.cache.file_read(self.path / "index")
        if "store"+storename in index:
            return "exists already"

        if len(index["ids"]) > 0:
            store_id = index["ids"][0]
            del index["ids"][0]
        else:
            store_id = index["newid"]
            index["newid"] += 1

        os.mkdir(self.path / ("folder-"+str(store_id)))
        path_store = self.path / ("store-"+str(store_id)+".json")
        index["store"+storename] = {"id": store_id,
                            "path": str(path_store.absolute()),
                            "filename": "store-"+str(store_id)+".json",
                            "folder": str((self.path / ("folder-"+str(store_id))).absolute())}
        self.cache.file_write(path_store, {
            "ids": [], "newid": 0, "data": {}
        })
        self.cache.file_write(self.path / "index", index)
        return True

    def del_store(self, storename):
        index = self.cache.file_read(self.path / "index")
        if "store"+storename not in index:
            return "doesn't exist"

        store = index["store"+storename]
        store_id = store["id"]
        store_filepath = store["path"]
        os.remove(store_filepath)
        shutil.rmtree(store["folder"])
        index["ids"].append(int(store_id))
        del index["store"+storename]
        self.cache.file_write(self.path / "index", index)
        return True

    def open_store(self, storename):
        index = self.cache.file_read(self.path / "index")
        if "store"+storename not in index:
            return "doesn't exist"

        # shared writing locks
        storedata = index["store"+storename]
        if "store"+storename in self.locks:
            lock = self.locks["store"+storename]
        else:
            lock = threading.Lock()
            self.locks["store"+storename] = lock

        # index shared across objects
        if storename in self.storeIndexes:
            storeIndex = storeIndexes[storename]
        else:
            storeIndex = self.cache.file_read(storedata["path"])
            self.storeIndexes[storename] = storeIndex

        return self.StoreObj(storedata["path"], storedata["folder"], self.cache, lock, storeIndex)

    def get_stores(self):
        index = self.cache.file_read(self.path / "index")
        stores = index
        stores_real = []
        for store in stores:
            if "store" in store:
                stores_real.append(store[5:])
        return stores_real

    


    def _initialize_storage(self):
        print(termcolor.colored(self.name+" initializing storage", "cyan"))
        os.mkdir(self.path)
        os.mkdir(self.path/"data")
        index = {"ids": [], "newid": 0}
        self.cache.file_write(self.path/"index", index)
        print(termcolor.colored("→  "+str(self.path.absolute())+" initialized  "+self.name, "cyan"))





    class StoreObj:
        def __init__(self, indexpath, storagepath, cache, lock, indexfile):
            self.indexpath = indexpath # index json file
            self.storagepath = storagepath # folder
            self.cache = cache
            self.write_lock = lock
            self.index = indexfile
            self.write_index_lock = threading.Lock()

        def add(self, name, data):
            index = self.index
            if name in index["data"]:
                return "exists already"

            json_id = self._get_id()
            index["data"][name] = {"id": json_id, "json": True, "path": self.storagepath+"/"+str(json_id)+".json"}
            self.cache.file_write(self.storagepath +"/"+str(json_id), data)
            self._write_index()
            return True

        def put(self, name, data):
            if name not in self.index["data"]:
                return self.add(name, data)
            else:
                filepath = self.index["data"][name]["path"]
                self.write_lock.acquire()
                self.cache.file_write(filepath, data)
                self.write_lock.release()
                return True

        def get(self, name):
            if name not in self.index["data"]:
                return {"status": "doesn't exist"}
            filepath = self.index["data"][name]["path"]
            response_data =  self.cache.file_read(filepath)
            if response_data == None:
                return {"status": "failure", "exception": FileNotFoundError}
            return {"status": "ok", "data": response_data}

        def delete(self, name):
            if name not in self.index["data"]:
                return {"status": "doesn't exist"}
            self.write_lock.acquire()
            path = self.index["data"][name]["path"]
            os.remove(path)
            json_id = self.index["data"][name]["id"]
            self.index["ids"].append(json_id)
            del self.index["data"][name]
            self.write_lock.release()
            self._write_index()

        def get_entries(self):
            entries = []
            for entry in self.index["data"]:
                entries.append(entry)
            return entries

        def _get_id(self):
            index = self.index
            if len(index["ids"]) > 0:
                new_id = copy.deepcopy(index["ids"][0])
                del index["ids"][0]
            else:
                new_id = copy.deepcopy(index["newid"])
                index["newid"] += 1
            self._write_index()
            return new_id

        def _write_index(self):
            self.write_index_lock.acquire()
            self.cache.file_write(self.indexpath, self.index)
            self.write_index_lock.release()

#!/usr/bin/env python3

store = Storage(pathlib.Path("storagetest"), name="a-test")

# create store "mystore"
print(store.new_store("mystore"))

# open store "mystore" → returns an object
mystore = store.open_store("mystore")
if mystore == "doesn't exist":
    print("mystore does not exist")
    exit

print(mystore)

# add an entry called data 1 with content {1: Hello World}
print(mystore.add("data 1", {1: "Hello World"}))

# get data from entry data 1
hworld = mystore.get("data 1")
if hworld["status"] == "doesn't exist":
    print("data 1 doesn't exist")
    exit

print(hworld) # status = ok; data = content

# delete store "mystore"
store.delete("mystore")




store = Storage(pathlib.Path("storagetest"), name="a-test")
store.new_store("mystore")
mystore = store.open_store("mystore")
if mystore == "doesn't exist":
    print("mystore does not exist")
    exit

mystore.add("data1", {"trest":23})

print(mystore.get("data1"))

somedata = {102: "omg u got it"}
mystore.add("data2", somedata)
mystore.put("data3", somedata)
print(termcolor.colored("something else", "magenta"))
mystore.put("data3", "ah something else xD")
mystore.delete("data3")
mystore.add("data4", somedata)

mynewStore = Storage(pathlib.Path("storage2"), name="storage2")
mynewStore.new_store("teststore")
store = mynewStore.open_store("teststore")
if store == "doesn't exist":
    print("store doesn't exist")
    exit

store.add("set-afgafg")

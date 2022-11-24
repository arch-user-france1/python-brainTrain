function bfetch(URL, method, body) {
  const data = new Object()
  data['method'] = method,
  data['cache'] = 'no-cache'

  if (method != "GET" && method != "HEAD"){
    data['headers'] = {'Content-Type': 'application/json'},
    data['body'] = body
  }

  return fetch(URL,data)
}
async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}



//
// add the sync button
//

var css = document.createElement("link")
css.rel = "stylesheet"
css.href = "/static/index2/navigationMiddle.css"
document.head.append(css)

navigationMiddle = document.getElementById("navigation-middle")

fontRotate = '<i class="fa-solid fa-rotate"></i>'

syncBtn = document.createElement("button")
syncBtn.id = "sync-btn"
syncBtn.innerHTML = fontRotate
syncBtn.isrotating = false

//navigationMiddle.append(syncBtn)

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}
async function flyingBtns() {
  var e = []
  var originButton = document.getElementById("sync-btn")
  top = originButton.offsetTop
  for (i = 0; i < 1000; i++) {
    fontRotate = '<i class="fa-solid fa-rotate"></i>'

    flyingbtn = document.createElement("button")
    flyingbtn.innerHTML = fontRotate
    flyingbtn.style.border = "none"
    flyingbtn.style.backgroundColor = "transparent"
    flyingbtn.style.color = "#FFF"
    document.body.append(flyingbtn)
    flyingbtn.style.transition = "4s"
    flyingbtn.style.position = "absolute"
    flyingbtn.style.top = 0
    flyingbtn.style.left = "50%"
    e.push(flyingbtn)
  }

  await delay(50)
  for (i = 0; i < e.length; i++) {
    size = getRandomArbitrary(0.5, 1.3)
    posY = getRandomArbitrary(0, window.innerHeight)
    posX = getRandomArbitrary(0, window.innerWidth/2)
    if (Math.random() < .5) {
      posX *= -1
    }

    e[i].style.transform = "scale("+size+") translate("+ posX +"px,"+ posY +"px)"
  }
}

syncBtn.addEventListener("click", async function() {
  this.style.transition = "1s"
  this.style.animation = "syncing 2s linear infinite"
  //flyingBtns()


  let openRequest = indexedDB.open("store", 4)

  openRequest.onupgradeneeded = function() {
    let db = openRequest.result
    if (!db.objectStoreNames.contains('sets')) {
      db.createObjectStore('sets', {keyPath: 'id'});
    }
    if (db.objectStoreNames.contains('updates'))  {
      db.deleteObjectStore('updates')
    }
    if (!db.objectStoreNames.contains("offlinestorage")) {
      db.createObjectStore("offlinestorage", {keyPath: 'request'})
    }
  }
  openRequest.onerror = function() {
    console.error("Error ",openRequest.error)
  }



  openRequest.onsuccess = function() {
    let db = openRequest.result
    window.IDBStore = db // for global use

    db.onversionchange = function() {
      db.close()
      console.error("Database outdated, reloading page")
      alert("Database outdated, reloading page.")
      document.reload()
    }


    let transaction = db.transaction('sets','readonly')
    let sets = transaction.objectStore("sets")
    var req = sets.openCursor()
    window.doBfetch = {}

    req.onsuccess = async function(event) {
      var cursor = event.target.result


      if (cursor) {
        console.info("loading local ",cursor.key)
        window.doBfetch[cursor.key] = cursor.value['data']

        cursor.continue()
      }
      else {
        // got all objects
        window.localUpdate = {}

        console.info("synchronising...")
        doBfetch = window.doBfetch
        fetchPromises = []
        function doFetch(setName, toUpdate) {
          return bfetch("/set/"+setName+"/updateStatus", "POST", JSON.stringify(toUpdate))
            .then((response) => response.json())
            .then ((resp) => {
              window.localUpdate[setName] = resp
              return Promise.resolve()
            })
        }

        for (let [key, content] of Object.entries(doBfetch)) {
          console.info("starting synchronisation of ",key)
          fetchPromises.push(doFetch(key, content))
        }
        await Promise.all(fetchPromises)


        localUpdate = window.localUpdate


        for (let [setName, content] of Object.entries(localUpdate)){
          resp = content

          console.log("---------------")
          console.log(setName)

          setData = window.doBfetch[setName]


          console.log(resp.exists)
          if (resp.exists == "False") {
            console.log("deleting: ",setName)
            saveTransaction = db.transaction('sets', 'readwrite')
            sets = saveTransaction.objectStore('sets')
            sets.delete(setName)
            console.info("deleted successfully: ",setName)

          }else {

            for (i = 0; i < resp['ignored']; i++) {

            }


            for (let i in resp['successes']) {
              content = resp['successes'][i]
              setData[content]['version'] += 1
            }

            for (let key in resp['errors']) {
              me = resp['errors'][key]
              if (me[1] === "notFoundInSet") {
                question = me[0]
                delete setData[question]
                console.info(question, " deleted as it could not be found on the server")
              }
            }

            for (let [key, value] of Object.entries(resp['outdated'])) {
              setData[key] = value
            }

            for (let [key, value] of Object.entries(resp['missing'])) {
              setData[key] = value
            }


            console.log("saving: ",setName)
            saveTransaction = db.transaction('sets', 'readwrite')
            sets = saveTransaction.objectStore('sets')
            sets.put({id: setName, data: setData})
            console.info("saved successfully: ",setName)
          }
        }
        await delay(700)
        syncBtn = document.getElementById("sync-btn")
        syncBtn.style.animation = "none"
        syncBtn.innerHTML = '<i class="fa-solid fa-check"></i>'
      }
    }
  }


}, { once: true })





//
// append the buttons
//
navigationMiddle.append(syncBtn)





//
// sync automatically if enabled
//
bfetch("/settings/autosync", "GET")
  .then((resp) => resp.text())
  .then((data) => {
    if (data == "True") {
      syncBtn.dispatchEvent(new Event("click"));
    }
  })

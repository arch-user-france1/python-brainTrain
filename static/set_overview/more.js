function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}


/// get the set //
bfetch("/set/"+setName+"/init", "GET", "")
  .then((response) => response.json())
  .then((resp) => {

    if (resp['exists'] == 'True') {
      // continue
      //
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
        // - continue, opening the database successed

        db.onversionchange = function() {
          db.close()
          console.error("Database outdated, reloading page")
          window.location.reload()
        }

        let transaction = db.transaction('sets', 'readonly')
        var sets = transaction.objectStore("sets")
        var req = sets.openCursor(setName)
        req.onsuccess = function(event) {
          var cursor = event.target.result
          if (cursor) {
            window.setdata = cursor.value
            start()
          }
          else {
            console.log("downloading set data")
            fetch("/set/"+setName+"/setData")
              .then((resp) => resp.json())
              .then((data) => {
                if (data['exists'] != "True") {alert("not found but found 404: unknown error occurred")}

                let transaction = db.transaction('sets', 'readwrite')
                let sets = transaction.objectStore("sets")
                let request = sets.add({id: setName, data: data['data']})
                transaction.oncomplete = () => {
                  let transaction = db.transaction('sets', 'readonly')
                  var sets = transaction.objectStore("sets")
                  var req = sets.openCursor(setName)
                  req.onsuccess = function(event) {
                    var cursor = event.target.result
                    if (cursor) {
                      window.setdata = cursor.value
                      start()
                    }
                  }
                }
              })
          }
        }
      }

    }
    else {
      // set does not exist, don't continue, redirect back to /
      console.error("this set does not exist")
      window.location = "/"
    }
  })

async function start() {

  let settingsDiv = document.createElement("div")
  let text
  settingsDiv.id = "first-settings-div"
  let percentageSettings = document.createElement("div")
  percentageSettings.classList.add("settings-unit")
  let slider = document.createElement("input")
  slider.id = "stoplearningafter-slider"
  slider.classList.add("slider")
  slider.type = "range"
  slider.min = 1
  slider.max = 100
  slider.value = 95
  text = document.createElement("span")
  text.id = "stoplearningafter"
  text.textContent = "stop learning if you answered correct more than ..%"
  bfetch("/get_set_settings", "POST", JSON.stringify({
    set: window.decodeURI(setName),
    settings: ["stopaskingpercentage"]
  }))
    .then((response) => response.json())
    .then((data) => {
      let value = data.successed.stopaskingpercentage.value
      window.stopaskingpercentage = data.successed.stopaskingpercentage
      document.getElementById("stoplearningafter-slider").value = value
      document.getElementById("stoplearningafter").textContent = "stop learning if you answered correct more than "+value+"%"
    })
  text.style.width = "15rem"
  slider.addEventListener("input", () => {
    let text = document.getElementById("stoplearningafter")
    text.textContent = "stop learing if you answered correct more than "+slider.value+"%"
  })
  slider.addEventListener("change", () => {
    let text = document.getElementById("stoplearningafter")
    let setNameHuman = window.decodeURI(setName)
    bfetch("/change_set_settings", "POST", JSON.stringify(
      {set: setNameHuman, settings: {stopaskingpercentage: slider.value}}))
  })
  percentageSettings.append(text)
  percentageSettings.append(slider)
  settingsDiv.append(percentageSettings)

  let resetYourData = document.createElement("div")
  resetYourData.classList.add("settings-unit")
  resetYourData.style.borderTop = "none"
  let resetbutton = document.createElement("button")
  resetbutton.classList.add("button")
  resetbutton.style.display = "flex"
  resetbutton.style.justifyContent = "center"
  resetbutton.style.alignItems = "center"
  text = document.createElement("p")
  text.textContent = "reset your learning data"

  resetbutton.addEventListener("click", function() {
    let width = this.getBoundingClientRect().width
    this.style.width = width+"px"
    this.style.pointerEvents = "none"
    this.children[0].textContent = "working.."
    var loader = document.createElement("div")
    loader.classList.add("loader")
    loader.style.marginLeft = "5px"
    this.append(loader)
    words = window.setdata['data']
    for (let i in words) {
      words[i]['counters'][0] = 0
      words[i]['counters'][1] = 0
    }
    (() => {
      var db = window.IDBStore

      let transaction = db.transaction(['sets'], 'readwrite')
      var sets = transaction.objectStore("sets")
      sets.put({id: setName, data: words})
      loader.remove()
    })();
    this.children[0].textContent = "success"
    //setTimeout((() => {window.location.reload()}), 600)
  })

  resetbutton.append(text)
  resetYourData.append(resetbutton)
  settingsDiv.append(resetYourData)

  document.body.append(settingsDiv)





  if (!window.stopaskingpercentage) {
    let result = await bfetch("/get_set_settings", "POST", JSON.stringify({
      set: window.decodeURI(setName),
      settings: ["stopaskingpercentage"]
    }))
    result = await result.json()
    if (!result.successed.stopaskingpercentage) {
      console.warn("could not get stopaskingpercentage - backend failed")
    }
    window.stopaskingpercentage = result.successed.stopaskingpercentage
  }

  let words = window.setdata.data
  let nrQuestions = Object.keys(words).length

  var listObj = new Object()
  for (let [key, content] of Object.entries(words)) {
    console.log(key, content)
    listObj[key] = {}
    listObj[key]["answer"] = content["answer"]
    listObj[key]["totalAnswered"] = content['counters'][0] + content['counters'][1]
    listObj[key]["correctPercentage"] = content['counters'][0] / listObj[key].totalAnswered * 100
    listObj[key]["wouldSkip"] = (() => {
      if (listObj[key].correctPercentage > window.stopaskingpercentage.value && listObj[key].totalAnswered > 4) {return true} else {return false}
    })();
  }

  var wordsContainer = document.createElement("div")
  wordsContainer.id = "words-container"
  wordsContainer.style.marginTop = "6%"
  wordsContainer.style.display = "grid"
  wordsContainer.style.justifyContent = "center"
  wordsContainer.style.transition = "1s"
  var wordElements = []
  let percentage
  let transitionTime = 0
  for (let [key, wordData] of Object.entries(listObj)) {
    let wordElement = document.createElement("div")
    wordElement.style.margin = ".5rem";
    wordElement.style.border = "3px solid #aabcd2"
    wordElement.style.backgroundColor = "#636363"
    wordElement.style.borderRadius = ".5rem"
    wordElement.style.color = "#aabcd2"
    wordElement.style.padding = ".2rem"
    wordElement.style.display = "flex"
    wordElement.style.justifyContent = "left"
    wordElement.style.width = "685px"
    wordElement.style.alignItems = "center"
    wordElement.style.opacity = 0
    wordElement.style.transiton = "opacity 1s linear "+transitionTime+"ms"
    wordElement.style.transitionDuration = "1s"
    wordElement.style.transitionDelay = transitionTime+"ms"
    transitionTime += 50

    let wordDiv = document.createElement("div")
    wordDiv.style.display = "flex"
    wordDiv.style.justifyContent = "left"
    wordDiv.style.width = "16rem"
    wordDiv.style.margin = ".5rem"
    let wordText = document.createElement("span")
    wordText.textContent = key
    wordText.style.marginRight = "5%"
    wordDiv.append(wordText)
    wordElement.append(wordDiv)

    wordDiv = document.createElement("div")
    wordDiv.style.display = "flex"
    wordDiv.style.justifyContent = "left"
    wordDiv.style.width = "16rem"
    wordDiv.style.marginRight = ".5rem"
    let answerText = document.createElement("span")
    answerText.textContent = wordData.answer
    answerText.style.borderLeft = "2px solid #2E2E2E"
    answerText.style.paddingLeft = "16px"
    wordDiv.append(answerText)
    wordElement.append(wordDiv)

    wordDiv = document.createElement("div")
    wordDiv.style.display = "flex"
    wordDiv.style.justifyContent = "left"
    wordDiv.style.width = "2rem"
    wordDiv.style.marginRight = ".2rem"
    let percentageText = document.createElement("span")
    percentageText.borderLeft = "2px solid #2E2E2E"
    percentageText.paddingLeft = "16px"
    percentage = Math.round(wordData.correctPercentage)
    if (percentage > 100) {percentage = 100}
    if (percentage == NaN || percentage == "NaN") {percentage = 0}
    percentageText.textContent = percentage + "%"
    percentageText.style.marginRight = "10px"
    wordDiv.append(percentageText)
    wordElement.append(wordDiv)

    let check = document.createElement("span")
    check.style.marginLeft = "10px"
    console.log((listObj[key].correctPercentage > 95 && listObj[key].totalAnswered > 4),listObj[key].correctPercentage,listObj[key].totalAnswered)
    if (wordData.wouldSkip) {
      check.innerHTML = '<i class="fa-solid fa-check"></i>'
    } else {
      check.innerHTML = '<i class="fa-regular fa-keyboard"></i>'
    }
    wordElement.append(check)



    wordElements.push(wordElement)
    wordsContainer.append(wordElement)

    setTimeout((() => {
    for (let key in wordElements) {
      wordElements[key].style.opacity = 1
    }
    }), 150)

  }


  document.body.append(wordsContainer)
}

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

/// find out which damn set we clicked lol ///
setName = window.location.href.split("/")[4]
setNameHuman = decodeURI(setName)


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
          document.reload()
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
            text = document.getElementById("def1")
            text.style.color = "#4255FF"
            win = document.getElementById("window")
            win.style.border = "3px solid #4255FF"
            text.textContent = "Downloading..."
            fetch("/set/"+setName+"/setData")
              .then((resp) => resp.json())
              .then((data) => {
                text.style.color = "#57D750"
                text.textContent = "Saving - shouldn't take long..."
                if (data['exists'] != "True") {alert("not found but found 404: unknown error occurred")}

                let transaction = db.transaction('sets', 'readwrite')
                let sets = transaction.objectStore("sets")
                let request = sets.add({id: setName, data: data['data']})
                transaction.oncomplete = () => {
                  text.textContent = "Download finished. Reloading page."
                  setTimeout(function(){location.reload()},1000)
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

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function getPromiseFromEventEnter(item, event) {
  return new Promise((resolve) => {
    const listener = (event) => {
      if (event.key == 'Enter') {
      item.removeEventListener(event, listener);
      resolve();
      }
    }
    item.addEventListener(event, listener);
  })
}
async function getPromiseFromEvent(item, event) {
  return new Promise((resolve) => {
    const listener = (event) => {
      item.removeEventListener(event, listener);
      resolve();
    }
    item.addEventListener(event, listener);
  })
}

function getTranslateXY(element) {
    const style = window.getComputedStyle(element)
    const matrix = new DOMMatrixReadOnly(style.transform)
    return {
        translateX: matrix.m41,
        translateY: matrix.m42
    }
}

async function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function addHoverListeners(input) {
  await delay(1000)
  input.addEventListener("mouseover", async function(event) {
    this.style.transition = "1s cubic-bezier(.22,.61,.36,1)"
    if (!correctAnswerInputs[i].transY) {
      transY = getTranslateXY(this)['translateY']
      this.transY = transY
    }
    else {transY = this.transY}

    this.style.transform = "translate(30rem, "+transY+"px)"
  })
  input.addEventListener("mouseout", function (event) {
    if (!correctAnswerInputs[i].transY) {
      transY = getTranslateXY(this)['translateY']
      this.transY = transY
    }
    else {transY = this.transY}

    this.style.transform = "translate(55rem, "+transY+"px)"
  })
}

async function run(data, order){
  correctArray = []
  wrongArray = []
  inputfield = document.getElementById("ansfld")
  historydiv = document.getElementById("history")
  answerRelativeTop = 39
  input = document.getElementById("answ")

  document.getElementById("setNameH").textContent = setNameHuman

  var iteration = 0
  let reversed = false
  for (iteration = 0; iteration < order.length; iteration++) {
    question = order[iteration]
    content = data[order[iteration]]
    answer = content['answer']


    questionTxt = document.getElementById("def1")
    questionTxt.textContent = question

    reliabilityTxt = document.getElementById("reliability")
    var totalAnswered = content['counters'][0] + content['counters'][1]
    var correctPercentage = content['counters'][0] / totalAnswered * 100
    if (isNaN(correctPercentage)) {
      correctPercentage = 0
    }
    if (window.showpercentage) {
      reliabilityTxt.textContent = correctPercentage + "%"
    }

    if (window.cardsreversed) {
      questionTxt.textContent = answer
      answer = question
    }

    input.style.opacity = "1"
    await getPromiseFromEventEnter(input, "keyup")
    input.style.willChange = "transform, opacity"
    input.addEventListener("focusin", function(event) { //disable clicks
      this.blur()
    })

    correctAnswerInputs = document.getElementsByClassName("correctAnswers")
    if (correctAnswerInputs !== null) {
      if (correctAnswerInputs.length > 6) {
        correctAnswerInputs[correctAnswerInputs.length-1 - 6].style.opacity = "0"
        correctAnswerInputs[correctAnswerInputs.length-1 - 6].style.pointerEvents = "none"
      }
    }
    console.log("your answer ", input.value, "  correct answer", answer)
    if (input.value == answer) {
      correctArray.push(question)

      input.style.border = "3px solid #42E240"
      input.style.color = "#1AE51A"
      input.style.backgroundColor = "#646F90"

      if (correctAnswerInputs !== null) {
        for (i = 0; i < correctAnswerInputs.length; i++) {
            if (!correctAnswerInputs[i].transY) {
              transY = getTranslateXY(correctAnswerInputs[i])['translateY']
              correctAnswerInputs[i].transY = transY
            }
            else {transY = correctAnswerInputs[i].transY}
            correctAnswerInputs[i].transitiontime += 0.7
            correctAnswerInputs[i].style.transitionDuration = correctAnswerInputs[i].transitiontime + "s"

            correctAnswerInputs[i].style.transform =
              "translate(55rem, "+(transY - 50)+"px)";
            correctAnswerInputs[i].transY -= 50
        }
      }


      myPos = input.offsetTop
      //input.style.position = "relative"
      historydiv.appendChild(input)
      input.style.position = "absolute"
      input.style.top = myPos+-3+"px"
     // input.style.top = "-"+answerRelativeTop+"px"
      answerRelativeTop += 46
      await delay(20)
      input.style.transform = "translateX(55rem)"
      input.classList.remove("ansfld")
      input.classList.add("correctAnswers")
      input.transitiontime = 0.7
      input.style.opacity = "0.6"
      input.id = ""
      oldinput = input
      addHoverListeners(input)
      //setTimeout(function() {addHoverListeners(oldinput)}, 500)

      input = document.createElement("input")
      input.addEventListener("paste", function(event) {
        console.info("don't paste cheat")
        event.preventDefault()
      })
      input.id = "answ"
      inputfield.appendChild(input)
      await delay(10)
      input.style.opacity = "1"
      input.focus()

    }
    else {
      correctAnswer = document.getElementById("corransw")
      document.getElementById("window").appendChild(correctAnswer)
      correctAnswer.value = answer
      await delay(100)
      correctAnswer.style.opacity = "1"
      correctAnswer.style.color = "#1EC8C2"
      correctAnswer.style.border = "3px solid #42E240"
      correctAnswer.style.transform = "translateY(-600%)"
      correctAnswer.style.pointerEvents = "none"
      questionTxt.style.color = "#1EC8C2"


      input.style.border = "3px solid #FF655C"
      input.style.color = "#C81E23"
      input.classList.add("wrongAnswers")
      input.isWrong = true
      yourans = document.getElementById("youranswer")

      correctButton = document.getElementById("correctButton")
      wrongAnswerNav = document.getElementById("wrongAnswerNav")
      wrongAnswerNav.style.opacity = "1"
      correctButton.style.pointerEvents = "auto"
      wrongArray.push(question)


      function buttonEventListener() {
        console.log(wrongArray)
        wrongArray.pop()
        console.log(wrongArray)
        if (!reversed){
          correctArray.push(question)
        } else {
          correctArray.push(answer)
        }

        element = input
        //        element.classList.remove("wrongAnswers")   <= breaks animation
        //        element.classList.add("correctAnswers")
        element.style.backgroundColor = "#646F90"
        element.style.border = "3px solid #42E240"
        element.style.color = "#42E240"
        element.style.opacity = "0.6"

        element.isWrong = false

        var event = new CustomEvent("keyup", { "detail": "correctButton" });
        document.dispatchEvent(event);
      }
      correctButton.addEventListener("click", buttonEventListener)

      input.blur()
      await delay(100)
      await getPromiseFromEvent(document, "keyup")
      correctButton.removeEventListener("click", buttonEventListener)


      correctAnswer.style.opacity = "0"
      correctAnswer.style.transform = ""
      wrongAnswerNav.style.opacity = "0"
      correctButton.style.pointerEvents = "none"

      if (input.isWrong) {
        input.style.color = "#1EC8C2"
        input.style.backgroundColor = "#646F90"
        input.style.border = "3px solid #C81E23"
      }
      input.value = answer


      correctAnswerInputs = document.getElementsByClassName("correctAnswers")
      if (correctAnswerInputs !== null) {
        i = 0
        for (i = 0; i < correctAnswerInputs.length; i++) {
          if (!correctAnswerInputs[i].transY) {
            transY = getTranslateXY(correctAnswerInputs[i])['translateY']
            correctAnswerInputs[i].transY = transY
          }
          else {transY = correctAnswerInputs[i].transY}

          correctAnswerInputs[i].transitiontime += 0.7
          correctAnswerInputs[i].style.transitionDuration = correctAnswerInputs[i].transitiontime + "s"

          correctAnswerInputs[i].style.transform =
            "translate(55rem, "+(transY - 50)+"px)";
          correctAnswerInputs[i].transY -= 50
        }
      }

      questionTxt.style.color = ""


      myPos = input.offsetTop
      //input.style.position = "relative"
      historydiv.appendChild(input)
      input.style.position = "absolute"
      input.style.top = myPos+-3+"px"
     // input.style.top = "-"+answerRelativeTop+"px"
      answerRelativeTop += 46
      await delay(20)
      input.style.transform = "translateX(55rem)"
      input.classList.remove("ansfld")
      input.classList.add("correctAnswers")
      input.transitiontime = 0.7
      input.id = ""
      addHoverListeners(input)


      input = document.createElement("input")
      input.addEventListener("paste", function(event) {
        console.info("don't paste cheat")
        event.preventDefault()
      })
      input.id = "answ"
      inputfield.appendChild(input)
      await delay(10)
      input.style.opacity = "1"
      input.focus()
    }
  }
  return [correctArray, wrongArray]
}

function updateTimeText(element) {
  var currTime = new Date()
  var hours = currTime.getHours()
  var minutes = currTime.getMinutes()
  var hoursAdditional = ""
  var minutesAdditional = ""
  if (hours < 10) {
    hoursAdditional = "0"
  }
  if (minutes < 10) {
    minutesAdditional = "0"
  }
  timeElement.textContent = hoursAdditional + currTime.getHours() + ":" + minutesAdditional + currTime.getMinutes()
}

async function start() {
  let bfetchresult = await bfetch("/get_set_settings", "POST", JSON.stringify({
    set: window.decodeURI(setName),
    settings: ["stopaskingpercentage"]
  }))
  bfetchresult = await bfetchresult.json()
  if (!bfetchresult.successed.stopaskingpercentage) {
    console.warn("could not get stopaskingpercentage - backend failed")
  }
  window.stopaskingpercentage = bfetchresult.successed.stopaskingpercentage


  navbar = document.getElementById("navigationbar")
  navigationMiddle = document.getElementById("navigation-middle")
  navigationMiddle.style.display = "flex"
  navigationMiddle.style.margin = "auto"
  navbar.appendChild(navigationMiddle)


  settings = document.createElement("button")
  settings.id = "navbar-settings"
  settingsIcon = document.createElement("i")
  settingsIcon.innerHTML = '<i class="fa-solid fa-bars"></i>'
  settingsIcon.style.color = "#FFF"

  settings.style.backgroundColor = "transparent"
  settings.style.border = "none"
  settings.style.paddingRight = "5px"
  settings.style.transition = ".3s ease-in"

  settings.addEventListener("click", async function(event){
    this.style.transform = "rotate(45deg)"


    settingswin = document.createElement("div")
    settingswin.id = "settings-window"
    settingswin.style.opacity = "0"
    settingswin.style.transition = ".3s"
    settingswin.style.position = "absolute"
    settingswin.style.top = "5rem"
    settingswin.style.left = "6rem"
    settingswin.style.right = "6rem"
    settingswin.style.bottom = "0"
    settingswin.style.backgroundColor = "#2E3856" // dusk
    settingswin.style.zIndex = "1001"
    settingswin.style.margin = "auto"
    settingswin.border = "1rem solid white"
    settingswin.style.display = "table-cell"
    settingswin.style.padding = "1%"
    settingswin.style.borderRadius = ".5rem"

    settingsblur = document.createElement("div")
    settingsblur.style.opacity = "0"
    settingsblur.style.transition = ".7s ease-in"
    settingsblur.style.position = "absolute"
    settingsblur.style.top = 0
    settingsblur.style.left = 0
    settingsblur.style.right = 0
    settingsblur.style.bottom = 0
    settingsblur.style.backgroundColor = "black"
    settingsblur.zIndex = "100"


    settingsbar = document.createElement("div")
    settingsbar.style.display = "flex"
    settingsbar.style.borderBottom = "2px solid white"
    settingsbar.style.backgroundColor = "transparent"
    settingsbar.style.marginBottom = "2%"

    settingsbtns = document.createElement("div")
    settingsbtns.style.backgroundColor = "transparent"
    settingsbtns.style.borderBottom = "1px solid white"
    settingsbtns.style.padding = "1rem"
    settingsbtns.style.paddingBottom = "2rem"

    settingsexpanded = document.createElement("div")
    settingsexpanded.id = "settings-expanded-window"

    settingstext = document.createElement("h1")
    settingstext.style.color = "#FFF"
    settingstext.style.backgroundColor = "transparent"
    settingstext.textContent = "SETTINGS"
    settingstext.style.transition = "opacity 1s .2s"
    settingstext.style.opacity = 0
    settingsbar.append(settingstext)

    closeBtn = document.createElement("button")

    closeBtn.innerHTML = '<i class="fa-regular fa-xmark" style="color: #FFF"></i'
    closeBtn.style.backgroundColor = "transparent"
    closeBtn.style.border = "none"
    closeBtn.style.outline = "none"
    closeBtn.style.marginLeft = "auto"
    closeBtn.style.fontSize = "2rem"

    async function closeSettings(event) {
      settingswin.style.opacity = "0"
      settingsblur.style.opacity = "0"
      await delay(500)
      settingswin.remove()
      settings.style.transform = ""
      await delay(200)
      settingsblur.remove()
      event.stopPropagation()
    }
    settingsblur.addEventListener("click", closeSettings)
    closeBtn.addEventListener("click", closeSettings)


    settingsbar.append(closeBtn)
    settingswin.append(settingsbar)
    settingswin.append(settingsbtns)
    settingswin.append(settingsexpanded)

    await delay(300)
    document.body.append(settingsblur)
    document.body.append(settingswin)
    await delay(100)
    settingsblur.style.opacity = "0.7"
    settingswin.style.opacity = "1"

    settingstext.style.opacity = "1"

/*
    function addSettingsBtn(innerHTML, name) {
      button = document.createElement("button")
      button.classList.add("settingsBtn")
      button.innerHTML = innerHTML

      if (window.toggles[name])
        button.classList.add("settingsBtnEnabled")

      button.addEventListener("click", function() {
        if (window.toggles[name]) {
          window.toggles[name] = True
          this.classList.add("settingsBtnEnabled")
        }
      })
    }
*/

///
    reverseCardsBtn = document.createElement("button")
    reverseCardsBtn.classList.add("settingsBtn")
    reverseCardsBtn.innerHTML = '<i class="fa-solid fa-repeat" style="fontSize: 30rem"></i><p>reverse cards</p>'
    settingsbtns.append(reverseCardsBtn)

    
    if (window.cardsreversed) {
      this.classList.add("settingsBtnEnabled")
      this.style.color = "#6072AA"
    }
    reverseCardsBtn.addEventListener("click", function() {
      if (window.cardsreversed) {
        window.cardsreversed = false
        this.classList.remove("settingsBtnEnabled")
      }
      else {
        window.cardsreversed = true
        this.classList.add("settingsBtnEnabled")
      }
    })

    showPercentageBtn = document.createElement("button")
    showPercentageBtn.classList.add("settingsBtn")
    showPercentageBtn.innerHTML = '<i class="fa-solid fa-percent"></i><p>show reliability</p>'
    showPercentageBtn.addEventListener("click", function() {
      if (window.showpercentage)
        window.showpercentage = false
      else
        window.showpercentage = true
    })
    if (window.showpercentage) {
      this.classList.add("settingsBtnEnabled")
    }
    settingsbtns.append(showPercentageBtn)


    resetBtn = document.createElement("button")
    resetBtn.classList.add("settingsBtn")
    resetBtn.innerHTML = '<i class="fa-solid fa-broom"></i><p style="color: red">reset data</p>'
    settingsbtns.append(resetBtn)

    resetBtn.addEventListener("click", async function() {
      // change counters
      words = window.setdata['data']
      for (let i in words) {
        words[i]['counters'][0] = 0
        words[i]['counters'][1] = 0
      }

      //  IndexedDB
      await updateDB()
      this.innerHTML = '<i class="fa-solid fa-broom"></i><p style="color: red">your data has been reset</p>'
      await delay(500)
      window.location.reload()
    })





///
    await delay(50)
    var btns = document.querySelectorAll(".settingsBtn")
    for (i = 0; i < btns.length; i++) {
      btns[i].style.opacity = 1
      btns[i].style.transform = "rotate"
      await delay(300/btns.length)
    }
  })


    settings.appendChild(settingsIcon)
    navigationMiddle.appendChild(settings)

    timeElement = document.createElement("p")
    timeElement.style.color = "#FFF"
    timeElement.style.fontSize = "12px"
    timeElement.textContent = "loading..."
    navigationMiddle.appendChild(timeElement)
    updateTimeText(timeElement)
    setInterval(updateTimeText, 5000, timeElement)

//////












  //let data = window.setdata['data']
  //let words = data['data']
  let words = window.setdata['data']

  let nrQuestions = Object.keys(words).length

  var firstRun = new Object()
  var order = []
  for (let [question, content] of Object.entries(words)) {

    var totalAnswered = content['counters'][0] + content['counters'][1]
    var correctPercentage = content['counters'][0] / totalAnswered * 100
    if (correctPercentage > window.stopaskingpercentage.value && totalAnswered > 4) {
      console.log("skipped ", question, "percentage ", correctPercentage)
    } else {
      firstRun[question] = content
      order.push(question)
    }
  }
  var result = []
  var correctAnswers
  var wrongAnswers

  shuffleArray(order)
  result=await run(firstRun, order)
  correctAnswers = result[0]
  wrongAnswers = result[1]

  // change counters
  for (i=0; i < correctAnswers.length; i++) {
    words[correctAnswers[i]]['counters'][0] += 1
  }
  for (i=0; i < wrongAnswers.length; i++) {
    words[wrongAnswers[i]]['counters'][1] += 1
  }

  // update IndexedDB
  function updateDB() {
    var db = window.IDBStore

    let transaction = db.transaction(['sets'], 'readwrite')
    var sets = transaction.objectStore("sets")
    sets.put({id: setName, data: words})
  }
  updateDB()




  // re-run until every answer was answered correct once at least
  var iterate
  while (wrongAnswers.length > 0) {

    // delete history
    history = document.querySelectorAll(".correctAnswers").forEach(function (element){
      element.remove()
    }) // sorry for bad naming, it's wrong answers, too


    iterate = {}
    order = []
    for (i=0; i < wrongAnswers.length; i++) {
      iterate[wrongAnswers[i]] = words[wrongAnswers[i]]
      order.push(wrongAnswers[i])
    }
    shuffleArray(order)
    result=await run(iterate, order)
    correctAnswers = result[0]
    wrongAnswers = result[1]

    // change counters
    for (i=0; i < correctAnswers.length; i++) {
      words[correctAnswers[i]]['counters'][0] += 1
    }
    for (i=0; i < wrongAnswers.length; i++) {
      words[wrongAnswers[i]]['counters'][1] += 1
    }

    // update IndexedDB
    updateDB()
  }

  window.location.href = "/"
}

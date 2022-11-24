parrent = document.getElementById("window")
function newFields(addListener) {
  parrent = document.getElementById("window")

  var div = document.createElement("div")
  div.classList.add("definitionsDiv")

  questionbtn = document.createElement("input")
  questionbtn.opacity = "0"
  questionbtn.classList.add("definitionsL")
  questionbtn.placeholder = "question"

  answerbtn = document.createElement("input")
  answerbtn.opacity = "0"
  answerbtn.classList.add("definitionsR")
  answerbtn.placeholder = "answer"

  div.append(questionbtn)
  div.append(answerbtn)
  parrent.appendChild(div)

  questionbtn.style.opacity = "1"
  answerbtn.style.opacity = "1"

  if (addListener)
    answerbtn.addEventListener("keyup", function() {newFields(true)}, {once: true})

  return [questionbtn, answerbtn]
}


if (EDIT) {
  originsetName = decodeURI(window.location.href.split("/")[4])
  bfetch("/set/"+originsetName+"/init", "GET", "")
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
          var req = sets.openCursor(originsetName)
          req.onsuccess = function(event) {
            var cursor = event.target.result
            if (cursor) {
              window.setdata = cursor.value
              updateFields()
            }
            else {
              text = document.getElementById("title")
              text.style.color = "#4255FF"
              win = document.getElementById("window")
              win.style.border = "3px solid #4255FF"
              text.textContent = "Downloading..."
              fetch("/set/"+originsetName+"/setData")
                .then((resp) => resp.json())
                .then((data) => {
                  text.style.color = "#57D750"
                  text.textContent = "Saving - shouldn't take long..."
                  if (data['exists'] != "True") {alert("not found but found 404: unknown error occurred")}

                  let transaction = db.transaction('sets', 'readwrite')
                  let sets = transaction.objectStore("sets")
                  let request = sets.add({id: originsetName, data: data['data']})
                  transaction.oncomplete = () => {
                    text.textContent = "Download finished. Reloading page."
                    setTimeout(function(){location.reload()},500)
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



  function updateFields() {
    setData = window.setdata['data']
    for (let [newQuestion, newContent] of Object.entries(setData)) {
      fields = newFields(false)
      fields[0].value = newQuestion
      fields[1].value = newContent['answer']
    }
    newFields(true)
  }

}
else {
  newFields(true)
}









////////////////////////////////////////////////////////
setNameInput = document.getElementById("setName")
setNameInput.addEventListener("keyup", function() {
  if (this.value != "") {
    document.getElementById("donebtn").style.opacity = "1"
  } else {
    document.getElementById("donebtn").style.opacity = ""
  }
})

let setName = document.getElementById("setName").value
donebtn = document.getElementById("donebtn")
donebtn.addEventListener("click", function(){
  setName = document.getElementById("setName").value
  if (setName != "") {
    questionFields = document.getElementsByClassName("definitionsL")
    answerFields = document.getElementsByClassName("definitionsR")

    const objectWords = {}
    for (i = 0; i < questionFields.length; i++) {
      if (questionFields[i].value != "")
        objectWords[questionFields[i].value] = answerFields[i].value
    }


    fetchJson = {replace: EDIT, data: objectWords}
    console.log(fetchJson)

    fetch("/uploadset/"+setName,
          {method: "POST",
           cache: 'no-cache',
           headers: {'Content-Type': 'application/json'},
           body: JSON.stringify(fetchJson)
          })
      .then((response) => response.json())
      .then((data) => {
        responsejson = data
        console.log (responsejson)
        if (responsejson['success'] == false || responsejson['success'] == "False") {
          // error
          doneBtn = document.getElementById("donebtn")
          doneBtnTxt = document.getElementById("donebtntext")
          doneBtnTxt.textContent = data.usrmsg
          doneBtnTxt.style.color = "#52F8FF"
          doneBtn.style.border = "3px solid #A0181C"
          doneBtnTxt.style.opacity = "1"

          document.getElementById("setName").addEventListener("keyup", function(event){
            doneBtnTxt.style.color = "#792791"
            doneBtn.style.border = "3px solid #792791"
            doneBtnTxt.textContent = "done"
          }, { once: true })
        }
        else if (responsejson['success'] == true || responsejson['success'] == "True") {
          // success
          doneBtn = document.getElementById("donebtn")
          doneBtnTxt = document.getElementById("donebtntext")
          doneBtnTxt.textContent = "Your set was created successfully."
          doneBtnTxt.style.color = "#52F8FF"
          doneBtn.style.border = "3px solid #A0181C"
          doneBtnTxt.style.opacity = "1"
          window.location.href = "/"
        }
      })

      .catch((error) => {
        // script error
        console.log(error)
        doneBtnTxt = document.getElementById("donebtntext")
        doneBtnTxt.textContent = "ERROR: "+error
        doneBtnTxt.style.color = "#52F8FF"
        doneBtn.style.border = "3px solid #A0181C"
        doneBtnTxt.style.opacity = "1"
      })

  }
})

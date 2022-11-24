var foldersrequest
(async () => {
  foldersrequest = await fetch("/folders/all")
  fetch("/getSets")
    .then((response) => response.json())
    .then((data) => {
      defaultSets = data.defaultSets
      /*
        if (/complete|interactive|loaded/.test(document.readyState)) {
        changeDOMSets(document.getElementById("js-allsets"))
        } else {
        window.addEventListener("DOMContentLoaded", changeDOMSets);
        }
      */
      changeDOMSets(document.getElementById("js-allsets"))
    })
})()

function newSetButton(setName) {
  button = document.createElement("button")
  button.classList.add("setListButton")
  text = document.createElement("span")
  text.textContent = setName
  text.classList.add("setListText")
  button.classList.add("gradient-border")
  button.append(text)

  // dragging
  button.draggable = "true"
  button.addEventListener("dragstart", drag)
  // dragging

  button.addEventListener("click", function() {
    //window.location.href = "/set/"+setName+"/set"
    window.history.pushState(setName, setName + " - brainTrain", "/set/"+setName+"/set")
    historyTraversal = document.createElement("script")
    historyTraversal.src = "/static/historyTraversal.js"
    document.head.append(historyTraversal)

    $("body").load("/set_mainpage.html")


  })
  return button
}
function newFunctionalButtons(innerHTML) {
  button = document.createElement("button")
  button.classList.add("setListButton")
  text = document.createElement("span")
  text.innerHTML = innerHTML
  text.classList.add("setListText")
  button.classList.add("gradient-border")
  button.append(text)
  return button
}


function addFolders() {
  //bfetch("/folders/all", "GET")
  //  .then((response) => response.json())
  foldersrequest.json()
                .then((data) => {
                  dashboard = document.getElementById("dashboard")
                  for (let [folder, sets] of Object.entries(data)) {
                    allDiv = document.createElement("div")
                    allDiv.allMySets = []
                    // dragging
                    allDiv.ondragover = "allowDrop(event)"
                    allDiv.ondrop = "drop(event)"
                    allDiv.addEventListener("dragover", allowDrop)
                    allDiv.addEventListener("drop", drop)
                    // dragging
                    allDiv.classList.add("setListField")
                    title = document.createElement("h2")
                    title.classList.add("setcategories")
                    title.textContent = folder

                    setHolder = document.createElement("div")
                    setHolder.classList.add("setListSetsHolder")

                    allDiv.append(title); allDiv.append(setHolder)

                    for (let set in sets) {
                      setHolder.append(newSetButton(sets[set]))
                      allDiv.allMySets.push(set)
                    }
                    deleteBtn = newFunctionalButtons('<i class="fa-solid fa-trash"></i>')
                    deleteBtn.addEventListener("click", function() {
                      this.innerHTML = '<i style="color: red;" class="fa-solid fa-trash"></i><span style="color: #3489AE;">sure?</span>'
                      this.addEventListener("click", function() {
                        bfetch("/folders/delete","POST",JSON.stringify({folder: folder}))
                        this.parentNode.parentNode.remove()
                      })
                    },{ once: true })

                    setHolder.append(deleteBtn)
                    dashboard.append(allDiv)
                  }
                })
}

function changeDOMSets(setHolder) {
  for (let i in defaultSets) {
    setHolder.append(newSetButton(defaultSets[i]))
  }
  addFolders()
}

function allowDrop(event) {
  var setName = event.dataTransfer.getData("setName")
  if (this.allMySets.includes(setName)) {
    console.info("dragging disallowed")
    return false
  }
  console.info("dragging allowed")
  event.preventDefault();
}

function drag(event) {
  setName = event.target.children[0].textContent
  event.dataTransfer.setData("setName", setName)
  console.info("element is being dragged with the name", setName)
}

function drop(event) {
  event.preventDefault()
  var setName = event.dataTransfer.getData("setName")
  console.info(setName, "dragged")

  this.children[1].append(newSetButton(setName))
  this.allMySets.push(setName)

  bfetch("/folders/addSet", "POST", JSON.stringify({folder: this.children[0].textContent, set: setName}))
    .then((response) => {
      console.log(response)
      window.location.reload()
    })
}


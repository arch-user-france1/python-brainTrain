var setInFolders
( async () => {
  let foldersreq = await fetch("/folders/all")
  let folders = await foldersreq.json()
  console.log("folders",folders)
  setInFolders = []
  var setNameHuman = getSetNameHuman()
  for (let i in folders) {
    if (folders[i].includes(setNameHuman)) {
      setInFolders.push(i)
      addFolderToList(i)
    } else {
      addFolderNotInList(i)
    }
  }
})()


function addFolderToList(foldername) {
  let foldersDiv = document.getElementById("folders")

  let folderDiv = document.createElement("button")
  folderDiv.title = "remove set from folder"
  folderDiv.classList.add("folder-button")
  folderDiv.classList.add("gradient-border")
  let text = document.createElement("span")
  text.textContent = foldername
  text.classList.add("folder-text")
  let folderIcon = document.createElement("span")
  folderIcon.classList.add("folder-icon")
  folderIcon.innerHTML = '<i class="fa-regular fa-folder"></i>'
  folderDiv.append(folderIcon, text)
  foldersDiv.append(folderDiv)

  let removeIcon = document.createElement("i")
  removeIcon.classList.add("fa-solid", "fa-square-minus", "folder-remove")
  folderDiv.append(removeIcon)

  folderDiv.addEventListener("click", function() {
    this.style.pointerEvents = "none"
    var folderName = this.children[1].textContent
    bfetch("/folders/removeSet", "POST", JSON.stringify({
      folder: foldername,
      set: getSetNameHuman()
    }))
      .then((response) => {
        if (response.ok) {
          addFolderNotInList(this.children[1].textContent)
          this.remove()
        }
      })
  })
}

function addFolderNotInList(foldername) {
  let foldersDiv = document.getElementById("folders-add")

  let folderDiv = document.createElement("button")
  folderDiv.title = "add set to folder"
  folderDiv.classList.add("folder-button")
  folderDiv.classList.add("gradient-border")
  let text = document.createElement("span")
  text.textContent = foldername
  text.classList.add("folder-text")
  let folderIcon = document.createElement("span")
  folderIcon.classList.add("folder-icon")
  folderIcon.innerHTML = '<i class="fa-regular fa-folder"></i>'
  folderDiv.append(folderIcon, text)
  foldersDiv.append(folderDiv)

  let removeIcon = document.createElement("i")
  removeIcon.classList.add("fa-solid", "fa-square-plus", "folder-remove")
  folderDiv.append(removeIcon)

  folderDiv.addEventListener("click", function() {
    this.style.pointerEvents = "none"
    var folderName = this.children[1].textContent
    bfetch("/folders/addSet", "POST", JSON.stringify({
      folder: foldername,
      set: getSetNameHuman()
    }))
      .then((response) => {
        if (response.ok) {
          addFolderToList(this.children[1].textContent)
          this.remove()
        }
      })
  })
}

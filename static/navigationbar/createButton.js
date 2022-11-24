function newButton(div, text, func) {
  const createNewSetBtn = document.createElement("button")
  createNewSetBtn.style.backgroundColor = "transparent"
  createNewSetBtn.style.border = "none"
  createNewSetBtn.style.width = "100%"
  createNewSetBtn.style.display = "flex"
  createNewSetBtn.style.alignItems = "center"
  createNewSetBtn.style.borderRadius = ".5rem"

  createNewSetBtn.addEventListener("click", function() {
    func()
  })


  createNewSetBtn.style.transitionDuration = "0.5s"
  createNewSetBtn.addEventListener("mouseover", function(){
    createNewSetBtn.style.backgroundColor = "#F0F0F0"
  })
  createNewSetBtn.addEventListener("mouseout", function(){
    createNewSetBtn.style.backgroundColor = "transparent"
  })


  const createNewSetBtnText = document.createElement("p")
  createNewSetBtnText.style.color = "#929AB3"
  createNewSetBtnText.style.opacity = "1"
  createNewSetBtnText.style.fontSize = "1em"
  createNewSetBtnText.textContent = text
  createNewSetBtn.appendChild(createNewSetBtnText)

  div.append(createNewSetBtn)
  return createNewSetBtn
}



function rtp(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

var dropdown = document.getElementById("createDropdown")
var button = document.getElementById("create")
var buttonPos = button.getBoundingClientRect();

dropdown.style.opacity = "0"
dropdown.style.display = "none"
dropdown.style.zIndex = 999

dropdown.style.transitionDuration = "0.6s"
dropdown.style.backgroundColor = "#FFFFFF"
dropdown.style.borderRadius = "0.5rem"
dropdown.style.width = buttonPos.width +"px"

dropdown.style.position = "fixed"
dropdown.style.left = buttonPos.left + "px"
dropdown.style.top = (buttonPos.top + rtp(2.4)) + "px"

setButton = newButton(dropdown, "SET", function() {
  window.location.href = "/newset"
})
folderButton = newButton(dropdown, "FOLDER", async function() {
  input = document.createElement("input")
  input.id = "new-folder-input"
  input.style.opacity = 0
  document.body.append(input)
  input.style.transition = "opacity .5s linear, border-radius 1.5s ease-in"
  input.style.position = "absolute"
  input.style.left = "5%"
  input.style.right = "5%"
  input.style.top = "30%"
  input.style.width = "90%"
  input.style.height = "2rem"
  input.style.fontSize = "1.5rem"
  input.style.zIndex = 2000
  input.style.color = "#FFF"
  input.style.backgroundColor = "rgba(255, 255, 255, 0.7)"
  input.style.border = "none"
  input.style.outline = "thick double #32a1ce"
  input.placeholder = "name your new folder"
  input.style.textAlign = "center"
  input.focus()

  dropdown.style.opacity = "0"
  dropdown.style.display = "none"

  input.addEventListener("keyup", async function (event) {
    if (event.key === "Escape") {
      this.style.transition = ".4s"
      this.blur()
      this.style.opacity = 0
      await delay(400)
      this.remove()
    } else if (event.key === "Enter") {
      bfetch("/folders/new", "POST", JSON.stringify({name: this.value}))
        .then((response) => {
          this.style.transition = ".4s"
          if (response.ok) {
            return response.text()
          }
          else {
            this.style.outline = "thick double red"
          }
        })
        .then((responseTxt) => {
          if (responseTxt === "True") {
            this.style.outline = "thick double green"
            setTimeout(() => {this.blur()}, 500)
          }
          else {
            this.style.outline = "thick double orange"
            this.value = ""
            this.placeholder = "folder exists already"
          }
        })
    }
  })
  input.addEventListener("blur", async function () {
    this.style.transition = ".4s"
    this.blur()
    this.style.opacity = 0
    await delay(400)
    this.remove()
  })

  await delay(50)
  input.style.opacity = 1
  input.style.borderRadius = ".25rem"
})

var setIcon = document.createElement('i')
setIcon.innerHTML = '<i class="fa-regular fa-copy"></i>'
setIcon.style.paddingLeft = "0.4rem"
setButton.append(setIcon)
var folderIcon = document.createElement('i')
folderIcon.innerHTML = '<i class="fa-regular fa-folder"></i>'
folderIcon.style.paddingLeft = "0.4rem"
folderButton.append(folderIcon)

setButton.classList.add("dropdownButtons")
folderButton.classList.add("dropdownButtons")
setButton.id = "setButton"
folderButton.id = "folderButton"


button.addEventListener("click", function(){
  const buttons = document.getElementsByClassName("dropdownButtons")
  const dropdown = document.getElementById("createDropdown")
  if (dropdown.style.display == "none") {
    dropdown.style.display = ""
    dropdown.style.opacity = "1"
  }else {
    if (dropdown.style.display != "none") {
      dropdown.style.opacity = "0"
      dropdown.style.display = "none"
    }
  }
})

button.addEventListener("focusout", function(){
  const setButton = document.getElementById("setButton")
  const folderButton = document.getElementById("folderButton")
  if (!setButton.matches(':hover') && !folderButton.matches(':hover')) {
    dropdown.style.display = "none"
    dropdown.style.opacity = "0"
  }
})

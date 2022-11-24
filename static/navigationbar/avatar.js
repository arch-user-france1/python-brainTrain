function newButton(div, text) {
  var newBtn = document.createElement("button")
  newBtn.classList.add("avatarBtns")
  newBtnTxt = document.createElement("p")
  newBtnTxt.textContent = text
  newBtnTxt.classList.add("avatarBtnTxts")
  newBtn.append(newBtnTxt)
  div.append(newBtn)
  return newBtn
}

function rtp(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
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


var dropdwn = document.getElementById("avatarDropdown")
var button = document.getElementById("avatar-button")
var buttonPos = button.getBoundingClientRect();

dropdwn.style.opacity = "0"
dropdwn.style.display = "none"
dropdwn.style.zIndex = 999

dropdwn.style.transitionDuration = "0.6s"
dropdwn.style.backgroundColor = "#0A092D"
dropdwn.style.border = "1px solid #1A1D28"
//dropdwn.style.boxShadow = "0 0px 7px #FFF"
dropdwn.style.borderRadius = "0.5rem"
dropdwn.style.width = "2rem;"

dropdwn.style.position = "fixed"
dropdwn.style.left = (buttonPos.left - 60) + "px"
dropdwn.style.top = (buttonPos.top + rtp(3)) + "px"

function updateAvatarDropdown() {
  element = document.getElementById("avatarDropdown")
  button = document.getElementById("avatar-button")
  buttonPos = button.getBoundingClientRect();

  dropdwn.style.left = (buttonPos.left - 60) + "px"
  dropdwn.style.top = (buttonPos.top + rtp(3)) + "px"
}
window.addEventListener("resize", updateAvatarDropdown);
(async function() {await delay(50); updateAvatarDropdown()})()

button.addEventListener("click", function(){
  const dropdown = document.getElementById("avatarDropdown")
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

button.addEventListener("focusout", function() {
  children = document.getElementById("avatarDropdown").children
  hovermatch = false
  for (let key of children) {
    if (key.matches(":hover")) {
      hovermatch = true
    }
  }
  if (!hovermatch) {
    dropdown = document.getElementById("avatarDropdown")
    dropdown.style.display = "none"
    dropdown.style.opacity = "0"
  }
})

accountDetails = document.createElement("div")
accountDetails.id = "account-details"
img = document.createElement("div")
img.innerHTML = '<img src="/static/images/avatars/test-cat.jpg" id="avatar-img" class="avatar"/>'
accountDetails.append(img)
usernameTxt = document.createElement("p")
usernameTxt.id = "dropdown-username"
bfetch("/getUsername","GET")
  .then((resp) => resp.text())
  .then((data) => {
    document.getElementById("dropdown-username").textContent = data
  })
  .catch((e) => {
    document.getElementById("dropdown-username").textContent = "error"
    console.error(e)
  })

accountDetails.append(usernameTxt)
dropdwn.append(accountDetails)


settingsBtn = newButton(dropdwn, "settings")
settingsBtn.addEventListener("click", function() {
  //window.location.href = "/settings"
  loadNewSite("/settings", "settings")
})

if ('serviceWorker' in navigator) {
  updateBtn = newButton(dropdwn, "update & reload")
  updateBtn.addEventListener("click", function() {

    caches.delete("v1").then(async (response) => {
      navigator.serviceWorker.getRegistrations()
               .then(async function (registrations) {
                 if (registrations.length) {
                   for(let registration of registrations) {
                     await registration.update()
                   }
                 }
                 window.location.reload()
               });
    })
  })
}


logoutBtn = newButton(dropdwn, "logout")
logoutBtn.addEventListener("click", async function() {
  await caches.delete("offlinestorage")
  window.location.href = "/logout"
})

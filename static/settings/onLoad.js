function newSettingsSection(icon, title) {
  section = document.createElement("div")
  section.classList.add("settingsSection")

  boxTitle = document.createElement("div")
  boxTitle.classList.add("settingsBoxTitle")
  boxTitle.innerHTML = icon
  boxTitle.children[0].classList.add("settingsBoxIcon")
  boxTitleTextDiv = document.createElement("div")
  boxTitleTextDiv.classList.add("settingsBoxTitleTextDiv")
  boxTitleText = document.createElement("h4")
  boxTitleText.classList.add("settingsBoxTitleText")
  boxTitleText.textContent = title
  boxTitle.append(boxTitleTextDiv)
  boxTitleTextDiv.append(boxTitleText)

  contentDiv = document.createElement("div")
  contentDiv.classList.add("settingsBoxContent")

  section.append(boxTitle)
  section.append(contentDiv)
  document.getElementById("win").append(section)
  return contentDiv
}
function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;" + "SameSite=Strict;";
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


function addText(type, text) {
  e = document.createElement(type)
  e.textContent = text
  return e
};

(() => {
  var premium = newSettingsSection('<i class="fa-solid fa-rocket"></i>', "PREMIUM")
  premium.append(addText("h2", "There is no premium at the moment"))
  premium.append(addText("p","There might be premium in the future though - and that's the reason why it's here."))

  var sync = newSettingsSection('<i class="fa-solid fa-rotate"></i>', "SYNCHRONISATION")
  sync.append(addText("h2", "Enable Automatic Synchronisation"))
  sync.append(addText("p", "Enable automatic synchronistation to make sure that your devices are synced all the time."))
  sync.append(addText("p", "Note: Changing won't do anything yet. Once implemented your setting will be applied automatically."))
  sync.append(document.createElement("br"))

  syncEnableButton = document.createElement("button")
  syncEnableButton.id = "enableSync"
  syncEnableButton.classList.add("buttons-toggle")
  text = document.createElement("p")
  text.textContent = "Enable automatic synchronisation"
  syncEnableButton.append(text)
  function updateSyncEnableButton() {
    bfetch("/settings/autosync", "GET")
      .then((resp) => resp.text())
      .then((data) => {
        if (data == "True") {
          text.textContent = "Disable automatic synchronisation"
        }
        else {
          text.textContent = "Enable automatic synchronisation"
        }
      })
  }
  updateSyncEnableButton()

  syncEnableButton.addEventListener("click", function() {
    bfetch("/settings/autosync", "GET")
      .then((resp) => resp.text())
      .then((data) => {
        if (data == "False") {
          isTrue = "True"
        }
        else {
          isTrue = "False"
        }
        bfetch("/settings", "POST", JSON.stringify({'autosync': isTrue}))
          .then((resp) => resp.json())
          .then((data) => {
            if (data['success'].length > 0) {
              updateSyncEnableButton()
            }
            else {
              document.getElementById("enableSync").children[0].textContent = "Failed"
            }
          })
          .catch((e) => {
            console.error(e)
            document.getElementById("enableSync").children[0].textContent = "Failed"
          })
      })
  })

  sync.append(syncEnableButton)

  var profile = newSettingsSection('<i class="fa-regular fa-user"></i>', "PROFILE")



  toggleAnimations = newSettingsSection('<i class="fa-solid fa-bomb fancy-rgb"></i>', "FANCY")
  toggleAnimations.append(addText("h2", "Changing Colors"))
  toggleAnimations.append(addText("p", "If you don't like changing colors turn it off here."))
  toggleAnimations.append(addText("br", "Note: This setting is browser specific and not going to be stored in the cloud."))
  animationButton = document.createElement("button")
  animationButton.id = "animation-button"
  animationButton.classList.add("buttons-toggle")
  textAB = document.createElement("p")
  textAB.textContent = "Disable changing colors"
  animationButton.append(textAB)

  updateAnimationButtonText()
  function updateAnimationButtonText() {
    animations = getCookie("animations")
    if (animations == "true") {
      textAB.textContent = "Disable changing colors"
    }
    else {
      textAB.textContent = "Enable changing colors"
    }

  }
  animationButton.addEventListener("click", function() {
    animations = getCookie("animations")
    if (animations == "true") {
      setCookie("animations", "false", 3650)
    }
    else {
      setCookie("animations", "true", 3650)
    }
    updateAnimationButtonText()
  })

  toggleAnimations.append(animationButton)
})();

animations = getCookie("animations")
if (animations == "") {
  setCookie("animations", "true", 3650)
}

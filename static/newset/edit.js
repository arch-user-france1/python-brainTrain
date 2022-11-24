let originsetName = decodeURI(window.location.href.split("/")[4])

setNameInput = document.getElementById("setName")
setNameInput.value = originsetName
document.getElementById("donebtn").style.opacity = "1"

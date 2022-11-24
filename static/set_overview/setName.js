var setName = window.location.href.split("/")[4]
var setNameHuman = decodeURI(setName)

document.getElementById("title").textContent = setNameHuman

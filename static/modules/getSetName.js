function getSetName() {
  return window.location.href.split("/")[4]
}
function getSetNameHuman() {
  return decodeURI(getSetName())
}

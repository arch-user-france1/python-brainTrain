function loadNewSiteNoAutoAddBrainTrain(URL, NAME) {
  window.history.pushState(NAME, NAME, "URL")
  $("body").load(URL)
}
function loadNewSite(URL, NAME) {
  window.history.pushState(NAME, NAME + " - brainTrain", URL)
  $("body").load(URL)
}

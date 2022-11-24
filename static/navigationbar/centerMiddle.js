function updateMiddleNavBar() {
  element = document.getElementById("navigation-middle")
  thisWidth = element.getBoundingClientRect().width
  middle = window.innerWidth / 2
  element.style.position = "absolute"
  element.style.left = (middle - thisWidth / 2)+"px"
}
window.addEventListener("resize", updateMiddleNavBar)
document.getElementById("navigation-middle").style.transition = "1s";

(async function() {
  await delay(5)
  updateMiddleNavBar()
})();

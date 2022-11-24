window.addEventListener("DOMContentLoaded", function () {
  document.body.style.transform = "translateX("+(-window.innerWidth)+"px)"
  document.body.style.opacity = 0
})
window.addEventListener("load", async function() {
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  document.body.style.opacity = 1
  document.body.style.transition = ".1s"

  document.body.style.transform = ""
})

document.addEventListener("DOMContentLoaded", function() {
  window.addEventListener("scroll", function() {
    scrollPercentage = 1 - (this.scrollY/50)
    document.getElementById("navigationbar").style.opacity = scrollPercentage
  })
})

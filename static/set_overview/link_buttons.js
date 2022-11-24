try {
  let setName = decodeURI(window.location.href.split("/")[4])
}
catch {
  setName = decodeURI(window.location.href.split("/")[4])
}

function on_buttonclick_old() {
  winSize = window.innerWidth
  document.body.style.transform = "translateX("+winSize+"px)"
}
function on_buttonclick() {
  document.body.style.opacity = "0"
}
function on_jQueryload() {
  document.body.style.opacity = "1"
}
document.getElementById("train").addEventListener("click", async function() {
  on_buttonclick()
  await delay(150)
//  window.location.href = "/set/"+setName+"/learn"
  window.history.pushState(setName, setName + " - brainTrain", "/set/"+setName+"/learn")
  $("body").load("/learn.html"); on_jQueryload()
})

document.getElementById("edit").addEventListener("click", async function() {
  on_buttonclick_old()
  await delay(150)
  window.location.href = "/set/"+setName+"/edit"
})

document.getElementById("delete").addEventListener("click", async function(event) {
  this.children[1].textContent = "sure?"
  event.stopPropagation()
  document.addEventListener("click", async function() {
    bfetch("/set/"+setName+"/delete", "POST", "")
      .then((response) => response.text())
      .then((data) => {
        console.log(data)
        if (data == "true") {
          document.getElementById("delete").children[1].textContent = "success :)"
          window.location.href = "/"
        }
        else {
          document.getElementById("delete").children[1].textContent = "failed :("
        }
      })
  })
}, { once: true })





window.addEventListener( "pageshow", function ( event ) {
  var historyTraversal = event.persisted ||
                         ( typeof window.performance != "undefined" &&
                              window.performance.navigation.type === 2 );
  if ( historyTraversal ) {
    // Handle page restore.
    document.body.style.transform = ""
  }
});

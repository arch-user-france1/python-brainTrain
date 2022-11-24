fetch("/checksession")
  .then((response) => response.text())
  .then( async (isLoggedin) => {
    if (isLoggedin == "true") {
      $("body").load("/static/navigationbar.html")
      console.info("you are logged in")
      await delay(500)
    }
    var content = document.createElement("div")
    content.id = "content_shared"
    let fuckingp = document.createElement("p")
    fuckingp.textContent = "asdojhaskjdhkjsah"
    content.append(fuckingp)
    document.body.append(content)
    content.style.opacity = "0"
    content.style.transition = "1s"
    //$("content").load("/static/set_sharedpage.html")
    fetch("/static/set_sharedpage.html")
      .then((response) => response.text())
      .then((data) => {
        content.innerHTML = data
        content.style.opacity = 1
        var setNameHuman = decodeURI(window.location.href.split("/")[5])
        console.log(setNameHuman)
        let title = document.getElementById("title")
        title.textContent = setNameHuman


        var usernameSharer = decodeURI(window.location.href.split("/")[4])
        var usernameSharers = document.getElementsByClassName("username-sharer")
        for (let i in usernameSharers) {
          usernameSharers[i].textContent = usernameSharer
        }
      })
  })

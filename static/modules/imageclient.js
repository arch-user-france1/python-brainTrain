( async () => {
  async function imageservice() {
    let response = await fetch("/imageofthetime-version")
    if (!response.ok) {
      return
    }
    else {
      let data = await response.text()
      data = Number(data)
      if (data !== imageNr && typeof data == "number") {
        imageNr = data
        let URL = "/imageofthetime.webp?asdasd="+imageNr
        document.documentElement.style.background = "url("+URL+"), linear-gradient(0deg, #2E2E2E, #1C1C1C)"
      }
    }
  }
  //////
  let response = await fetch("/imageofthetime-version")
  response = await response.text()
  response = Number(response)
  if (typeof response == "number") {

    var imageNr = response
    let URL = "/imageofthetime.webp?asdasd="+imageNr
    document.documentElement.style.background = "url("+URL+"), linear-gradient(0deg, #2E2E2E, #1C1C1C)"

  } else {
    console.error("ImageOfTheTime version is not number:",typeof response)
  }
  setInterval(imageservice, 15000)
})();

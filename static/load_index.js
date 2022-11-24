bfetch("/checksession", "GET")
  .then((response) => response.text())
  .then(async (isLoggedin) => {
    if (isLoggedin == "true") {
      // load the style and service worker script
      let style = document.createElement("link")
      style.href = "/static/index2/style_optimized.css"
      style.rel = "stylesheet"
      document.head.append(style)
      let script = document.createElement("script")
      script.src = "/static/sw.js"
      document.head.append(script)

      // load navigationbar resources
      function newStyle(URL) {
        let link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = URL
        document.head.append(link)
      }
      function newScript(URL) {
        let script = document.createElement("script")
        script.src = URL
        document.head.append(script)
      }
      newStyle("/static/fontawesome/css/all.css")
      newStyle("/static/navigationbar/navigationbar.css")
      newScript("/static/navigationbar/hideOnScroll.js")

      $("body").load("index2.html")
    } else {
      $("body").load("index.html")
    }
  })

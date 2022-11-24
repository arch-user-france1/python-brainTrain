function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;" + "SameSite=Strict;";
}

function getCookie(cname) {
  let name = cname + "=";
  let ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function checkCookie() {
  let user = getCookie("username");
  if (user != "") {
    alert("Welcome again " + user);
  } else {
    user = prompt("Please enter your name:", "");
    if (user != "" && user != null) {
      setCookie("username", user, 365);
    }
  }
}


function deployContinueKey() {
  document.addEventListener("keypress", function onEvent(event) {
    //console.log("Keypress - ", event.key)
    if (event.key === " ") {
      window.location.pathname = "/trainer/"+getCookie("setname")+"/next"
    }
  })
}

status = getCookie("status")
console.log("STATUS: ",status)
if (status == "CLEAR") {
  console.log("clearing history")
  window.location.pathname = "/trainer/"+getCookie("setname")+"/next"
}
else if (status == "RELOAD") {
  console.log("reloading")
  window.location.pathname = "/trainer/"+getCookie("setname")
}
else if (status == "DONE") {
  console.log("done")
  window.location.pathname = "/start"
}
else if (status == "CRASH") {
  console.log("The thread which is responsible for serving the words has crashed.")
  window.location.pathname = "/"
}

//window.onbeforeunload = function () {
//  return "Do not reload the page."
//}


const input = document.getElementById("answ");
var inputValue = document.getElementById.value;
input.addEventListener("keypress", function(){
  const definition = getCookie("definition")
  const correctAnswer = getCookie("answer")
  if (event.key === 'Enter') {
    document.addEventListener('focusout', function(e) {document.getElementById("answ").focus()}) // force focus

    inputValue = input.value;
    if (inputValue.includes(" ")) {
      inputValue = '"'+inputValue+'"'     // fix the sentence "" bug
    }

    if (inputValue == correctAnswer) {
      setCookie("correct", true, 1)
      setname = getCookie("setname")
      input.addEventListener("keypress", function() {input.value = answer})
      input.style.border = "3px solid #1AE51A"
      input.style.color = "#1AE51A"
      input.style.backgroundColor = "#646F90"
      setTimeout(function () {
        window.location.href = "/trainer/"+getCookie("setname")+"/next";
      }, 1000); //will call the function after 2 secs.
      deployContinueKey(setname)


    } else {
      setCookie("correct", false, 1)
      setname = getCookie("setname")
      console.log("not so bravo, that's wrong: ", inputValue, correctAnswer)

      input.addEventListener("keypress", function(event) {event.preventDefault()})
      input.style.backgroundColor = "#FF1A1D"
      input.style.color = "#1AFFFC"
      input.style.border = "3px solid #A80003"

      const correctAnswerTextfield = document.getElementById("correctans")
      correctAnswerTextfield.style.opacity = "1"
      correctAnswerTextfield.style.color = "#1AE51A"

      correctButton = document.getElementById("correctButton")
      correctButton.style.opacity = "1";

      correctButton.addEventListener("click", function (){
        input.style.backgroundColor = "#646F90"
        input.style.animation = "0.6s"
        input.style.color = "#1AE51A"
        input.style.border = "3px solid #A80003"
        this.style.opacity = "0.2"
        setCookie("correct", true, 1)
         setTimeout(function () {
        window.location.href = "/trainer/"+getCookie("setname")+"/next";
      }, 1500)})

      deployContinueKey(setname)
    }
  }
})

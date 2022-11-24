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



usernameField = document.getElementById("usernameFld")
passwdField = document.getElementById("passwordFld")

usernameField.addEventListener("keypress", function(event){
  if (event.key == 'Enter') {
    passwdField.focus()
  }
})
passwdField.addEventListener("keypress", function(event){
  if (event.key == 'Enter') {
    done()
  }
})
document.getElementById("login-button").addEventListener("click", function(event){
  done()
})


function done() {
  /// sending the credentials to the server
  const postjsonobject = {username: usernameField.value,
                          password: passwdField.value}

  postjsondata = JSON.stringify(postjsonobject)

  fetch("/loginpost",
        {method: "POST",
         cache: 'no-cache',
         headers: {'Content-Type': 'application/json'},
         body: postjsondata
        })
    .then((response) => {
      if (!response.ok) {
        errorElement = document.getElementById("failure")
        errorElement.style.display = "inline"
      }
      else {
        errorElement = document.getElementById("failure")
        errorElement.remove()
        window.location = "/"
      }
    })
}

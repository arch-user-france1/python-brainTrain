function loadFile(filePath) {
  var result = null;
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open("GET", filePath, false);
  xmlhttp.send();
  if (xmlhttp.status==200) {
    result = xmlhttp.responseText;
  }
  return result;
}
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

function enableAnimations() {
  for (const [key, value] of Object.entries(elementDict)) {
      value["para"].style.animation = ''
      value["para"].style.backgroundImage = ''
  }
}
function disableAnimations(){
  for (const [key, value] of Object.entries(elementDict)) {
    value["para"].style.animation = "none"
    value["para"].style.color = "#88DCDC"
    value["para"].style.backgroundColor = "#88DCDC"
    value["para"].style.backgroundImage = "none"
  }
}

var sets = loadFile("/sets.txt").split("\n");

const elementDict = Object.create(null)
const textfield = document.getElementById("setsfield")

elementDict["line1"]={};

elementDict["line1"]["para"] = document.createElement("a");
elementDict["line1"]["node"] = document.createTextNode(sets[0])
elementDict["line1"]["para"].appendChild(elementDict["line1"]["node"])

elementDict["line1"]["para"].style.color = "#88DCDC"
elementDict["line1"]["para"].style.fontSize = "200%";
elementDict["line1"]["para"].classList.add("sets")

elementDict["line1"]["div"] = document.createElement("div");
elementDict["line1"]["div"].appendChild(elementDict["line1"]["para"])
elementDict["line1"]["div"].style.height = "40px";

textfield.appendChild(elementDict["line1"]["div"])

sets.shift()

for (i = 0; i < sets.length; i++) {
  elementDict[sets[i]]={};

  elementDict[sets[i]]["para"] = document.createElement("a");
  const setName = sets[i].split("\r")[0];
  const setDate = sets[i].split("\r")[1];
  elementDict[sets[i]]["node"] = document.createTextNode(setName)
  elementDict[sets[i]]["para"].appendChild(elementDict[sets[i]]["node"])

  //elementDict[sets[i]]["para"].style.color = "#3489AE";
  elementDict[sets[i]]["para"].href = "/set/" + setName + "/set"
  elementDict[sets[i]]["para"].classList.add("sets")

  elementDict[sets[i]]["div"] = document.createElement("div");
  elementDict[sets[i]]["div"].appendChild(elementDict[sets[i]]["para"]);
  elementDict[sets[i]]["div"].style.height = "20px";
  textfield.appendChild(elementDict[sets[i]]["div"])
}


//disable animations if the cookie is set
animations = getCookie("animations")
if (animations == "false") {
  disableAnimations()
  //document.getElementById("animationsCheckbox").checked = true
}



// disable animations if the checkbox is checked
/*
checkbox = document.getElementById("animationsCheckbox")
checkbox.addEventListener('change', function () {
  if (this.checked) {
    disableAnimations()
    setCookie("animations", false, 1000)
  }
  else {
    enableAnimations("animations", true)
    setCookie("animations", true, 1000)
  }
})
*/

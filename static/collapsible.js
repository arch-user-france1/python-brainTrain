var coll = document.getElementsByClassName("collapsible");
var i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", function() {
    this.classList.toggle("active");
    var content = this.nextElementSibling;
    const buttonText = document.getElementById("newFont")

    if (content.style.maxHeight){
      content.style.maxHeight = null;
      newFont.textContent = "NEW →"
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
      newFont.textContent = "NEW ↓"
    }
  });
}

document.getElementsByTagName("form")[0].onsubmit = function(e) {
	var username = document.getElementById("username"),
	 	password = document.getElementById("password");

	username.className = "";
	password.className = ""; 

	 if(!username.value){
	 	username.className = "error";
	 }
	 if(!password.value){
	 	password.className = "error";
	 }
	 if(!password.value || !username.value) {
	 	e.preventDefault();
	 }
}
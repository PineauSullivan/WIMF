function s4() {
	return Math.floor(( 1 + Math.random()) * 0x10000)
	.toString(16)
	.substring(1);
}

function guid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + 
	s4() + '-' + s4() + s4() + s4();
}

function create(nForm){
	if(nForm.channel.value!=""){
	  	var channel = nForm.channel.value;
		console.log('channel: ',channel);

	  	var xhr = new XMLHttpRequest();
	  	var nouveau = true;
		xhr.onreadystatechange = function($evt){
			if(xhr.readyState == 4 && xhr.status == 200){
				var res = JSON.parse(xhr.responseText);
				console.log('response: ',res);
				if(res.s=="ok"){
					alert("Vous venez de créer un nouveau channel !");
				}else{
					nouveau = false;
					alert("Vous allez rejoindre un channel déjà existant !");
				}
				document.location.href="app/index.html?"+channel;
			}
		}
		if(nouveau){
			xhr.open('PUT', "https://ws.xirsys.com/_ns/www.wimf.com/wimf-foglet/"+channel, true);
			xhr.setRequestHeader ("Authorization", "Basic " + btoa("WhereIsMyFriends:3fea7eb8-d07b-11e7-be18-fd777e1dd627") );
			xhr.send();			
		}
	}

}

function generate(nForm){
	nForm.channel.value = guid();
}
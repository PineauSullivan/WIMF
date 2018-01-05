function s4() {
	return Math.floor(( 1 + Math.random()) * 0x10000)
	.toString(16)
	.substring(1);
}

function guid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' + 
	s4() + '-' + s4() + s4() + s4();
}

var channelG =  guid();

function create(nForm){
	console.log('channel: ',channelG);
  	var xhr = new XMLHttpRequest();
	console.log('Log 1');
	xhr.onreadystatechange = function($evt){
	if(xhr.readyState == 4 && xhr.status == 200){
		console.log('Log 2');
	     var res = JSON.parse(xhr.responseText);
	     console.log('response: ',res);
	     if(res.s=="ok"){
		    document.getElementById("buttonCreate").style.backgroundColor = "green";
	     	document.location.href="app/index.html?"+channelG;
	     }else{
		    channelG =  guid();
		    document.getElementById("buttonCreate").style.backgroundColor = "red";
	     }
	}

	console.log('Log 3');

	xhr.open('PUT', "https://ws.xirsys.com/_ns/www.wimf.com/wimf-foglet/"+channelG, true);
	xhr.setRequestHeader ("Authorization", "Basic " + btoa("WhereIsMyFriends:3fea7eb8-d07b-11e7-be18-fd777e1dd627") );
	xhr.send();

  }

}

function join(nForm){
  if(nForm.channel.value!=""){
  	var channel =  nForm.channel.value;
	console.log('channel: ',channel);
	//faire test s'il existe !!!

     document.location.href="app/index.html?"+channel;
	}
}


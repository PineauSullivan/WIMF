function create(nForm){
  if(nForm.channel.value!=""){
  	var channel =  nForm.channel.value;
	console.log('channel: ',channel);

  	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function($evt){
	 if(xhr.readyState == 4 && xhr.status == 200){
	     var res = JSON.parse(xhr.responseText);
	     console.log('response: ',res);
	     if(res.s=="ok"){
	     	document.location.href="app/index.html?"+channel;
	     }
	 }
	}

	xhr.open('PUT', "https://ws.xirsys.com/_ns/www.wimf.com/wimf-foglet/"+channel, true);
	xhr.setRequestHeader ("Authorization", "Basic " + btoa("PineauSullivan:48adce60-cbf8-11e7-8662-39c68c71e856") );
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


'use strict'

const Foglet = require('foglet').Foglet

var mail;

function authentification(nForm){
  if(nForm.mail.value!=""){
    alert("Vous êtes désormais authentifier avec le mail : "+nForm.mail.value);
    mail = nForm.mail.value;
    var divNoConnect = document.getElementById("noconnect");
    var divConnect = document.getElementById("connect");
    divNoConnect.style.display = "none";
    divConnect.style.display = "initial";
  }
}

const app = new Foglet({
  verbose: true, // activate logs. Put false to disable them in production!
  rps: {
    type: 'spray-wrtc',
    options: {
      protocol: 'foglet-hello-world', // name of the protocol run by your app
      webrtc:	{ // WebRTC options
        trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
        iceServers : [] // iceServers, we lkeave it empty for now
      },
      timeout: 2 * 60 * 1000, // WebRTC connections timeout
      delta: 10 * 1000, // spray-wrtc shuffle interval
      signaling: { //
        address: 'http://localhost:3000/',
        room: 'foglet-hello-world-room' // room to join
      }
    }
  }
})

// connect to the signaling server
app.share()

// connect our app to the fog
app.connection()
.then(() => {
  console.log('application connected!')
  var longitude,latitude;

  var amis =  [];
  var listeAjoutAmisEnAttente = [];
  var listeDemandeAmisEnAttente = [];

  var amisInitialiseBool = true;

  // listen for incoming broadcast
  app.onUnicast((id, msg) => {
    console.log('I have received a message from peer', id, ':', msg.type);
    traiterMessage(id, msg);
  })

    // listen for incoming broadcast
  app.onBroadcast((id, msg) => {
    console.log('I have received a message from peer', id, ':', msg.type);
    traiterMessage(id, msg);
  })

  var map;
  function addMap(){ 
    map = new google.maps.Map(document.getElementById("map_canvas"), {
            zoom: 19,
            center: new google.maps.LatLng(47.2172500, -1.5533600),
            mapTypeId: google.maps.MapTypeId.ROADMAP
          });

    if (navigator.geolocation)
      var watchId = navigator.geolocation.watchPosition(successCallback,
                                null,
                                {enableHighAccuracy:true});
    else
      alert("Votre navigateur ne prend pas en compte la géolocalisation HTML5");

    function successCallback(position){
      map.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
      longitude = position.coords.longitude;
      latitude = position.coords.latitude;
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
        map: map
      });
    }
  }

  addMap();

  //-----------------------------------------//
  //traitement d'un message
  //-----------------------------------------//
  function traiterMessage(id, msg){
    console.log("Traitement du message en cours ... ...");
    console.log("Type du message : "+msg.type);    
    if(msg.type == "AjoutAmi" && msg.destinataire == mail){
      var infoAmi = {"mail" : msg.emeteur, "id" : id, "latitude" : 0, "longitude" : 0, "marker" : null};
      if(findFriend(listeAjoutAmisEnAttente,msg.emeteur)){
        gestionAmis(infoAmi);
      }else{ 
        if(!findFriend(listeDemandeAmisEnAttente,msg.emeteur)){
          listeDemandeAmisEnAttente.push(infoAmi);
          ActualiseListeDemandeAmisEnAttente();
        }
      }
    }else if(msg.type == "Location"){
      if(findFriend(amis, msg.emeteur)){
        actualisePosition(id, msg);
      }
    }
  }

  function actualisePosition(id, msg){
    var position = -1;
    for(var i = 0; i<amis.length; i++){
      if(amis[i].mail == msg.emeteur){
        position = i;
      }
    }
    if(position!=-1){
      amis[position].latitude = msg.latitude;
      amis[position].longitude = msg.longitude; 
      if(amis[position].marker == null){
        console.log("Nouveau Marker en : "+amis[position].latitude +", "+amis[position].longitude);
        var marker= new google.maps.Marker({
          position: new google.maps.LatLng(amis[position].latitude, amis[position].longitude),
          map: map
        });;
        amis[position].marker = marker;
      }else{
        console.log("update marker en  : "+amis[position].latitude +", "+amis[position].longitude);
        amis[position].marker.setPosition({lat: amis[position].latitude, lng: amis[position].longitude});
      }
    }
  }
  //-----------------------------------------//
  //gestion amis
  //-----------------------------------------//
  function gestionAmis(info){
    //suppression dans les deux listes
    var position = -1;
    for(var i = 0; i<listeDemandeAmisEnAttente.length; i++){
      if(listeDemandeAmisEnAttente[i].mail == info.mail){
        position = i;
      }
    }
    if(position!=-1){
      listeDemandeAmisEnAttente.splice(position,1);
      ActualiseListeDemandeAmisEnAttente();
    }
    position = -1;
    for(var i = 0; i<listeAjoutAmisEnAttente.length; i++){
      if(listeAjoutAmisEnAttente[i].mail == info.mail){
        position = i;
      }
    }
    if(position!=-1){
      listeAjoutAmisEnAttente.splice(position,1);
      actualiseListeAjoutAmisEnAttente();
    }
    //ajout dans la liste amis
    if(!findFriend(amis, info.mail)){
      amis.push(info);
      actualiseListeAmis();
      SendPosition();
    }

  }

  function SendPosition(){
    var data = {"type" : "Location", "emeteur" : mail , "latitude" : latitude, "longitude" : longitude};
    for(var i= 0; i<amis.length; ++i){
      console.log("Envoie pos à "+amis[i].id+" - "+amis[i].mail);    
      app.sendUnicast(amis[0].id, data);
    }
    setTimeout(SendPosition, 10000)
  }
  //-----------------------------------------//
  //Add Friend
  //-----------------------------------------//
  const btnAddFriend = document.getElementById("addFriend")
  btnAddFriend.addEventListener("click", () => {
    if(document.getElementById("mailFriend").value != ""){
      if(!findFriend(listeAjoutAmisEnAttente,document.getElementById("mailFriend").value)){
        var infoAmi = {"mail" :  document.getElementById("mailFriend").value, "id" : 0, "latitude" : 0, "longitude" : 0, "marker" : null};
        var data = {"type" : "AjoutAmi", "emeteur" : mail ,"destinataire" : document.getElementById("mailFriend").value};
        if(findFriend(listeDemandeAmisEnAttente,document.getElementById("mailFriend").value)){
          var position = -1;
          for(var i = 0; i<listeDemandeAmisEnAttente.length; i++){
            if(listeDemandeAmisEnAttente[i].mail == infoAmi.mail){
              position = i;
            }
          }
          gestionAmis(listeDemandeAmisEnAttente[position]);
        }else{
          listeAjoutAmisEnAttente.push(infoAmi);
          actualiseListeAjoutAmisEnAttente();
        }
        app.sendBroadcast(data);    
      }
    }
  }, false)
  
  function ActualiseListeDemandeAmisEnAttente(){
    var listText = "";
      for(var i = 0; i<listeDemandeAmisEnAttente.length; i++){
        if(i<listeDemandeAmisEnAttente.length - 1){
          listText = listText + listeDemandeAmisEnAttente[i].mail+", ";
        }else{
          listText = listText + listeDemandeAmisEnAttente[i].mail+".";
        }
      }
      document.getElementById("listeDemandeAmisEnAttente").innerHTML = listText; 
  }

  function actualiseListeAjoutAmisEnAttente(){
    var listText = "";
        for(var i = 0; i<listeAjoutAmisEnAttente.length; i++){
          if(i<listeAjoutAmisEnAttente.length - 1){
            listText = listText + listeAjoutAmisEnAttente[i].mail+", ";
          }else{
            listText = listText + listeAjoutAmisEnAttente[i].mail+".";
          }
        }
        document.getElementById("listeAjoutAmisEnAttente").innerHTML = listText;
  }


  function actualiseListeAmis(){
    var listText = "";
        for(var i = 0; i<amis.length; i++){
          if(i<amis.length - 1){
            listText = listText + amis[i].mail+", ";
          }else{
            listText = listText + amis[i].mail+".";
          }
        }
        document.getElementById("listeAmis").innerHTML = listText;
  }
  //-----------------------------------------//
  //Find Friend
  //-----------------------------------------//
  function findFriend(List, mail){
    var result = false;
    for(var i = 0; i<List.length; i++){
      if(List[i].mail==mail){
        result = true;
      }
    }
    return result;
  }


})
.catch(console.error) // catch connection errors

function addFriend(nForm){

}
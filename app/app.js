'use strict'

const Foglet = require('foglet').Foglet;
let app;
var channel = window.location.search.substring(1);
var pseudo = "";


function authentification(nForm){
  if(nForm.pseudo.value!=""){
    pseudo = nForm.pseudo.value;
    var divNoConnect = document.getElementById("noConnect");
    var divConnect = document.getElementById("Connect");
    divNoConnect.style.display = "none";
    divConnect.style.display = "initial";
    alert("Vous êtes désormais authentifié avec le pseudo : "+nForm.pseudo.value);
  }
}



var longitude,latitude;
var map;
var marker = null;

var amis =  [];
var listeAjoutAmisEnAttente = [];
var listeDemandeAmisEnAttente = [];

console.log('channel : ', channel);

function centerAmi(i){
  if(amis[i].latitude!=null&&amis[i].longitude!=null){
    map.panTo(new google.maps.LatLng(amis[i].latitude, amis[i].longitude));
  }
}

function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
    document.getElementById("main").style.marginLeft = "250px";
    document.body.style.backgroundColor = "rgba(0,0,0,0.4)";
}

function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").style.marginLeft= "0";
    document.body.style.backgroundColor = "white";
}


var iceServers;

$.ajax({
  url : "https://service.xirsys.com/",
  data : {
    ident: "WhereIsMyFriends",
    secret: "3fea7eb8-d07b-11e7-be18-fd777e1dd627",
    domain: "www.wimf.com",
    application: "wimf-foglet",
    room: channel,
    secure: 1
  }
  , success:function(response, status){
    console.log(status);
    console.log(response);
    /**
     * Create the foglet protocol.
     * @param {[type]} {protocol:"chat"} [description]
     */
     if(response.d.iceServers){
       iceServers = response.d.iceServers;
     }
    app = new Foglet({
      verbose: true, // activate logs. Put false to disable them in production!
      rps: {
        type: 'spray-wrtc',
        options: {
          protocol: channel, // name of the protocol run by your app
          webrtc: { // WebRTC options
            trickle: true, // enable trickle (divide offers in multiple small offers sent by pieces)
            iceServers : iceServers // iceServers, we lkeave it empty for now
          },
          timeout: 2 * 60 * 1000, // WebRTC connections timeout
          delta: 10 * 1000, // spray-wrtc shuffle interval
          signaling: { //
            address: 'https://signaling.herokuapp.com/',
            room: channel // room to join
          }
        }
      }
    });


    // connect to the signaling server
    app.share()

    // connect our app to the fog
    app.connection()
    .then(() => {
      console.log('application connected!')

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


    })
    .catch(console.error) // catch connection errors

  }
});


function addMap(){ 
  map = new google.maps.Map(document.getElementById("map_canvas"), {
          zoom: 19,
          center: new google.maps.LatLng(47.2172500, -1.5533600),
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });

  if (navigator.geolocation)
    var watchId = navigator.geolocation.watchPosition(successCallback,
                              null,
                              {enableHighAccuracy:true,
                              timeout:10000,
                              maximumAge:0});
  else
    alert("Votre navigateur ne prend pas en compte la géolocalisation HTML5");

  function successCallback(position){
    longitude = position.coords.longitude;
    latitude = position.coords.latitude;
    if(marker==null){
      map.panTo(new google.maps.LatLng(position.coords.latitude, position.coords.longitude));
      marker = new google.maps.Marker({
        position: new google.maps.LatLng(position.coords.latitude, position.coords.longitude),
        map: map,
        title: "Moi",
        icon: "https://mt.googleapis.com/vt/icon/name=icons/onion/SHARED-mymaps-pin-container_4x.png,icons/onion/1899-blank-shape_pin_4x.png&highlight=0288D1&scale=2.0"
      });
    }else{
      marker.setPosition({lat: latitude, lng: longitude});
      console.log("Actualisation de votre propre possition, lat : "+latitude+", lng : "+longitude);    
    }
  }
}
google.maps.event.addDomListener(window, "load", addMap);

//-----------------------------------------//
//traitement d'un message
//-----------------------------------------//
function traiterMessage(id, msg){
  if(pseudo != ""){
    console.log("Traitement du message en cours ... ...");
    console.log("Type du message : "+msg.type);
    var infoAmi = {"pseudo" : msg.emeteur, "id" : id, "latitude" : 0, "longitude" : 0, "marker" : null};
    gestionAmis(infoAmi);
    actualisePosition(id, msg);
  }
}

function actualisePosition(id, msg){
  var position = -1;
  for(var i = 0; i<amis.length; i++){
    if(amis[i].pseudo == msg.emeteur){
      position = i;
    }
  }
  if(position!=-1){
    amis[position].latitude = msg.latitude;
    amis[position].longitude = msg.longitude; 
    var now = new Date();
    var annee =  now.getFullYear();
    var mois = now.getMonth()+1;
    var jour = now.getDate();
    var heure = now.getHours();
    var minute = now.getMinutes();
    var seconde = now.getSeconds();
    var infowindow = new google.maps.InfoWindow({
      content: "amis[position].pseudo /b"+heure+"h"+minute+"m"+seconde+"s"
    });
    if(amis[position].marker == null){
      console.log("Nouveau Marker en : "+amis[position].latitude +", "+amis[position].longitude);
      var marker= new google.maps.Marker({
        position: new google.maps.LatLng(amis[position].latitude, amis[position].longitude),
        map: map,
        title: amis[position].pseudo,
        icon: "iconPositionAmi.png"
      });;
      marker.addListener('click', function() {
        infowindow.open(map, marker);
      });
      amis[position].marker = marker;
    }else{
      console.log("update marker en  : "+amis[position].latitude +", "+amis[position].longitude);
      amis[position].marker.setPosition({lat: amis[position].latitude, lng: amis[position].longitude});
      map.event.clearListeners(marker, 'click');
      marker.addListener('click', function() {
        infowindow.open(map, marker);
      });
    }
  }
}
//-----------------------------------------//
//gestion amis
//-----------------------------------------//
function gestionAmis(info){
  // //ajout dans la liste amis
  if(!findFriend(amis, info.pseudo)){
    amis.push(info);
    actualiseListeAmis();
  }

}

function SendPosition(){
  var data = {"type" : "Location", "emeteur" : pseudo , "latitude" : latitude, "longitude" : longitude};
  app.sendBroadcast(data);
  setTimeout(SendPosition, 10000)
}

function wait(){
  if(pseudo==""){
    setTimeout(wait, 10000);
    console.log("Pas authentifié ! En attendre...");
  }else{
    SendPosition();
  }
}

wait();

function actualiseListeAmis(){
  var listText = "";
  for(var i = 0; i<amis.length; i++){
      listText = listText + '<input type="button" name="Valide" value="'+amis[i].pseudo+'" onClick="centerAmi('+i+')">';
  }
  document.getElementById("listeAmis").innerHTML = listText;
}


//-----------------------------------------//
//Find Friend
//-----------------------------------------//
function findFriend(List, pseudo){
  var result = false;
  for(var i = 0; i<List.length; i++){
    if(List[i].pseudo==pseudo){
      result = true;
    }
  }
  return result;
}

// alert("Vous devez vous authentifier afin de pouvoir recevoir les possition des personnes connectés !");

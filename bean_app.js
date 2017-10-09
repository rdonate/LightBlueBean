/**
 * http://usejsdoc.org/
 *  User Interface for LigthBlue Bean.
 *
 *  With this UI we can:
 *  		1.- Show all peripheral in my coverage area
 *  		2.- Select one of this peripheral and do following actions:
 *  			2.1.- Show temperature measure by the LightBlue Bean selected
 *  			2.2.- Change the RGB Led color
 *
 *  To-Run: This is a nw.js applications. So, type in console:
 *       $ nw .
 *
 *
 *
 *  author: Francisco M. Delicado
 *  date: 17/02/2016
 *  e-mail: francisco.delicado@uclm.es
 */

 //module to interact with LigthBlue Bean devices
// var ligthblue = require ("./ligthblue");

var bean_app={};

bean_app.ini = function(){ //Initialize web interface
	//	1.- Hide bean_connected section in UI
	//	2.- Order scan to server
	$("#found_devices").show();
	//Hide "bean_connected" div
	$("#bean_connected").hide();

  ligthblue.ini();

};//connection_socket.onopen


bean_app.connect = function($element){
  //Deal peripheral connection request
	//Show "connected_bean" div
	$("#Name").html($element.data("name")+'    ');
	$("#ID").html($element.data("peripheral_id"));
	$("#bean_connected").show();
	//Set "#disconnect_button" with peripheral_id
	var $button = $("#disconnect_button");
	$button.data("peripheral_id",$element.data("peripheral_id"));
	$button.off('click');
	$button.click(function(){
		bean_app.disconnect($(this));
	});
	var id = $element.data("peripheral_id");
  	console.log("PERIPHERAL_ID: "+$element.data("peripheral_id"));
  //Connect to peripheral.
  	ligthblue.connect($element.data("peripheral_id"));


  //Hide "found_devices" div
	$("#found_devices").hide();
	//Delete all peripheral from UI
	$("#found_devices").children().remove();
};//bean_app.connect($element)

bean_app.disconnect = function($element){
  // Delete div.ledcontrol section
	//Hide "bean_connected" div
  $("#redLed").val(0);
  $("#greenLed").val(0);
  $("#blueLed").val(0);
  $("#temperature").html("N/A")
	$("#bean_connected").hide();
	//Show "found_devices" div
	$("#found_devices").show();

  //Disconnect peripheral
  ligthblue.disconnect();

};//bean_app.disconnect()


bean_app.update = function(sensor, data){
  switch (sensor){
    case 'temperature':
      $("#temperature").html(data)
      break;
    case 'leds':
      $("#redLed").val(data[0]);
      $("#greenLed").val(data[1]);
      $("#blueLed").val(data[2]);
      break;
    };//switch (sensor)
}; //bean_app.update(sensor,data)


bean_app.sendLedUpdate = function(){
	//Read led values
	var red = $("#redLed").val();
	var green = $("#greenLed").val();
	var blue = $("#blueLed").val();

	//Send led values to peripheral.
  ligthblue.setLeds([red,green,blue]);
};//bean_app.sendLedUpdate


/* ==========================================
*  ==========================================
*     Start functions to manage BLE connection
*  ==========================================
   ==========================================*/
var noble = require ("noble");

var UPDATING_TIME = 2000; //Update interval in miliseconds
var TEMP_TIMEOUT = 1000; //Temperature read interval

var TEMP_SCRATCH = 1; //Temperature Scratch
var LED_SCRATCH = 2; //LED Scratch

var UUID_SCRATCHSERVICE = "a495ff20c5b14b44b5121370f02d74de";
var TEMP_SCRATCH = "a495ff22c5b14b44b5121370f02d74de";
var LED_SCRATCH = "a495ff21c5b14b44b5121370f02d74de";

var bean_connected = null; //LightBlue Been devices connected
var PeripheralArray = {}; //Array of visible peripherals.
var peripheralInterval = null; //hander of timer

var peripheral_led = null;//variable para guardar la caracteristica led

var ligthblue={};

ligthblue.ini = function(){
  /*TODO:
  Esta función debe:
    1.- Inicializar el array de dispositivos descubiertos.
    2.- Comenzar a buscar dispositivos.
  */

  PeripheralArray={};//Inicializamos el array vacio al inicio
  noble.on('stateChange', function(state) {
	  if(state=='poweredOn'){//comprobamos si la aplicacion esta encendida
	  	noble.startScanning([],true);//empezamos el escaneo de los dispositivos bluetooth
	  } else {
	  	console.log("Se ha parado el escaneo.");
	  	noble.stopScanning();//en caso contrario paramos de escanear dispositivos
	  }
  })
}

ligthblue.isconnected = function(){
  return (bean_connected != null)
}


ligthblue.connect = function (id){
  /* TODO:
  Esta función debe:
    1.- Conectarse al dispositivo con identificador id
    2.- Definir las acciones a realizar para atender a los eventos:
        2.1.- De conexión realizada.
        2.2.- De desconexión.
  */

  PeripheralArray[id].peripheral.connect(function(error,id){//se conecta al dispositivo almacenado en PeripheralArray de la posicion id
  	console.log('Conectado el dispositivo: ');
  });
  bean_connected = PeripheralArray[id].peripheral;//guardamos el dispositivo en bean_connected
  bean_connected.once('connect', function(){//conexion con el periferico
	  noble.stopScanning();//dejamos el escaneo
	  PeripheralArray={};//volvemos a inicilizar el array a vacio
	  setUpPeripheral(bean_connected);//lanzamos la interfaz del periferico conectado
  });
  bean_connected.once('disconnect', function(){//al hacer la desconexion
  	bean_connected = null;//bean_connected para a estar vacio de nuevo
  	PeripheralArray={};//volvemos a inicilizar el array a vacio
  	noble.startScanning([], true);//volvemos a escanear dispositivos
  	console.log("Desconectado el dispositivo");
  });
};//lightblue.connect


ligthblue.disconnect = function (){
  /* TODO:
  Esta función deberá hacer lo siguiente:
    1.- Desconectar el periférico conectado hasta ahora.
	2.- Inicializar el array de dispositivos descubiertos.
    3.- Comenzar a buscar nuevos periféricos para futuras asociaciones.
  */
    bean_connected.disconnect(function(error){//funcion de desconexion con el dispositivo
        console.log('Desconectando el dispositivo: ');
    });
    PeripheralArray={};//vaciamos el array
    noble.startScanning([], true);//volvemos a escanear dispositivos
    console.log("Desconectado el dispositivo")

};//lightblue.disconnect

ligthblue.setLeds = function (rgb_color){
  /* TODO:
  Esta función deberá actualizar el valor de color RGB de los LEDs.
  Para ello se debe escribir el valor del UInt8Array rgb_color en el siguiente servicio y característica:
    service_uuid: UUID_SCRATCHSERVICE = "a495ff20c5b14b44b5121370f02d74de"
    characteristic_uuid: LED_SCRATCH = "a495ff21c5b14b44b5121370f02d74de";
  */
    var color =new Buffer(rgb_color);//recibimos el valor del led a traves de la interfaz
    peripheral_led.write(color, true, function(error) {//escribimos en el registro correcpondiente al led su valor leido de la interfaz
        console.log('Color igual a ' + rgb_color);

    });
    bean_app.update('leds',rgb_color);//Actualizamos el valor del led
};//ligthblue.setLeds


function setUpPeripheral(peripheral){
  /* TODO:
  Esta función debe realizar la inicialización del dispositivo al que nos conectemos
  La inicialización consiste en:
    1.- Establecer la lectura automática de la temperatura cada vez que el dispositivo la actualice
        Para ello se habilitará la notificación de la característica asociada a la temperatura.
    2.- Inicializar a (0,0,0) el valor del LED RGB. Para ello se escribirá dicho valor en la característica
        asociada al LED RGB.

    Los parámetros de identificador de servicio y característica necesarios para acceder a ellos son:
                                service_uuid                       characteristic_uuid
                ----------------------------------------------------------------------------
    Temperatura |                                    |   a495ff22c5b14b44b5121370f02d74de  |
                |  a495ff20c5b14b44b5121370f02d74de  |-------------------------------------|
       LED RGB  |                                    |   a495ff21c5b14b44b5121370f02d74de  |
                ----------------------------------------------------------------------------

    3.- Al tiempo que actualizo las características en el dispositivo sensor, también debo de actualizar
        la UI. Para ello usaré la siguiente función:
                      bean_app.update(string_characterística,data)
        donde:
            string_caraterística será:  "temperature" para la temperatura
                                        "leds" para el valor RGB LED
            data: es el dato con el que quiero actualizar la UI.
  */


  if(isLigthBluePeripheral(peripheral)){//Comprobamos que el dispositivo conectado es un dispositivo LighBlue
      peripheral.discoverServices(null, function (error,services) {//Una vez conectado, descubrimos los servicios del dispositivo
          services.forEach(function (service,services) {//recorremos todos los servicios
              if(service.uuid==UUID_SCRATCHSERVICE){//comprobamos que el servicio corresponde al que estamos buscando
                  service.discoverCharacteristics(null, function (error, characteristics) {//Una vez encontrado el servicio, descubrimos sus caracteristicas
                      characteristics.forEach(function (characteristic, characteristics) {//Recorremos las caracteristicas
                          if(characteristic.uuid==TEMP_SCRATCH){//Comparamos que la caracteristica sea la temperatura
                              characteristic.on('data',function (data, isNotification) {//
                                  bean_app.update('temperature',data[0]);//Actualizamos en la interfaz el valor leido de la caracteristica, en este caso la temperatura
                              })
                              characteristic.notify(true, function(error){//Activamos que reciba las notificaciones de esa caracteristica
                                  console.log();
                              });
                          }
                          if(characteristic.uuid==LED_SCRATCH){//Comparamos que la caracteristica sea el led
                              peripheral_led = characteristic;//En la variable creada peripheral_led guardamos la caracteristica led
                              ligthblue.setLeds([0,0,0]);//Al inicio establecemos todos los led a 0
                              characteristic.notify(true, function(error){//Activamos que reciba las notificaciones de esa caracteristica
                                  console.log();
                              });
                          }

                      })
                  })
              }
          })
      });
  }
};//function setUpPeripheral(...)


function UpdateArrayofPeripheral(){
	//Update the PeripheralArray with the peripheral which are still active
	for (var id in PeripheralArray){
		if (PeripheralArray[id].lastUpdate < (Date.now() - UPDATING_TIME)){ //Is the peripheral inactive?
			peripheral = PeripheralArray[id].peripheral;

      //Delete DOM element of the peripheral
    		$selector=$("div[id="+peripheral.id+"]");
    		$selector.remove();
    		delete PeripheralArray[id];
		}
	}
}

function isLigthBluePeripheral(peripheral){
  //Return if the peripheral is a LightBlue one or not
  LIGHTBLUE_MAC_PREFFIX = 'C4BE84E5'
  //Get manufacturer MAC PREFFIX
  mac_preffix = peripheral.id.substring(0,LIGHTBLUE_MAC_PREFFIX.length);
  return (mac_preffix.toUpperCase() == LIGHTBLUE_MAC_PREFFIX  )
};//function isLigthBluePeripheral(.......


noble.on('scanStart',function(){
  //Set timeout of active peripheral.
  peripheralInterval = setInterval(UpdateArrayofPeripheral,UPDATING_TIME);
});//noble.on('scanStart',...

noble.on('scanStop',function(){
	//clear timeout of active peripheral.
	clearInterval(peripheralInterval);
});//noble.on('scanStop


noble.on('discover',function(peripheral){
	/* TODO
	* Esta función deberá de procesar el descubrimiento de un nuevo dispositivo (peripheral)
	* Lo que deber realizar es lo siguiente:
	*	1.- Si el periférico ya existe en el array de periféricos:
	*		1.1.- Debe actualizar el tiempo de vida del mismo
	*	2.- Si no existe en el array de periféricos:
	*		2.1.- Comprueba si es un dispositivo LightBlue Bean.
	*		Para eso llamará a la función isLigthBluePeripheral(<dispositivo_descubierto>)
	*		Si el dispositivo ES LightBlue Bean:
	*			2.1.1.- Lo incluyo en el array de periféricos.
	*			2.1.2.- Inicializo su tiempo de vida.
	*			2.1.3.- Actualizo la UI de usuario incluyendo un nuevo dispositivo.
	*				Para ello llamo a la función updateDOM(<dispositivo_descubierto>)
	*/

	var index=PeripheralArray[peripheral.id];//Guardamos el dispositivo
	if (index){//Si ya existe el periferico actualizamos el valor de lastUpdate
		PeripheralArray[peripheral.id].lastUpdate=Date.now();
	} else {//Si no existe
		if (isLigthBluePeripheral(peripheral)){//Comprobamos que el dispositivo es LightBlue
			PeripheralArray[peripheral.id]= {
				peripheral : peripheral
			};//Lo añadimos el formato JSON al array de dispositivos
			PeripheralArray[peripheral.id].lastUpdate = Date.now();//actualizamos el valor de lastUpdate
			updateDOM(peripheral);//Actualizamos la interfaz con el nuevo periferico
		}
	}

}); //noble.on('discover'

function updateDOM (peripheral){
	//create DOM element for peripheral
  var $newdiv=$('<div id="'+peripheral.id+'" class="peripheral"></div>');
  $("#found_devices").append($newdiv);

	$newdiv.html('<span class="name">'+peripheral.advertisement.localName+'         </span>'+
		'<input id="'+peripheral.id+'" type=image src="./images/on.png" width="16" heigh="16" style="vertical-align:middle">'+
	   '<br><span class="data">ID: '+peripheral.id.toString());
	// The peripheral could be connected, so active the
	// connection button
	var $button=$("input[id="+peripheral.id+"]");
	$button.data("peripheral_id",peripheral.id);
	$button.data("name",peripheral.advertisement.localName);

	$button.on("click",function(){
	   bean_app.connect($(this));
	});
};


$('.login-input').on('focus', function() {
  $('.login').addClass('focused');
});

$('.login').on('submit', function(e) {
  e.preventDefault();
  $('.login').removeClass('focused').addClass('loading');
});

$(document).ready(function(){
    $( "#loguinbtn" ).click(function() {
        logueo();
    });

     $( "#idbtnhideForms" ).click(function() {
        hideForms();
    });
})

//funcion encargada de logueo
function logueo(){
   var usuario = $("#userid").val();
   var contraseña = $("#passid").val();
   var ObjPriData={
                "userName":usuario,
                "password": contraseña
            };

    if(usuario == "" && contraseña == ""){
        alert("Debe completar los datos requeridos.");
        window.location.href = 'index.html';
    }else
        {
             $.ajax({
                type: "post",
                url: "/api/login",
                //contentType: "application/json; charset=utf-8",
                data: ObjPriData,
                dataType: "json",
                success: function (result) {
                    if (result != null && typeof result != 'undefined') {
                            $("body").css("background", "white")
                            document.getElementById("idloguin").style.display = "none";
                            document.getElementById("divPrincipal").style.display = "block";
                            cargarTxt();
                    }

                },
                error: function (result) {
                    alert('Error, verifique sus datos.');
                   // alert(result.responseText);
                   window.location.href = 'index.html';
                },
                //async: true
            });
    }

}

//funcion encargada de obtener txt a cargar
function cargarTxt(){
    $.ajax({
                type: "get",
                url: "/api/listText",
                //contentType: "application/json; charset=utf-8",
                //data: {},
                dataType: "json",
                success: function (result) {
                    if (result) {
                        var tableTxt = document.getElementById("ul-txt");
                        tableTxt.innerHTML = "";
                        for(i=0; i < result.length; i++)
                            {

                                var li = document.createElement("li")
                                li.className="list-group-item";
                                li.id = result[i].nombre;
                                li.style.cursor="pointer";
                                li.onclick=cargarFacturas;
                                li.innerHTML = result[i].nombre+"<span class='badge'>"+result[i].cantidad+"</span>";
                                tableTxt.appendChild(li);
                            }
                    }else{
                        alert("No hay archivos pendientes.");
                    }

                },
                error: function (result) {
                    alert('Hubo un error con la carga de txt, favor de reportar al area de sistemas.');
                   // alert(result.responseText);
                   window.location.href = 'index.html';
                },
                //async: true
            });
}

//funcion que carga las facturas del txt elegido.
function cargarFacturas(){
    var idtxt = this.id;

    $.ajax({
                type: "post",
                url: "/api/facturas",
                //contentType: "application/json; charset=utf-8",
                data: {"nameFile": idtxt},
                dataType: "json",
                success: function (result) {
                   if(result){
                       for(i=0; i<result.length;i++){
                           var cuerpoTableFacturas = document.getElementById("idtbodyfac");
                           var tr = document.createElement("tr");
                           tr.style.cursor="pointer";
                           tr.onclick=formularioData;
                           tr.data = result[i];
                           var td = document.createElement("td");
                           td.innerHTML=result[i].factura[0].Serie;
                           tr.appendChild(td);
                           td = document.createElement("td");
                           td.innerHTML=result[i].factura[0].Folio;
                           tr.appendChild(td);
                           td = document.createElement("td");
                           td.innerHTML=result[i].factura[0].FechaEmis;
                           tr.appendChild(td);
                           cuerpoTableFacturas.appendChild(tr);
                       }
                   }else{
                       alert("No existen datos relacionados con el txt.");
                   }

                },
                error: function (result) {
                    alert('Error, notifique al area de sistemas.');
                   // alert(result.responseText);
                   //window.location.href = 'index.html';
                },
            });
}

//mostrar formularios
function formularioData(){
    var data = this.data;

    $("txtEncNumInter").val()
    $("#txtEncNumApro").val()
    $("#txtEncAñoAprobacion").val()
    $("#txtEncTipo").val()
    $("#txtEncSerie").val()
    $("#txtEncFolio").val()
    $("#txtEncFechaEmision").val()
    $("#txtEncFormaPago").val()
    $("#txtEncCondicionesPago").val()
    $("#txtEncTerminoPago").val()
    $("#txtEncFechaVencimiento").val()

    $("#idcontenedorestxt").css("display", "none");
    $("#idformulario").css("display", "");
}

//ocultar forms
function hideForms(){
    $("#idcontenedorestxt").css("display", "");
    $("#idformulario").css("display", "none");
}

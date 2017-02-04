
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
    
    $("#idbtnSalir").click(function(){
        confirm();
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
    var datos = this.data;
// datos encabezado
    $("#txtEncNumInter").val(datos.factura[0].NumeroInterno)
    $("#txtEncNumApro").val(datos.factura[0].NroAprob)
    $("#txtEncAñoAprobacion").val(datos.factura[0].AnoAprob)
    $("#txtEncTipo").val(datos.factura[0].Tipo)
    $("#txtEncSerie").val(datos.factura[0].Serie)
    $("#txtEncFolio").val(datos.factura[0].Folio)
    $("#txtEncFechaEmision").val(datos.factura[0].FechaEmis)
    $("#txtEncFormaPago").val(datos.factura[0].FormaPago)
    $("#txtEncCondicionesPago").val(datos.factura[0].CondPago)
    $("#txtEncTerminoPago").val(datos.factura[0].TermPagoDias)
    $("#txtEncFechaVencimiento").val(datos.factura[0].FechaVenc);

// datos emisor col 1
    $("#txtEmiRFC").val(datos.emisor[0].RFCEmisor);
    $("#txtEmiNombreEmisor").val(datos.emisor[0].NmbEmisor);
    $("#txtEmiTipoCod").val(datos.emisor[0].TpoCdgIntEmisor1);
    $("#txtEmiCod").val(datos.emisor[0].CdgIntEmisor1);
    $("#txtEmiSucursal").val(datos.emisor[0].Sucursal);
    //CdgVendedor
// col 2
    $("#txtEmiD1Calle").val(datos.emisor[1].Calle);
    $("#txtEmiD1NumExt").val(datos.emisor[1].NroExterior);
    $("#txtEmiD1NumInt").val(datos.emisor[1].NroInterior);
    $("#txtEmiD1Colonia").val(datos.emisor[1].Colonia);
    $("#txtEmiD1Municipio").val(datos.emisor[1].Municipio);
    $("#txtEmiD1Estado").val(datos.emisor[1].Estado);
    $("#txtEmiD1Pais").val(datos.emisor[1].Pais);
    $("#txtEmiD1CP").val(datos.emisor[1].CodigoPostal);
// col 3
    $("#txtEmiD2Calle").val(datos.emisor[2].Calle);
    $("#txtEmiD2NumExt").val(datos.emisor[2].NroExterior);
    $("#txtEmiD2NumInt").val(datos.emisor[2].NroInterior);
    $("#txtEmiD2Colonia").val(datos.emisor[2].Colonia);
    $("#txtEmiD2Municipo").val(datos.emisor[2].Municipio);
    $("#txtEmiD2Estado").val(datos.emisor[2].Estado);
    $("#txtEmiD2Pais").val(datos.emisor[2].Pais);
    $("#txtEmiD2CP").val(datos.emisor[2].CodigoPostal);

//datos receptor
    $("#txtRecepRFC").val(datos.receptor[0].RFCRecep);
    $("#txtRecepNombre").val(datos.receptor[0].NmbRecep);
    $("#txtRecepCodGLN").val(datos.receptor[0].CdgGLNRecep);
    $("#txtRecepTipoCod").val(datos.receptor[0].TpoCdgIntRecep1);
    $("#txtRecepCodInter").val(datos.receptor[0].CdgIntRecep1);
    $("#txtRecepCodCliente").val(datos.receptor[0].CdgCliente);
// col 2
    $("#txtRecepD1Calle").val(datos.receptor[1].Calle);
    $("#txtRecepD1NumExt").val(datos.receptor[1].NroExterior);
    $("#txtRecepD1NumInt").val(datos.receptor[1].NroInterior);
    $("#txtRecepD1Colonia").val(datos.receptor[1].Colonia);
    $("#txtRecepD1Localidad").val(datos.receptor[1].Localidad);
    $("#txtRecepD1Referencia").val(datos.receptor[1].Referencia);
    $("#txtRecepD1Municipio").val(datos.receptor[1].Municipio);
    $("#txtRecepD1Estado").val(datos.receptor[1].Estado);
    $("#txtRecepD1Pais").val(datos.receptor[1].Pais);
    $("#txtRecepD1CP").val(datos.receptor[1].CodigoPostal);
// col 3
    $("#txtRecepD2Calle").val(datos.receptor[2].Calle);
    $("#txtRecepD2NumExt").val(datos.receptor[2].NroExterior);
    $("#txtRecepD2NumInt").val(datos.receptor[2].NroInterior);
    $("#txtRecepD2Colonia").val(datos.receptor[2].Colonia);
    $("#txtRecepD2Localidad").val(datos.receptor[2].Localidad);
    $("#txtRecepD2Referencia").val(datos.receptor[2].Referencia);
    $("#txtRecepD2Municipio").val(datos.receptor[2].Municipio);
    $("#txtRecepD2Estado").val(datos.receptor[2].Estado);
    $("#txtRecepD2Pais").val(datos.receptor[2].Pais);
    $("#txtRecepD2CP").val(datos.receptor[2].CodigoPostal);
    $("#txtRecepD2NumPago").val(datos.receptor[2].NumCtaPago);
    $("#txtRecepD2MetodoPago").val(datos.receptor[2].methodoDePago);
    //$("#txtRecepD2NumPago").val(dato.receptor[2].);


    $("#idcontenedorestxt").css("display", "none");
    $("#idformulario").css("display", "");
}

//ocultar forms
function hideForms(){
    $("#idcontenedorestxt").css("display", "");
    $("#idformulario").css("display", "none");
}

//confirm
function confirm(){
    $.confirm({
    title: 'Seguro que desea salir?',
    content: 'Seleccione cancelar si desea permanecer en la pagina.',
    buttons: {
        confirmar: function () {
            $.alert('Hasta pronto!');
            window.location.href="index.html";
        },
        cancelar: function () {
           
        },
       /* somethingElse: {
            text: 'Something else',
            btnClass: 'btn-primary',
            keys: ['enter', 'shift'],
            action: function(){
                $.alert('Something else?');
            }
        }*/
    }
});
    
}

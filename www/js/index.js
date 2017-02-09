// cotiene los datos del txt seleccionado
var txtSelected = {
    nameTxt: null, // nombre del txt
    facturas: null, // facturas en json
    indexSelected: null, // factura seleccionada
};

$('.login-input').on('focus', function() {
  $('.login').addClass('focused');
});

$('.login').on('submit', function(e) {
  e.preventDefault();
  $('.login').removeClass('focused').addClass('loading');
});

$(document).ready(function(){
    var infoUser = localStorage.getItem("infoUser");
    if (infoUser) {
        $("body").css("background", "white")
        document.getElementById("idloguin").style.display = "none";
        document.getElementById("divPrincipal").style.display = "block";
        cargarTxt();
    }
    $( "#loguinbtn" ).click(function() {
        logueo();
    });

     $( "#idbtnhideForms" ).click(function() {
        hideForms();
    });

    $("#idbtnSalir").click(function(){
        confirm();
    });

    $('#idSwitchHab').change(function() {
        swichForms();
    });
    
    $('#idbtnReguser').click(function(){
       cargarUsuariosExis(); 
    });

    $.datepicker.regional['es'] = {
     closeText: 'Cerrar',
     prevText: '< Ant',
     nextText: 'Sig >',
     currentText: 'Hoy',
     monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
     monthNamesShort: ['Ene','Feb','Mar','Abr', 'May','Jun','Jul','Ago','Sep', 'Oct','Nov','Dic'],
     dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
     dayNamesShort: ['Dom','Lun','Mar','Mié','Juv','Vie','Sáb'],
     dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','Sá'],
     weekHeader: 'Sm',
     dateFormat: 'dd/mm/yy',
     firstDay: 1,
     isRTL: false,
     showMonthAfterYear: false,
     yearSuffix: ''
     };
     $.datepicker.setDefaults($.datepicker.regional['es']);

    $("#from").datepicker({
        dateFormat: 'dd-mm-yy',
        onClose: function (selectedDate) {
        $("#to").datepicker("option", "minDate", selectedDate);
        }
    });
    $("#to").datepicker({
        dateFormat: 'dd-mm-yy',
        onClose: function (selectedDate) {
        $("#from").datepicker("option", "maxDate", selectedDate);
        }
    }).on("change", function (e) {
    //console.log("Date changed: ", e.target.value);
    onchangeDate();
});


})

function salir(){
    localStorage.clear();
    $("body").css("background", "#333")
    $("#userid").val("");
    $("#passid").val("");
    document.getElementById("idloguin").style.display = "block";
    document.getElementById("divPrincipal").style.display = "none";
}

//funcion encargada de logueo
function logueo(){
    var usuario = $("#userid").val();
    var contraseña = $("#passid").val();
    var ObjPriData = {
        "userName":usuario,
        "password": contraseña
    };

    if ( usuario == "" || contraseña == "") {
        //alert("Debe completar los datos requeridos.");
        alertErrorLogin();
    }else{
    General.post("/api/login", ObjPriData)
    .then( result => {
        if (!result) {
            //alert('Error, verifique sus datos.');
            return;
        }
        localStorage.setItem("infoUser", JSON.stringify(result));
        $("body").css("background", "white")
        document.getElementById("idloguin").style.display = "none";
        document.getElementById("divPrincipal").style.display = "block";
        cargarTxt();
    })
    .catch(err => {
         alertErrorLogin();
        //alert('Error, verifique sus datos.');
        // console.log(result.responseText);
        //window.location.href = 'index.html';
    });
   }
}

//funcion encargada de obtener txt a cargar en la lista de archivo pendientes
function cargarTxt() {
    txtSelected = { // inicializa, ya que al crear una nueva lista no hay ningun elemento seleccionado
        nameTxt: null, // nombre del txt
        facturas: null, // facturas en json
        indexSelected: null, // factura seleccionada
    }
    var tableTxt = document.getElementById("ul-txt");
    tableTxt.innerHTML = "";
    General.get("/api/listText?directorio=pendientes")
    .then(function(result){
        if (result && result.length > 0) {
            for (i=0; i < result.length; i++) {
                var li = document.createElement("li")
                li.className="list-group-item item-list-txt";
                li.id = result[i].nombre;
                li.style.cursor = "pointer";
                //li.style.height = "50px";
                li.onclick = onClickCargarFacturas;
                li.innerHTML = "<span>"+result[i].nombre+"</span><span class='badge'>"+result[i].cantidad+"</span>";
                tableTxt.appendChild(li);
            }
        } else {
            $.alert({
                title: 'Alerta!',
                content: 'No hay archivos pendientes.!',
            });
        }
    })
    .catch(function (err){
        console.log(err);
        errorAlert();
    });
}

//funcion que carga las facturas del txt elegido en la tabla
function onClickCargarFacturas(){
    $(".item-list-txt").removeClass("active");
    $(this).addClass("active");
    txtSelected.nameTxt = this.id;
    cargarFacturas();
}

function cargarFacturas() {
    hideForms();
    var getClassRow = function(factura){
        var datosFaltantes = validarFactura(factura);
        if (datosFaltantes.length == 0) {
            return "bg-success";
        } else if (datosFaltantes.length < 7 ) {
            return "bg-warning";
        } else {
            return "bg-danger";
        }
    }
    General.post("/api/facturas", {"nameFile": txtSelected.nameTxt})
    .then(function (result){
        if(result){
            txtSelected.facturas = result;
            var cuerpoTableFacturas = document.getElementById("idtbodyfac");
            cuerpoTableFacturas.innerHTML = "";
            for(i=0; i<result.length;i++){
                var tr = document.createElement("tr");
                tr.className = getClassRow(result[i]);
                tr.style.cursor="pointer";
                tr.onclick=formularioData;
                tr.IndexData = i;
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
    })
    .catch(function (err){
        alert('Error, notifique al area de sistemas.');
    });

}

function validarFactura(factura) {
    var faltantes = [];
    if (factura.receptor[3].cceVersion == "") faltantes.push("Version");
    if (factura.receptor[3].cceTipoOp == "") faltantes.push("Tipo operación")
    if (factura.receptor[3].cceClavePed == "") faltantes.push("Clave pediemento");
    if (factura.receptor[3].cceNExpConfiable == "") faltantes.push("No. exportador confiable");
    if (factura.receptor[3].cceCertOrig == "") faltantes.push("Certificado de origen");
    if (factura.receptor[3].cceNCertOrig == "") faltantes.push("No. de certificador de origen");

    var bloque = factura.receptor.find( item => item.hasOwnProperty("productos"));
    var rows = [];
    if (bloque)
        rows = bloque.productos.rows;
    if (rows){
        var ban = false;
        var keys = ["cceDescES", "cceDescEN", "cceFraccion", "cceMarca", "cceModelo", "cceSerie"];
        for (var i = 0; i < rows.length; i++) {
            var item = rows[i];
            for (var j in keys){
                var clave = keys[j];
                if (item[clave].trim() == ""){
                    ban = true;
                    faltantes.push("Datos en productos");
                    break;
                }
            }
            if (ban) break;
        }
    }
    return faltantes;
}

//mostrar formularios
function formularioData(){
    txtSelected.indexSelected = this.IndexData
    var datos = txtSelected.facturas[txtSelected.indexSelected];
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

    $("#txt_cceVersion").val(datos.receptor[3].cceVersion);
    $("#txt_cceTipoOp").val(datos.receptor[3].cceTipoOp);
    $("#txt_cceClavePed").val(datos.receptor[3].cceClavePed);
    $("#txt_cceNExpConfiable").val(datos.receptor[3].cceNExpConfiable);
    $("#txt_cceCertOrig").val(datos.receptor[3].cceCertOrig);
    $("#txt_cceNCertOrig").val(datos.receptor[3].cceNCertOrig);

// datos productos
    var item = datos.receptor.find( item => item.hasOwnProperty("productos"));
    var tb = document.getElementById("tbSku");
    tb.innerHTML = "";
    if (!item) return; // no hay apartado de productos
    var productos = item.productos;
    for (var i in productos.rows) {
        var p = productos.rows[i];
        var tr = document.createElement("tr");
        var td = document.createElement("td");
        td.innerHTML = p.VlrCodigo1;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceDescES;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceDescEN;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceFraccion;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceMarca;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceModelo;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerHTML = p.cceSerie;
        td.setAttribute("contenteditable", "true");
        tr.appendChild(td);

        tb.appendChild(tr);
    }

    $("#idcontenedorestxt").css("display", "none");
    $("#idformulario").css("display", "");
}

// toma los datos de las cajas de texto y los asigna al json de facturas correspondiente
function setDatosFactura(){
    var datos = txtSelected.facturas[txtSelected.indexSelected];
// datos encabezado
    datos.factura[0].NumeroInterno = $("#txtEncNumInter").val()
    datos.factura[0].NroAprob = $("#txtEncNumApro").val()
    datos.factura[0].AnoAprob = $("#txtEncAñoAprobacion").val()
    datos.factura[0].Tipo = $("#txtEncTipo").val()
    datos.factura[0].Serie = $("#txtEncSerie").val()
    datos.factura[0].Folio = $("#txtEncFolio").val()
    datos.factura[0].FechaEmis = $("#txtEncFechaEmision").val()
    datos.factura[0].FormaPago = $("#txtEncFormaPago").val()
    datos.factura[0].CondPago = $("#txtEncCondicionesPago").val()
    datos.factura[0].TermPagoDias = $("#txtEncTerminoPago").val()
    datos.factura[0].FechaVenc = $("#txtEncFechaVencimiento").val();

// datos emisor col 1
    datos.emisor[0].RFCEmisor = $("#txtEmiRFC").val();
    datos.emisor[0].NmbEmisor = $("#txtEmiNombreEmisor").val();
    datos.emisor[0].TpoCdgIntEmisor1 = $("#txtEmiTipoCod").val();
    datos.emisor[0].CdgIntEmisor1 = $("#txtEmiCod").val();
    datos.emisor[0].Sucursal = $("#txtEmiSucursal").val();
    //CdgVendedor
// col 2
    datos.emisor[1].Calle = $("#txtEmiD1Calle").val();
    datos.emisor[1].NroExterior = $("#txtEmiD1NumExt").val();
    datos.emisor[1].NroInterior = $("#txtEmiD1NumInt").val();
    datos.emisor[1].Colonia = $("#txtEmiD1Colonia").val();
    datos.emisor[1].Municipio = $("#txtEmiD1Municipio").val();
    datos.emisor[1].Estado = $("#txtEmiD1Estado").val();
    datos.emisor[1].Pais = $("#txtEmiD1Pais").val();
    datos.emisor[1].CodigoPostal = $("#txtEmiD1CP").val();
// col 3
    datos.emisor[2].Calle = $("#txtEmiD2Calle").val();
    datos.emisor[2].NroExterior = $("#txtEmiD2NumExt").val();
    datos.emisor[2].NroInterior = $("#txtEmiD2NumInt").val();
    datos.emisor[2].Colonia = $("#txtEmiD2Colonia").val();
    datos.emisor[2].Municipio = $("#txtEmiD2Municipo").val();
    datos.emisor[2].Estado = $("#txtEmiD2Estado").val();
    datos.emisor[2].Pais = $("#txtEmiD2Pais").val();
    datos.emisor[2].CodigoPostal = $("#txtEmiD2CP").val();

//datos receptor
    datos.receptor[0].RFCRecep = $("#txtRecepRFC").val();
    datos.receptor[0].NmbRecep = $("#txtRecepNombre").val();
    datos.receptor[0].CdgGLNRecep = $("#txtRecepCodGLN").val();
    datos.receptor[0].TpoCdgIntRecep1 = $("#txtRecepTipoCod").val();
    datos.receptor[0].CdgIntRecep1 = $("#txtRecepCodInter").val();
    datos.receptor[0].CdgCliente = $("#txtRecepCodCliente").val();
// col 2
    datos.receptor[1].Calle = $("#txtRecepD1Calle").val();
    datos.receptor[1].NroExterior = $("#txtRecepD1NumExt").val();
    datos.receptor[1].NroInterior = $("#txtRecepD1NumInt").val();
    datos.receptor[1].Colonia = $("#txtRecepD1Colonia").val();
    datos.receptor[1].Localidad = $("#txtRecepD1Localidad").val();
    datos.receptor[1].Referencia = $("#txtRecepD1Referencia").val();
    datos.receptor[1].Municipio = $("#txtRecepD1Municipio").val();
    datos.receptor[1].Estado = $("#txtRecepD1Estado").val();
    datos.receptor[1].Pais = $("#txtRecepD1Pais").val();
    datos.receptor[1].CodigoPostal = $("#txtRecepD1CP").val();
// col 3
    datos.receptor[2].Calle = $("#txtRecepD2Calle").val();
    datos.receptor[2].NroExterior = $("#txtRecepD2NumExt").val();
    datos.receptor[2].NroInterior = $("#txtRecepD2NumInt").val();
    datos.receptor[2].Colonia = $("#txtRecepD2Colonia").val();
    datos.receptor[2].Localidad = $("#txtRecepD2Localidad").val();
    datos.receptor[2].Referencia = $("#txtRecepD2Referencia").val();
    datos.receptor[2].Municipio = $("#txtRecepD2Municipio").val();
    datos.receptor[2].Estado = $("#txtRecepD2Estado").val();
    datos.receptor[2].Pais = $("#txtRecepD2Pais").val();
    datos.receptor[2].CodigoPostal = $("#txtRecepD2CP").val();
    datos.receptor[2].NumCtaPago = $("#txtRecepD2NumPago").val();
    datos.receptor[2].methodoDePago = $("#txtRecepD2MetodoPago").val();
    //$("#txtRecepD2NumPago").val(dato.receptor[2].);

    datos.receptor[3].cceVersion = $("#txt_cceVersion").val();
    datos.receptor[3].cceTipoOp = $("#txt_cceTipoOp").val();
    datos.receptor[3].cceClavePed = $("#txt_cceClavePed").val();
    datos.receptor[3].cceNExpConfiable = $("#txt_cceNExpConfiable").val();
    datos.receptor[3].cceCertOrig = $("#txt_cceCertOrig").val();
    datos.receptor[3].cceNCertOrig = $("#txt_cceNCertOrig").val();

// datos productos
    var bloque = datos.receptor.find( item => item.hasOwnProperty("productos"));
    var rows = [];
    if (bloque)
        rows = bloque.productos.rows;
    $("#tablaProductos tbody tr").each(function (index) {
        var p = rows[index];
        //var campo1, campo2, campo3;
        $(this).children("td").each(function (index2) {
            switch (index2) {
                case 0: p.VlrCodigo1 = $(this).text();
                    break;
                case 1: p.cceDescES = $(this).text();
                    break;
                case 2: p.cceDescEN = $(this).text();
                    break;
                case 3: p.cceFraccion = $(this).text();
                    break;
                case 4: p.cceMarca = $(this).text();
                    break;
                case 5: p.cceModelo = $(this).text();
                    break;
                case 6: p.cceSerie = $(this).text();
                    break;
            }
        })
    });
}

function guardarTxt() {
    setDatosFactura();
    General.put("/api/facturas", txtSelected)
    .then(function (result) {
        cargarFacturas();
        alertSucces();
        console.log(result);
    })
    .catch(function (err) {
        errorAlert();
        console.log(err);
    });
}

function timbrar() {
    if (txtSelected.nameTxt == null) {
        alertMensaje("Seleccione un elemento de la lista de archivos pendientes");
        return;
    }
    General.post("/api/timbrarFactura", {nameTxt: txtSelected.nameTxt})
    .then(function (result) {
        var cuerpoTableFacturas = document.getElementById("idtbodyfac");
        cuerpoTableFacturas.innerHTML = ""; // limpia tabla de facturas
        cargarTxt();
        alertSucces();
    })
    .catch(function (err) {
        errorAlert();
        console.log(err);
    });
}

//ocultar forms
function hideForms(){
    $("#idcontenedorestxt").css("display", "");
    $("#idformulario").css("display", "none");
}

//confirm
function confirm(){
    $.confirm({
    title: 'Esta seguro que desea salir?',
    content: 'Seleccione cancelar si desea permanecer en la pagina.',
    buttons: {
        confirmar: function () {
           // $.alert('Hasta pronto!');
            salir();
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

//alert Errorlogin
function alertErrorLogin(){
   $.alert({
    title: 'Error!',
    content: 'Revisa tus datos de acceso!',
});
    // window.location.href = 'index.html';
    //return;
}

//alert mensaje
function alertMensaje(texto){
   $.alert({
       title: 'Aviso!',
       content: texto,
   });
}

//alert succes
function alertSucces(){
    $.confirm({
    title: 'Terminado!',
    content: 'Proceso generado con exito.',
    type: 'green',
    typeAnimated: true,
    buttons: {
        tryAgain: {
            text: 'Ok',
            btnClass: 'btn-green',
            action: function(){
            }
        },
    }
});
}

//alert error
function errorAlert(){
     $.confirm({
    title: 'Error!',
    content: 'Hubo un error, intenta de nuevo o notifica al area de sistemas',
    type: 'red',
    typeAnimated: true,
    buttons: {
        tryAgain: {
            text: 'Ok',
            btnClass: 'btn-red',
            action: function(){
            }
        },
       /* close: function () {
        }*/
    }
});
}

//validacion habilitar campos
function swichForms(){
    var valueswHab =  $('#idSwitchHab').prop('checked');
    var inputsForms = $('input.editSwich');
    if(valueswHab){
        inputsForms.prop('disabled', false);
    }else
         inputsForms.prop('disabled', true);
}

function onClickHistorial(){
    initFechasBusquedaHistorial();
    onchangeDate();
}

function initFechasBusquedaHistorial(){
    var toDay = new Date();
    var fIni = "01-01-" +(toDay.getFullYear() - 1)
    var fFin = toDay.getDate() + "-" + (toDay.getMonth() + 1) + "-" + toDay.getFullYear()
    $("#from").val(fIni);
    $("#to").val(fFin);
}

function onchangeDate() {
    var fIni = $("#from").val().split("-");
    var fFin = $("#to").val().split("-");
    fIni = `${fIni[2]}-${fIni[1]}-${fIni[0]}`
    fFin = `${fFin[2]}-${fFin[1]}-${fFin[0]}`
    var tbHistorial = document.getElementById("tbHistorial");
    tbHistorial.innerHTML = "";
    General.get(`/api/listText?directorio=timbradas&fIni=${fIni}&fFin=${fFin}`)
    .then(function (result) {
        if (!result || result.length == 0){
            alertMensaje("No hay facturas timbradas en el rango seleccionado");
            return;
        }
        for (var i in result) {
            var tr = document.createElement("tr");
            tr.id = "tablaHistorial_" + result[i].nombre;
            var td = document.createElement("td");
            td.innerHTML = result[i].nombre;
            tr.appendChild(td);
            td = document.createElement("td");
            td.innerHTML = `<input type='checkbox' value=${result[i].nombre} class='checkRestaurar'></input>`;
            tr.appendChild(td);
            tbHistorial.appendChild(tr);

        }
    }).catch(function(err){
        console.log(err);
    });
}

function restaurarTxt(){
    var checks = [];
    $(".checkRestaurar").each( function (index){
        if($(this).is(":checked")){
            checks.push($(this).val());
        }
    });
    if (checks.length == 0) {
        alertMensaje("Seleccione un elemento!");
        return;
    }
    General.post("/api/reeditar", {nameTxts: checks})
    .then(function (result) {
        cargarTxt()
        $('#myModalHistorial').modal('hide');

        console.log(result);
    })
    .catch(function (err){
        console.log(err);
    });
}

function cargarUsuariosExis(){
    General.get("/api/obtainUsers")
    .then(function(result){
        for(i = 0; i < result.length; i++)
            {
              var selectUsers = document.getElementById("idselectUsers");
              var option = document.createElement('option');
              // añadir el elemento option y sus valores
              selectUsers.options.add(option, i);
              //selectUsers.options[i].value = "valor";
              selectUsers.options[i].innerText = result[i].name;
            }
    })
    .catch(function(err){
        console.log(err);
    });
}

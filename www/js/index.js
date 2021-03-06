// cotiene los datos del txt seleccionado de las lista de archivos pendientes
var txtSelected = {
    nameTxt: null, // nombre del txt
    facturas: null, // facturas en json
    indexSelected: null, // factura seleccionada
};
// informacion de los usuario actualmente registrados
var usuariosRegistrados;

$('.login-input').on('focus', function() {
  $('.login').addClass('focused');
});

$('.login').on('submit', function(e) {
  e.preventDefault();
  $('.login').removeClass('focused').addClass('loading');
});

$(document).ready(function() {
    General.init();
    var infoUser = localStorage.getItem("infoUser");
    if (infoUser) {
        infoUser = JSON.parse(infoUser);
        $("#labelUser").html(infoUser.user.name);
        if (infoUser.user.rolUser == "admin")
            $("#idbtnReguser").show();
        else
            $("#idbtnReguser").show();
        $("body").css("background", "#F4F2F0");
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

    // $('#idbtnReguser').click(function(){
    //    cargarUsuariosExis();
    // });
    cargarUsuariosExis();

    $('#idselectUsers').change(function(){
       infoUserSelect();
    });

    $('#btnDeletuser').click(function(){
       deleteUser();
    });

    $("#switchPasschange").change(function(){
       var chkPass = document.getElementById("switchPasschange");
        if(chkPass.checked)
            {
                $("#pwd").prop("disabled", false);
            }else{
                $("#pwd").prop("disabled", true);
                $("#pwd").val("");
            }
    });

    $("#idbtnAddUser").click(function(){
        saveuserNew();
    });

    $("#idbtnUpdateuser").click(function(){
        updateuser();
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
    })
    .on("change", function (e) {
        //console.log("Date changed: ", e.target.value);
        onchangeDate();
    });

    //var urlServer = "http://localhost:8880";
    var urlServer = "http://172.31.224.50:8880";
    var socket = io.connect( urlServer, {"forceNew": true});
    socket.on('newTxt', agregarElementoListaTxt);

    $("#panelListaTxtPendientes").height($(window).height() - 110);
    $("#divListaTxt").height($("#panelListaTxtPendientes").height() - 100);

    $("#panelTablaFacturas").height($(window).height() - 110);
    $("#divTablaFacturas").height($("#panelTablaFacturas").height() - 100);

}); // fin ready

function salir(){
    localStorage.clear();
    $("body").css("background", "#333")
    $("#userid").val("");
    $("#passid").val("");
    document.getElementById("idloguin").style.display = "block";
    document.getElementById("divPrincipal").style.display = "none";
}

//funcion encargada de logueo
function logueo() {
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
        $("#labelUser").html(result.user.name);
        if (result.user.rolUser == "admin")
            $("#idbtnReguser").show();
        else
            $("#idbtnReguser").hide();
        localStorage.setItem("infoUser", JSON.stringify(result));
        $("body").css("background", "#F4F2F0");
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

// agrega un nuevo elemento a la lista de txt
function agregarElementoListaTxt(txt) {
        var tableTxt = document.getElementById("ul-txt");
        var li = document.createElement("li")
        li.className="list-group-item item-list-txt";
        li.id = txt.nombre;
        li.style.cursor = "pointer";
        //li.style.height = "50px";
        li.onclick = onClickCargarFacturas;
        li.innerHTML = `<span>${txt.nombre}</span><span class='badge' id='badge_${txt.nombre}'>${txt.cantidad}</span>`;
        tableTxt.appendChild(li);
}
//funcion encargada de obtener txt a cargar en la lista de archivo pendientes
function cargarTxt() {
    var tableTxt = document.getElementById("ul-txt");
    tableTxt.innerHTML = "";
    General.get("/api/listText?directorio=pendientes")
    .then(function(result){
        if (result && result.length > 0) {
            for (i=0; i < result.length; i++) {
                if (result[i].cantidad == 0) continue;
                var li = document.createElement("li")
                li.className="list-group-item item-list-txt";
                li.id = result[i].nombre;
                li.style.cursor = "pointer";
                li.onclick = onClickCargarFacturas;
                li.innerHTML = `<span>${result[i].nombre}</span><span class='badge' id='badge_${result[i].nombre}'>${result[i].cantidad}</span>`;
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
    var getClassRow = function(factura) {
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
        if(result) {
            txtSelected.facturas = result;
            if (txtSelected.facturas.length > 0) {
                document.getElementById("badge_"+txtSelected.nameTxt).innerHTML = txtSelected.facturas.length;
            } else {
                var item = document.getElementById(txtSelected.nameTxt);
                item.parentNode.removeChild(item);
            }
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

function actualiarFacturas() {
    General.get("/api/actualiarFacturas").then(result => {
        alertMensaje("se actualizo correctamente");
        $(".item-list-txt").removeClass("active");
        var cuerpoTableFacturas = document.getElementById("idtbodyfac");
        cuerpoTableFacturas.innerHTML = "";
        txtSelected = {
            nameTxt: null, // nombre del txt
            facturas: null, // facturas en json
            indexSelected: null, // factura seleccionada
        };
    }).catch(err =>{

        console.log(err);
    });
}

function validarFactura(factura) {
    var faltantes = [];
    if (factura.otros[5].Version == "") faltantes.push("Version");
    if (factura.otros[5].TipoOperacion == "") faltantes.push("Tipo operación")
    if (factura.otros[5].ClavePedimento == "") faltantes.push("Clave pediemento");
    if (factura.otros[5].NoExportadorConfiabl == "") faltantes.push("No. exportador confiable");
    if (factura.otros[5].CertificadoOrigen == "") faltantes.push("Certificado de origen");
    if (factura.otros[5].NumCertificadoOrigen == "") faltantes.push("No. de certificador de origen");

    var bloque = factura.otros.find( item => item.hasOwnProperty("productos"));
    var rows = [];
    if (bloque)
        rows = bloque.productos.rows;
    if (rows){
        var ban = false;
        var keys = ["cceDescEsp", "cceDescIng", "FraccionArancelaria", "Marca", "Modelo", "NumeroSerie"];
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
    if (!datos.factura || datos.factura.length < 1
        || !datos.emisor || datos.emisor.length < 3
        || !datos.receptor || datos.receptor.length < 3
        || !datos.otros || datos.otros.length < 6) {
        alertMensaje("Esta factura tiene un formato no valido");
        return;
    }
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

    $("#txt_cceVersion").val(datos.otros[5].Version);
    $("#txt_cceTipoOp").val(datos.otros[5].TipoOperacion);
    $("#txt_cceClavePed").val(datos.otros[5].ClavePedimento);
    $("#txt_cceNExpConfiable").val(datos.otros[5].NoExportadorConfiabl);
    $("#txt_cceCertOrig").val(datos.otros[5].CertificadoOrigen);
    $("#txt_cceNCertOrig").val(datos.otros[5].NumCertificadoOrigen);
    $("#txt_TipoCambio").val(datos.otros[5].TipoCambio);
    $("#txt_Incoterm").val(datos.otros[5].Incoterm);
    $("#selectCceMTraslado").val(datos.otros[5].MotivoTraslado);
    $("#id_RFCRec").val(datos.otros[5].numRegidTrib);

    // datos productos
    var item = datos.otros.find( item => item.hasOwnProperty("productos"));
    var tb = document.getElementById("tbSku");
    tb.innerHTML = "";
    if (!item) return; // no hay apartado de productos
    var productos = item.productos;
    for (var i in productos.rows) {
        var p = productos.rows[i];
        var tr = document.createElement("tr");

        var td = document.createElement("td");
        td.innerHTML = p.NoIdentificacion;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = p.FraccionArancelaria;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = p.ValorDolares;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = p.Marca;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = p.Modelo;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = p.NumeroSerie;
        td.setAttribute("contenteditable", "true");
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = p.cceDescEsp;
        tr.appendChild(td);

        td = document.createElement("td");
        td.innerHTML = p.cceDescIng;
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

    datos.otros[5].Version = $("#txt_cceVersion").val();
    datos.otros[5].TipoOperacion = $("#txt_cceTipoOp").val();
    datos.otros[5].ClavePedimento = $("#txt_cceClavePed").val();
    datos.otros[5].NoExportadorConfiabl = $("#txt_cceNExpConfiable").val();
    datos.otros[5].CertificadoOrigen = $("#txt_cceCertOrig").val();
    datos.otros[5].NumCertificadoOrigen = $("#txt_cceNCertOrig").val();
    datos.otros[5].TipoCambio = $("#txt_TipoCambio").val();
    datos.otros[5].Incoterm = $("#txt_Incoterm").val();
    datos.otros[5].MotivoTraslado = $("#selectCceMTraslado").val();
    datos.otros[5].numRegidTrib = $("#id_RFCRec").val();
    // datos productos
    var bloque = datos.otros.find( item => item.hasOwnProperty("productos"));
    var rows = [];
    if (bloque)
        rows = bloque.productos.rows;
    $("#tablaProductos tbody tr").each(function (index) {
        var p = rows[index];
        //var campo1, campo2, campo3;
        $(this).children("td").each(function (index2) {
            switch (index2) {
                case 0: p.NoIdentificacion = $(this).text();
                    break;
                case 1: p.FraccionArancelaria = $(this).text();
                    break;
                case 2: p.ValorDolares = $(this).text();
                    break;
                case 3: p.Marca = $(this).text();
                    break;
                case 4: p.Modelo = $(this).text();
                    break;
                case 5: p.NumeroSerie = $(this).text();
                    break;
                case 6: p.cceDescEsp = $(this).text();
                    break;
                case 7: p.cceDescIng = $(this).text();
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
/*  var cerDOrig = $("#txt_cceCertOrig").val;
  var noCertDorig = $("#txt_cceNCertOrig").val;
  var inco = $("#txt_Incoterm").val;
  var typeCambio = $("#txt_TipoCambio").val;
  if(cerDOrig == "" || noCertDorig == "" || inco == "" || typeCambio="")
  {
    alertMensaje("Algunos campos son obligatorios y no pueden ir vacios");
    return;
  }*/
    //if (txtSelected.nameTxt == null) {
    //    alertMensaje("Seleccione un elemento de la lista de archivos pendientes");
    //    return;
    //}
    //var facturasSinllenar = $("#idtbodyfac").find(".bg-warning, .bg-danger");
    //facturasSinllenar = facturasSinllenar.concat($("#idtbodyfac").find(".bg-danger"));
    var coreTimbrar = function () {
        setDatosFactura();
        var parametros = {
            nameTxt: txtSelected.nameTxt,
            factura: txtSelected.facturas[txtSelected.indexSelected],
        }
        General.post("/api/timbrarFactura", parametros)
        .then(function (result) {
            txtSelected.facturas.splice(txtSelected.indexSelected, 1);
            General.put("/api/facturas", txtSelected)
            .then(function (result) {
                cargarFacturas()
                console.log(result);
            })
            .catch(function (err) {
                //errorAlert();
                console.log(err);
            });
            // var cuerpoTableFacturas = document.getElementById("idtbodyfac");
            // cuerpoTableFacturas.innerHTML = ""; // limpia tabla de facturas
            // txtSelected = { // inicializa, ya que al timbrar no hay ningun elemento seleccionado
            //     nameTxt: null, // nombre del txt
            //     facturas: null, // facturas en json
            //     indexSelected: null, // factura seleccionada
            // }
            //cargarTxt();
            alertSucces();
        })
        .catch(function (err) {
            errorAlert();
            console.log(err);
        });
    }
    // if (facturasSinllenar && facturasSinllenar.length > 0) {
    //     $.confirm({
    //         title: `¡Hay ${facturasSinllenar.length} facturas con datos faltantes!`,
    //         content: '¿Desea Continuar?',
    //         buttons: {
    //             confirmar: function () {coreTimbrar();},
    //             cancelar: function () {return;},
    //         }
    //     });
    //     return;
    // }
    coreTimbrar();

}

//ocultar forms
function hideForms(){
    $("#idformulario").hide();
    $("#idcontenedorestxt").show();
    //$('#idSwitchHab').bootstrapToggle('off');
    $("#idSwitchHab").prop("checked", "");
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
    }
});
}

//alert Errorlogin
function alertErrorLogin(){
   $.alert({
    title: '¡Error!',
    content: 'Revisa tus datos de acceso!',
});
    // window.location.href = 'index.html';
    //return;
}

//alert mensaje
function alertMensaje(texto){
   $.alert({
       title: '¡Aviso!',
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
    if(valueswHab) {
        inputsForms.prop('disabled', false);
        //$("#tbSku").find("td").prop("contenteditable", "true");
    } else {
         inputsForms.prop('disabled', true);
         //$("#tbSku").find("td").prop("contenteditable", "false");
     }
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
        alertMensaje("¡Seleccione un elemento!");
        return;
    }
    General.post("/api/reeditar", {nameTxts: checks})
    .then(function (result) {
        //cargarTxt()
        $('#myModalHistorial').modal('hide');
        console.log(result);
    })
    .catch(function (err){
        console.log(err);
    });
}

function cargarUsuariosExis() {
    $("#idselectUsers").children().remove();
    var selectUsers = document.getElementById("idselectUsers");
    var optiondef = document.createElement("option");
    optiondef.textContent = "--Usuario nuevo--";
    optiondef.value=null;
    optiondef.selected = true;
    selectUsers.appendChild(optiondef);
    General.get("/api/user")
    .then(function(result) {
        for(i = 0; i < result.length; i++) {
            usuariosRegistrados = result;
            var option = document.createElement('option');
            // añadir el elemento option y sus valores
            selectUsers.options.add(option, i);
            selectUsers.options[i].value = result[i].id;
            selectUsers.options[i].innerText = result[i].name;
        }
    })
    .catch(function(err){
        console.log(err);
    });
}

function infoUserSelect() {
    var valorSelect = $("#idselectUsers" ).val();
    if(valorSelect != "null") {
        var index = $("#idselectUsers").prop('selectedIndex');
        var user = usuariosRegistrados[index];
        $("#inputlg").val(user.name);
        $("#inputdefault").val(user.userName);
        $("#inputsm").val(user.area);
        $("#selectRol" ).val(user.rolUser);
         $('#selectRol').selectpicker('refresh');
        if (user.rolUser == "admin") {
            $("#btnDeletuser").prop("disabled", "disabled");
        } else {
            $("#btnDeletuser").prop("disabled", "");
        }
        $("#idbtnAddUser").hide();
        $("#idbtnUpdateuser").show();
        $("#btnDeletuser").show();
        $("#contentDivsNewpsw").hide();
        $("#passChange").show();
    } else {
        $("#inputlg").val("");
        $("#inputdefault").val("");
        $("#pwd").val("");
        $("#inputsm").val("");
        $("#idbtnAddUser").show();
        $("#idbtnUpdateuser").hide();
        $( "#btnDeletuser" ).hide();
        $("#contentDivsNewpsw").show();
        $("#passChange").hide();
    }

}

function saveuserNew(){
    var camposClass = $('input.ctrl-valVaci');
    for(i=0; i < camposClass.length;i++){
        if(camposClass[i].value == ""){
            alertMensaje("Ingresa todos los campos solicitados!");
            return;
        }
    }
    var pass1 = document.getElementById("pwdnew1").value;
    var pass2 = document.getElementById("pwdnew2").value;
    if(pass1 == pass2){
      var nameCompleto = $("#inputlg").val();
      var userNom  = $("#inputdefault").val();
      var pass = $("#pwdnew1").val();
      var areaUser = $("#inputsm").val();
      var rol = $( "select#selectRol option:checked" ).val();
        General.post("/api/user/", {name: nameCompleto, userName: userNom, area: areaUser, password: pass, rolUser: rol})
        .then(function(result){
            if(result){
                cargarUsuariosExis();
                alertMensaje("Usuario creado con exito!");
                $('#myModal').modal('hide');
                $("#inputlg").val("");
                $("#inputdefault").val("");
                $("#pwdnew1").val("");
                $("#pwdnew2").val("");
                $("#inputsm").val("");
            }
        })
        .catch(function(err){
            if (err.status == 401)
                alertMensaje("¡No tiene permisos para crear usuarios!");
            else
                alertMensaje("Error al actualizar!");
        });
    } else {
        alertMensaje("La contraseñas no coinciden!");
    }
}

function updateuser() {
      var iduser = $("#idselectUsers").val();
      var nameCompletoUp = $("#inputlg").val();
      var userNomUp  = $("#inputdefault").val();
      var passUp = $("#pwd").val();
      var areaUserUp = $("#inputsm").val();
      var rolUp = $( "select#selectRol option:checked" ).val();
      General.put("api/user", {idU: iduser, nameCompletoU: nameCompletoUp, userNomU: userNomUp, passU: passUp, areaUserU: areaUserUp, rolU: rolUp})
      .then(function(result){
          if(result){
              cargarUsuariosExis();
              alertMensaje("Proceso de actualizado terminado!");
              $('#myModal').modal('hide');
          }else
              alertMensaje("Error al actualizar!");
      })
      .catch(function(err){
          if (err.status == 401)
              alertMensaje("¡No tiene permisos para actualizar usuarios!");
          else
              alertMensaje("Error al actualizar!");
      })
}

function deleteUser() {
    var idUser = $("#idselectUsers").val();
    General.delete("api/user/"+idUser)
    .then(function (result) {
        cargarUsuariosExis();
        alertMensaje("¡El usuario se ha eliminado correctamente!");
        $('#myModal').modal('hide');
    })
    .catch(function(err) {
        if (err.status == 200){
            cargarUsuariosExis();
            alertMensaje("¡El usuario se ha eliminado correctamente!");
            $('#myModal').modal('hide');
        } else if (err.status == 401) {
            alertMensaje("¡No tiene permisos para actualizar usuarios!");
        } else {
            alertMensaje("Error al actualizar!");
        }
    });
}

function testearBD(){
  General.get('api/testBDEIS')
  .then(function(result){
    alertMensaje("¡Conexion establecida correctamente!");
  })
  .catch(function(err){
    if(err.status == 500){
          alertMensaje("¡No hay conexion!");
    }
  })
}

function funcionEnter(evento) {
    //para IE
    if (window.event) {
        if (window.event.keyCode==13) logueo();
    } else {
        //Firefox y otros navegadores
        if (evento) {
            if(evento.which==13) logueo();
        }
    }
}

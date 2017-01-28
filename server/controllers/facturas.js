'use strict'

// consulta base de datos sqlServer
//const EIS = require("./EIS.js");
// lectura de archivos de directorios y archivos de texto
const fs = require('fs');
// lectura de excel
const XLSX = require('xlsx');
const excel = require('../excel')


//const dirFiles = "E:/datos_txt"
const dirFiles = "./datos_txt";


var jsonExcel = (function(){
    var workbook = XLSX.readFile("./info_excel/Base_avance_para_IT.xlsx");
    //return excel.readExcel(workbook);
    var sheets = excel.readExcel(workbook);
    return sheets[0];
})();


function getListTxt(req, res) {
    fs.readdir(dirFiles, (err, files) => {
        if (err) {
            return res.status(200).send(null);
            console.log(err);
        }
        var lista = [];
        for (var i in files) {
            var archivo = {};
            var nameFile =  dirFiles +"/"+ files[i];
            var texto = fs.readFileSync(nameFile, 'utf8');
            archivo.nombre = files[i];
            archivo.cantidad = texto.split("XXXINICIO").length;
            lista.push(archivo);
        }
        return res.status(200).send(lista);
    });
}

function getFacturas(req, res) {
    var nameFile = dirFiles + "/" + req.body.nameFile;
    //var nameFile = dirFiles + "/" + "33_NPG_Invoices_303479_Thru_303501_On_2016-11-24.txt"
    fs.readFile(nameFile, 'utf8', (err, data) => {
        if (err) throw err;
            var facturas = data.split("XXXINICIO");

            facturas = facturas.map( item => {
                return item.split("\r\n\r\n")
                    .map( item => {
                        var elementos = item.split("\r\n");
                        var dic = {};
                        for (var i = 0; i < elementos.length; i++) {
                            var item = elementos[i].trim();
                            if (item == "") continue;
                            var key = item.split(" ")[0];
                            var value = item.substring(key.length, item.length).trim();
                            if (key == "TpoCodigo1"){
                                var infoHead = procesarHead(item);
                                var rows = [];
                                i++;
                                while(i < elementos.length){
                                    rows.push(procesarRow(elementos[i], infoHead));
                                    i++;
                                }
                                dic["productos"] =  { head: infoHead, rows: rows } ;
                            } else {
                                dic[key] = value;
                            }
                        }
                        return dic;
                    });
            });

            var facturasProcesadas = [];
            for (var i in facturas) {
                var factura = facturas[i];
                if (factura.length < 2) continue;
                var facturaProcesada = {
                    factura: [], // datos facutura
                    emisor:[], // datos emisor
                    receptor: [], // datos receptor
                    otros: [] //  XXXFINDETA
                };
                var parteAcutal = null;  // indicara la parte actual de la factura
                for (var j in factura ) {
                    var itemFactura = factura[j];
                    var key = Object.keys(itemFactura)[0];
                    if (typeof key == "undefined") continue;
                    switch(key){
                        case "NumeroInterno":
                            parteAcutal = "factura"
                            break;
                        case "RFCEmisor":
                            parteAcutal = "emisor"
                            break;
                        case "RFCRecep":
                            parteAcutal = "receptor"
                            break;
                        case "XXXFINDETA":
                            parteAcutal = "otros"
                            break;
                    }

                    switch(parteAcutal){
                        case "factura":
                            facturaProcesada.factura.push(itemFactura);
                            break;
                        case "emisor":
                            facturaProcesada.emisor.push(itemFactura);
                            break;
                        case "receptor":
                            facturaProcesada.receptor.push(itemFactura);
                            break;
                        case "otros":
                            facturaProcesada.otros.push(itemFactura);
                            break;
                    }
                }
                facturasProcesadas.push(facturaProcesada);
            }

            var nuevosDatos = {
                cceNExpConfiable: "",
                cceCertOrig: "",
                cceNCertOrig: "",
                cceVersion: "",
                cceTipoOp: "",
                cceClavePed: "",
            }
            facturasProcesadas.emisor.push(nuevosDatos);

            facturasProcesadas.emisor.productos
            return res.status(200).send(facturasProcesadas);
    });
}


function procesarHead(linea){
    var head = [];
    var array = linea.split(" ")
    array = array.filter((a,b,c) =>{return c.indexOf(a,b+1)<0});
    array = array.filter( item => item != "");
    for (var i in array) {
        var itemHead = {
            nombre: array[i],
            posicion: linea.search(array[i])
        }
        head.push(itemHead);
    }
    return head;
}

function procesarRow(linea, head){
    var row = {};
    for (var i = 0; i < head.length - 1; i++){
        var inicio = head[i].posicion;
        var fin = head[i + 1].posicion;
        row[head[i].nombre] = linea.substring(inicio, fin).trim();
        //row.push(linea.substring(inicio, fin).trim());
    }
    row[head[head.length-1].nombre] = linea.substring(head[head.length-1].posicion, linea.length).trim();
    //row.push(linea.substring(head[head.length-1].posicion, linea.length).trim());
    complementarInfoPrducto(row, head);
    return row;
}


function saveText(req, res) {
    var facturas = req.body.facturas;
    var white = "                                                                                                                        ";
    var inicio = "XXXINICIO";
    var texto = "";

    for (var i in facturas) {
        var factura = facturas[i];
        texto += inicio + "\r\n";
        for(var keySeccion in factura) {
            var seccion = factura[keySeccion];
            if (keySeccion == "otros") texto += "\r\n\r\n\r\n";
            for (var keyItemSeccion in seccion) {
                var itemSeccion = seccion[keyItemSeccion]
                for (var keyImteSeccion in itemSeccion) {
                    if (keyImteSeccion == "productos") {
                        texto += writeProductos(itemSeccion[keyImteSeccion]);
                    } else {
                        texto += keyImteSeccion + white.substring(0, 17 - keyImteSeccion.length) + itemSeccion[keyImteSeccion] + "\r\n";
                    }
                }
                texto += "\r\n";
            }
            if (keySeccion == "otros") texto = texto.substring(0, texto.length - 2);
        }
    }
/////////////3032
    fs.writeFile( dirFiles + "/" + 'message.txt', texto, (err) => {
        if (err) {
            res.status(200).send({"message": `error al guardar el archivo ${err}`});
        };
        res.status(200).send({"message": "suscces" });
    });

}

function writeProductos(productos) {
    var white = "                                                                                                                                                                                                                                                                                          ";
    var texto = "";
    for (var i = 0; i < productos.head.length-1; i++) {
        var espcioDisponible = productos.head[i+1].posicion - productos.head[i].posicion;
        texto += productos.head[i].nombre + white.substring(0, espcioDisponible - productos.head[i].nombre.length);
    }
    texto += productos.head[productos.head.length-1].nombre;
    texto += "\r\n";
    for (var i = 0; i < productos.rows.length; i++) {
        var row = productos.rows[i];
        for (var j = 0; j < productos.head.length-1; j++) {
            var keys = Object.keys(row)
            var espcioDisponible = productos.head[j+1].posicion - productos.head[j].posicion;
            texto += row[keys[j]] + white.substring(0, espcioDisponible - row[keys[j]].length);
        }
        texto += row[keys[keys.length-1]];
        texto += "\r\n";
    }
    return texto;
}

function complementarInfoPrducto (producto, head) {

    var codigo = producto.VlrCodigo1

    var infoExcel = jsonExcel.data.find(elemento => elemento.RPRDNO == codigo)
    || { DESCRIPCION_EN_ESPAnOL: "", DESCRIPCION_EN_INGLES: "", FRACCION: "" };

    var match = {cceDescES: "DESCRIPCION_EN_ESPAnOL", cceDescEN: "DESCRIPCION_EN_INGLES", cceFraccion: "FRACCION"}
    var checkItemExcel = function(key) {
        var tmp = head.find( item => item.nombre == key );
        if (!tmp) {
            head.push({ nombre: key, posicion: head[head.length - 1].posicion + 100 }) // descripcion español
            producto[key] = infoExcel[match[key]];
        }
    }

    var checkItemEIS = function(key) {
        var tmp = head.find( item => item.nombre == key );
        if (!tmp) {
            head.push({ nombre: key, posicion: head[head.length - 1].posicion + 100 }) // descripcion español
            producto[key] = "";
        }
    }
    // datos excel
    checkItemExcel("cceDescES");
    checkItemExcel("cceDescEN");
    checkItemExcel("cceFraccion");
    // datos EIS
    checkItemEIS("cceMarca");
    checkItemEIS("cceModelo");
}

module.exports = {
    getListTxt,
    //testDB,
    getFacturas,
};

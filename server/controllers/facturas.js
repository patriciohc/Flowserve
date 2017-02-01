'use strict'

// consulta base de datos sqlServer
const EIS = require("./EIS.js");
// lectura de archivos de directorios y archivos de texto
const fs = require('fs');
// lectura de excel
const XLSX = require('xlsx');
const excel = require('../excel')

//const dirFiles = "E:/datos_txt"
const dirFacturas = "./datos_txt";
const dirFacturasNacionales = "./facturas_nacionales";

// carga informacion del excel en formato json
var jsonExcel = (function(){
    var workbook = XLSX.readFile("./info_excel/Base_avance_para_IT.xlsx");
    //return excel.readExcel(workbook);
    var sheets = excel.readExcel(workbook);
    return sheets[0];
})();
/** esta a la eschucha de nuevos txt en el directorios de faturas */
fs.watch(dirFacturas, {encoding: 'utf8'}, (eventType, filename) => {
    if (eventType == "rename")
        if (filename){
            procesarTxt(filename, dirFacturas);
        }
});
/** procesa los txt que se encuentran en el directorio */
function procesarDirectorio(){
    var list = fs.readdirSync(dirFacturas);
    for (var i in list) {
        procesarTxt(list[i], dirFacturas);
    }
}
/**
* separa en facturas nacionales y extranjeras, en las facturas extranjeras agrega
* la informacion requerida, las facturas nacionales las guarda en un nuevo txt
* @param {string} nameTxt - nombre completo del archivo txt
* @param {string} dir - directorio
*/
function procesarTxt(nameTxt, dir) {
    var facturas = convertTxtToJson(dir + "/" + nameTxt);
    if (!facturas) return;
    facturas = separarFacturas(facturas);
    if (facturas.nacionales.length > 0) {
        var nombreNacionales = nameTxt.split(".")[0] + "_A1" + ".txt";
        console.log("Escribiendo facturas nacionales: "+ nombreNacionales);
        writeFile(facturas.nacionales, nombreNacionales, dirFacturasNacionales);
    }
    addInfoFactura(facturas.extranjeras).then( values => {
        console.log("Escribiendo facturas extranjenar: "+ nameTxt);
        writeFile(facturas.extranjeras, nameTxt, dirFacturas)
    }).catch( err => {
        console.log(err);
    });

}
/**
* separa en facturas nacionales y extranjeras
* @param {Array} facturas - array de facturas
*/
function separarFacturas(facturas) {
    var s = {
        nacionales: [],
        extranjeras: []
    };
    for (var i in facturas ){
        var lugar = facturas[i].receptor[2].Pais;
        if (lugar == "MEXICO"){
            s.nacionales.push(facturas[i]);
        } else {
            s.extranjeras.push(facturas[i]);
        }
    }
    return s;
}
/**
* agrega la informacion requerida para facturas extranjeras
* @param {Array} - array de facturas
* @return {Promise} promises
*/
function addInfoFactura(facturas) {
    var promises = []
    for (var i in facturas){
        addSeccionManual(facturas[i]);
        complementarInfoPrductos(facturas[i].receptor[2].productos, promises)
    }
    return Promise.all(promises);
}
/**
* procesa el txt y regresa un json con las facturas que contiene
* @param {string} nameFile - nombre completo de archivo
*/
function convertTxtToJson(nameFile) {
    //var nameFile = dirFiles + "/" + "33_NPG_Invoices_303479_Thru_303501_On_2016-11-24.txt";
    var texto = fs.readFileSync(nameFile, 'utf8');
    if (!texto) return;
    var facturas = texto.split("XXXINICIO");
    facturas = facturas.filter(item => item != item.trim());
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
                    if (key == "TpoCodigo1") {
                        var infoHead = procesarHead(item);
                        var rows = [];
                        while(++i < elementos.length)
                            rows.push(procesarRow(elementos[i], infoHead));
                        dic["productos"] =  { head: infoHead, rows: rows } ;
                    } else {
                        dic[key] = value;
                    }
                }
                return dic;
            });
    });

    var facturasProcesadas = [];
    var arrayPromises = [];
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
    return facturasProcesadas;
}
/**
* agrega las claves para la informacion que se agregara manualmente
* @param {json} factura - factura
*/
function addSeccionManual(factura){
    var nuevosDatos = {
        cceNExpConfiable: "",
        cceCertOrig: "",
        cceNCertOrig: "",
        cceVersion: "",
        cceTipoOp: "",
        cceClavePed: "",
    }
    factura.receptor.push(nuevosDatos);
}
/**
* dentro de cada factura hay un aparatado donde se encuetran los productos con
* con su descripcion en forma de columnas, esta funcion procesa el nombre de
* las columnas
* @param {string} linea - linea de texto
* @return {json} array de json { nombre: nombre de la columna,
* posicion: numero de columna en la que se encuentra dentro del txt  }
*/
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
/**
* dentro de cada factura hay un aparatado donde se encuetran los productos con
* con su descripcion en forma de columnas, esta funcion procesa cada producto
* @param {string} linea - linea de texto
* @return {json}
*/
function procesarRow(linea, head){
    var row = {};
    for (var i = 0; i < head.length - 1; i++){
        var inicio = head[i].posicion;
        var fin = head[i + 1].posicion;
        row[head[i].nombre] = linea.substring(inicio, fin).trim();
    }
    row[head[head.length-1].nombre] = linea.substring(head[head.length-1].posicion, linea.length).trim();
    return row;
}
/**
* guarda el texto en un archivo
* @param {string} facturas - facturas en json
* @param {string} nombreTxt - nmbre del archivo
* @param {string} directorio - directorio donde se guardara
*/
function writeFile(facturas, nombreTxt, directorio) {
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
                        texto += convertProductosJsonToTxt(itemSeccion[keyImteSeccion]);
                    } else {
                        texto += keyImteSeccion
                            + white.substring(0, 17 - keyImteSeccion.length)
                            + itemSeccion[keyImteSeccion] + "\r\n";
                    }
                }
                texto += "\r\n";
            }
            if (keySeccion == "otros") texto = texto.substring(0, texto.length - 2);
        }
    }
/////////////3032
    return new Promise( (resolve, reject) => {
        fs.writeFile( directorio + "/" + nombreTxt, texto, (err) => {
            if (err) reject(err);
            resolve();
        });
    });

}
/**
* convierte lo productos que se encuentran en formato json a texto para ser escritos
* en el text
* @param {json} productos - productos
*/
function convertProductosJsonToTxt(productos) {
    var white = "                                                                                                                                                                                                                                                                                          ";
    var texto = "";
    for (var i = 0; i < productos.head.length-1; i++) {
        var espcioDisponible = productos.head[i+1].posicion - productos.head[i].posicion;
        texto += productos.head[i].nombre
            + white.substring(0, espcioDisponible - productos.head[i].nombre.length);
    }
    texto += productos.head[productos.head.length-1].nombre;
    texto += "\r\n";
    for (var i = 0; i < productos.rows.length; i++) {
        var row = productos.rows[i];
        for (var j = 0; j < productos.head.length-1; j++) {
            var keys = Object.keys(row)
            var espcioDisponible = productos.head[j+1].posicion - productos.head[j].posicion;
           // var value = row[keys[j]].toString();
              var value = "";
            if (row[keys[j]])
                value = row[keys[j]].toString();
            texto += value + white.substring(0, espcioDisponible - value.length);
        }
        texto += row[keys[keys.length-1]];
        texto += "\r\n";
    }
    return texto;
}
/**
* complementa la informacion que se requiere para cada producto
* @param {json} producto - producto
* @param {json} head - descripcion de las columnas
*/
function complementarInfoPrducto(producto, head) {

    var codigo = producto.VlrCodigo1

    var infoExcel = jsonExcel.data.find(elemento => elemento.RPRDNO == codigo)
    || { DESCRIPCION_EN_ESPAnOL: "", DESCRIPCION_EN_INGLES: "", FRACCION: "" };

    var match = {cceDescES: "DESCRIPCION_EN_ESPAnOL", cceDescEN: "DESCRIPCION_EN_INGLES", cceFraccion: "FRACCION"}
    var checkItemExcel = function(key) {
        var tmp = head.find( item => item.nombre == key );
        if (!tmp) {
            head.push({ nombre: key, posicion: head[head.length - 1].posicion + 100 });
        }
        if (!producto.hasOwnProperty(key))
            producto[key] = infoExcel[match[key]];
    }

    var checkItemEIS = function(key) {
        var tmp = head.find( item => item.nombre == key );
        if (!tmp) {
            head.push({ nombre: key, posicion: head[head.length - 1].posicion + 100 })
        }
        if (!producto.hasOwnProperty(key))
            producto[key] = ""
    }
    // datos excel
    checkItemExcel("cceDescES");// descripcion español
    checkItemExcel("cceDescEN");// descripcion ingles
    checkItemExcel("cceFraccion");// fraccion
    // datos EIS
    checkItemEIS("cceMarca");
    checkItemEIS("cceModelo");
}
/**
* complementa la informacion para los productos recibidos
* @param {json} productos - array de productos
* @param {Array} arrayPromises - debido a que se ejecutan consultas sqlServer
* asincronas, es necesario para determinar el momento en que se han ejecutado todas
*/
function complementarInfoPrductos(productos, arrayPromises){
    for (var i in productos.rows){
        var p = productos.rows[i];
        complementarInfoPrducto(p, productos.head);
        var promise = EIS.getDatos(p.VlrCodigo1).then(function(datos){
            p.cceMarca = datos.marca;
            p.cceModelo = datos.modelo;
        });
        arrayPromises.push(promise);
    }
}

//////// funciones en escucha de peticiones http ///////

/**
* obtiene una lista de txt en el directorio
* @return lista de archivos txt en el directorio { nombre, cantidad: cantidad de facturas }
*/
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
            archivo.cantidad = texto.split("XXXINICIO").filter(item => item != item.trim()).length;
            lista.push(archivo);
        }
        return res.status(200).send(lista);
    });
}
/**
* regresa las facturas en el txt
*/
function getFacturas(req, res) {
    var nameFile = dirFacturas + "/" + req.body.nameFile;
    var facturas = convertTxtToJson(nameFile);
    res.status(200).send(facturas);
}
/**
* guardas las facturas en el txt
*/
function guardarTxt(req, res){
    var facturas = req.body.facturas;
    var nameTxt = req.body.nameFile;
    if (!facturas)
        res.status(200).send({message: "no hay facturas por guardar"});

    writeFile(facturas, nombreTxt, dirFacturas)
    .then( () => {
        res.status(200).send({message: "success"});
    })
    .catch( err => {
        res.status(500).send({error: err});
    });
}
/**
* turnar
*/
function turnar(req, res) {

}

function procesarCarpeta(req, res){
    procesarDirectorio();
}

module.exports = {
    getListTxt,
    //testDB,
    getFacturas,
    guardarTxt,
    turnar,
    //tmp
    procesarCarpeta,
};

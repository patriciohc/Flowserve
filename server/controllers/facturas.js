'use strict'

// consulta base de datos sqlServer
const EIS = require("./EIS.js");
// lectura de archivos de directorios y archivos de texto
const fs = require('fs');
const iconvlite = require('iconv-lite');
// lectura de excel
const XLSX = require('xlsx');
const excel = require('../excel');

//onst dirFacturas = "./datos_txt";
//const dirFacturasNacionales = "./timbradas";
//const dirFacturasTimbradas = "./timbradas";

//const fileDatosExcel = "./info_excel/Base_avance_para_IT.xlsx";
//const fileDatosEscelRfc = "./info_excel/TaxID.xlsx"

const dirFacturas = "\\\\tlxfp1/prnportCCE/Entrada";
const dirFacturasNacionales = "\\\\tlxfp1/prnportCCE/Salida";
const dirFacturasTimbradas = "\\\\tlxfp1/prnportCCE/Salida";

const fileDatosExcel = "E:/APPCCE/BDExcel/Base_avance_para_IT.xlsx";
const fileDatosEscelRfc = "E:/APPCCE/BDExcel/TaxID.xlsx"

var io; // websockets
var watch // en escucha de archivos

function cargaDeExcel(file) {
    var workbook = XLSX.readFile(file);
    //return excel.readExcel(workbook);
    var sheets = excel.readExcel(workbook);
    return sheets[0];
}
// carga informacion del excel en formato json
var jsonExcel = cargaDeExcel(fileDatosExcel);

var jsonExcelRfc = cargaDeExcel(fileDatosEscelRfc);
// determina si un txt tiene A1 en su nombre
function Isprocessed(fileName) {
    var isProsesada = fileName.split("_");
    isProsesada = isProsesada[isProsesada.length-1];
    if (isProsesada == "A1.txt")
        return true;
    else
        return false;
}

/** esta a la eschucha de nuevos txt en el directorios de faturas */
var txtPendientesParaProcesar = [];
function callBackWatchFs(eventType, filename) {
    if (!filename)
        return;

    if (Isprocessed(filename) || !testNameTxt(filename))
        return;

    if (eventType == "rename") {
        if (fs.existsSync(dirFacturas + "/" +filename)) {
            console.log("inicio-> " + filename);
            procesarTxt(filename, dirFacturas)
            .then(function (newFile) {
                console.log("termino-> " + newFile);
                var txt = getNumFacturasTxt(newFile, dirFacturas);
                io.emit('newTxt', txt);
            })
            .catch(function (err) {
                if (err.code == 'EBUSY') {
                    txtPendientesParaProcesar.push(filename + "|" + "1");
                }
            });
        }
    } else {
        var item = txtPendientesParaProcesar.find(item => item.split("|")[0] == filename);
        if (!item) return;
        var indexFile = txtPendientesParaProcesar.indexOf(item);
        var archivo = txtPendientesParaProcesar[indexFile].split("|")[0];
        var stage = txtPendientesParaProcesar[indexFile].split("|")[1];
        if (stage == "1") {
            txtPendientesParaProcesar[indexFile] = archivo + "|" + "2";
        } else if (stage == "2") {
            txtPendientesParaProcesar.splice( indexFile, 1 );
            if (fs.existsSync(dirFacturas + "/" +filename)) {
                procesarTxt(filename, dirFacturas).then( function (newFile){
                    console.log("termino-> " + newFile);
                    var txt = getNumFacturasTxt(newFile, dirFacturas)
                    io.emit('newTxt', txt);
                });
            }
        }
    }
}

//watch.close();

/** procesa los txt que se encuentran en el directorio */
function procesarDirectorio() {
    var list = fs.readdirSync(dirFacturas);
    var arrayPromises = [];
    for (var i in list) {
        if (Isprocessed(list[i]) || !testNameTxt(list[i]) ) {
            continue;
        } else {
            console.log("procesando ->" + list[i]);
            arrayPromises.push(procesarTxt(list[i], dirFacturas));
        }
    }
    return Promise.all(arrayPromises);
};

// procesar archivos txt en directorio de trabajo y pone a la escuha de nuevos txt
(function() {
    if (watch) {
        watch.close();
        watch = null;
        txtPendientesParaProcesar = [];
    }
    procesarDirectorio().then(() => {
        watch = fs.watch(dirFacturas, {encoding: 'utf8'}, callBackWatchFs);
    }).catch(err => {
        if (err.code == 'EISDIR'){
            console.log("escuchando");
            watch = fs.watch(dirFacturas, {encoding: 'utf8'}, callBackWatchFs);
        }
        else
            console.log(err);
    });
})();
/**
* separa en facturas nacionales y extranjeras, en las facturas extranjeras agrega
* la informacion requerida, las facturas nacionales las guarda en un nuevo txt
* @param {string} nameTxt - nombre completo del archivo txt
* @param {string} dir - directorio
*/
function procesarTxt(nameTxt, dir) {
    var facturas = convertTxtToJson(dir + "/" + nameTxt);
    if (!facturas) return new Promise((resolv) => resolv());
    if (facturas.code) { // error
        return new Promise((resolv, reject) => reject(facturas));
    }
    facturas = separarFacturas(facturas);
    if (facturas.nacionales.length > 0)
        writeFile(facturas.nacionales, nameTxt, dirFacturasNacionales);
    if (facturas.novalidas.length > 0) {
        var novalidas = nameTxt.split(".")[0] + "_formato_no_valido" + ".txt";
        writeFile(facturas.novalidas, novalidas, dirFacturas);
    }

    var promise = new Promise( (resolv, reject) => {
        addInfoFactura(facturas.extranjeras).then( values => {
            //console.log(facturas.extranjeras);
            var nombreExtranjeras = nameTxt.split(".")[0] + "_A1" + ".txt";
            writeFile(facturas.extranjeras, nombreExtranjeras, dirFacturas).then(() => {
               if (fs.existsSync(dirFacturas + "/" +nameTxt)) {
                  fs.unlinkSync(dirFacturas + "/" + nameTxt);
               }
               resolv(nombreExtranjeras);
            });
        }).catch( err => {
            reject(err);
        });
    });

    return promise;
}
/**
* separa en facturas nacionales y extranjeras
* @param {Array} facturas - array de facturas
*/
function separarFacturas(facturas) {
    var s = {
        novalidas: [],
        nacionales: [],
        extranjeras: []
    };
    for (var i in facturas ) {
        if (!facturas[i].receptor || facturas[i].receptor.length < 2 || !facturas[i].receptor[2].Pais) {
            console.log("factura tiene formato no valido");
            s.novalidas.push(facturas[i]);
            continue;
        }
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
        addSeccionComercioExterior(facturas[i]);
        if (!facturas[i].receptor || facturas[i].receptor.length < 2 || !facturas[i].receptor[2].productos) {
            console.log("factura no cotiene lista de productos");
            continue;
        }
        complementarInfoPrductos(facturas[i].receptor[2].productos , facturas[i].otros[facturas[i].otros.length - 2].productos, promises);
    }
    return Promise.all(promises);
}
/**
* agrega las claves para la informacion que se agregara manualmente
* @param {json} factura - factura
*/
function addSeccionComercioExterior(factura) {
    var tipoCambio = factura.otros.find( item => item.hasOwnProperty("FctConv") ).FctConv;
    var icoterm = factura.otros.find( item => item.hasOwnProperty("TermsEmb") ).TermsEmb;

    var rfc = jsonExcelRfc.data.find( item => {
        if (!item.No_cliente)
            return false;
        else
            return item.No_cliente.trim() == factura.receptor[0].CdgCliente.trim();
    });
    console.log(rfc);
    if (rfc) {
        rfc = rfc.RFC
    } else {
        rfc = "";
    }
    if (icoterm && icoterm.length <= 3){
        icoterm = icoterm.substring(0, 3);
    }
    var nuevosDatos = {
        "======================ComercioExterior": "",
        Version: "1.1",
        TipoOperacion: "2",
        ClavePedimento: "A1",
        CertificadoOrigen: "",
        NumCertificadoOrigen: "",
        numRegidTrib: rfc,
        MotivoTraslado: "",
        NoExportadorConfiabl: "",
        TipoCambio: tipoCambio,
        Incoterm: icoterm,
        "xxxxxxxxxxxxxxxxxxxxxxxxxDetalleMercancias": "",
        productos: {
            head:[
                {nombre: "NoIdentificacion", posicion: 0},
                {nombre: "FraccionArancelaria", posicion: 30},
                {nombre: "ValorDolares", posicion: 60},
                {nombre: "Marca", posicion: 100},
                {nombre: "Modelo", posicion: 150},
                {nombre: "NumeroSerie", posicion: 200},
                {nombre: "cceDescEsp", posicion: 250},
                {nombre: "cceDescIng", posicion: 300},
            ]
            //rows: [],
        }
    }
    // busca si ya fueron agregados los nuevos datos
    //var nuevosDatosTest = factura.receptor.find( item => item.hasOwnProperty("cceNExpConfiable"));
    var nuevosDatosTest = factura.otros.find( item => item.hasOwnProperty("======================ComercioExterior"));
    if (!nuevosDatosTest) {
        var tmp = factura.otros.pop();
        factura.otros.push(nuevosDatos);
        factura.otros.push(tmp);
        //factura.receptor.push(nuevosDatos);
    }
}
/**
* complementa la informacion para los productos recibidos
* @param {json} productos - array de productos
* @param {Array} arrayPromises - debido a que se ejecutan consultas sqlServer
* asincronas, es necesario para determinar el momento en que se han ejecutado todas
*/
function complementarInfoPrductos(productos, nuevaSeccionProductos, arrayPromises) {
    nuevaSeccionProductos.rows = [];
    for (var i in productos.rows) {
        var newRow = {
            NoIdentificacion: productos.rows[i].VlrCodigo1,
            FraccionArancelaria: "",
            ValorDolares: productos.rows[i].MontoNetoItem,
            Marca: "",
            Modelo: "",
            NumeroSerie: "",
            cceDescEsp: "",
            cceDescIng: "",
        }
        nuevaSeccionProductos.rows.push(newRow);
        var p = nuevaSeccionProductos.rows[i];
        //var p = productos.rows[i];
        complementarInfoExcelPrducto(p/*, nuevaSeccionProductos.head*/);
        var promise = EIS.getDatos(p).then(function(result) {
            //p.cceMarca = datos.marca;
            //p.cceModelo = datos.modelo;
        });
        arrayPromises.push(promise);
    }
}
/**
* procesa el txt y regresa un json con las facturas que contiene
* @param {string} nameFile - nombre completo de archivo
*/
function convertTxtToJson(nameFile) {
    if(!fs.existsSync(nameFile)) return [];
    try {
        var texto = fs.readFileSync(nameFile);
        texto = iconvlite.decode(texto, ' ISO-8859-1');
    } catch(err) {
        return err;
    }
    if (!texto) return [];
    var facturas = texto.split("XXXINICIO");
    facturas = facturas.filter(item => item.trim() != "");
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
                    if (key == "TpoCodigo1" || key == "NoIdentificacion") {
                        var infoHead = procesarHead(item);
                        var rows = [];
                        while(++i < elementos.length && elementos[i] != "xxxxxxxxxxxxxxxxxxxxxxxxxFinDetalleMercancias")
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
    if (!facturas || facturas.length == 0) {
        return new Promise( (resolve, reject) => {
            // if (fs.existsSync(directorio + "/" + nombreTxt)) {
            //     fs.unlinkSync(directorio + "/" + nombreTxt);
            // }
            resolve("noData")
        });
    }
    for (var i in facturas) {
        var factura = facturas[i];
        texto += inicio + "\r\n";
        for(var keySeccion in factura) {
            var seccion = factura[keySeccion];
            if (keySeccion == "otros") texto += "\r\n\r\n\r\n";
            for (var keyItemSeccion in seccion) {
                var itemSeccion = seccion[keyItemSeccion];
                if (keySeccion == "otros" && keyItemSeccion == 5 && seccion.length == 7){
                    texto += convertComercioExteriorToTxt(itemSeccion);
                    continue;
                }
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
    return new Promise( (resolve, reject) => {
        texto = iconvlite.encode(texto, ' ISO-8859-1');
        fs.writeFile( directorio + "/" + nombreTxt, texto, (err) => {
            if (err) reject(err);
            resolve("success");
        });
    });

}

function convertComercioExteriorToTxt(seccion) {
    var white = "                                    ";
    var texto = "======================ComercioExterior\r\n"
    var keys = Object.keys(seccion);
    for (var i = 1; i < keys.length-1; i++) {
        var keyItemSeccion = keys[i];
        texto += keyItemSeccion
            + white.substring(0, 31 - keyItemSeccion.length)
            + seccion[keyItemSeccion] + "\r\n";
    }
    //texto += "xxxxxxxxxxxxxxxxxxxxxxxxxDetalleMercancias\r\n";
    texto += convertProductosJsonToTxt(seccion.productos);
    texto += "xxxxxxxxxxxxxxxxxxxxxxxxxFinDetalleMercancias\r\n\r\n";
    return texto;
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
        var j;
        for (j = 0; j < productos.head.length-1; j++) {
            //var keys = Object.keys(row)
            var key = productos.head[j].nombre;
            var espcioDisponible = productos.head[j+1].posicion - productos.head[j].posicion;
           // var value = row[keys[j]].toString();
            var value = "";
            if (row[key])
                value = row[key].toString();
            texto += value + white.substring(0, espcioDisponible - value.length);
        }
        texto += row[productos.head[j].nombre];
        texto += "\r\n";
    }
    return texto;
}
/**
* complementa la informacion que se requiere para cada producto
* @param {json} producto - producto
* @param {json} head - descripcion de las columnas
*/
function complementarInfoExcelPrducto(producto/*, head*/) {

    var codigo = producto.NoIdentificacion;

    var infoExcel = jsonExcel.data.find(elemento => elemento.RPRDNO.trim() == codigo.trim())
    || { DESCRIPCION_EN_ESPAnOL: "", DESCRIPCION_EN_INGLES: "", FRACCION: "" };

    var match = {cceDescEsp: "DESCRIPCION_EN_ESPAnOL", cceDescIng: "DESCRIPCION_EN_INGLES", FraccionArancelaria: "FRACCION"};
    var comentarios;
    var checkItemExcel = function(key/*, esPirmero*/) {
        // var tmp = head.find( item => item.nombre == key );
        // if (!tmp && esPirmero) {
        //     comentarios = head.pop();
        //     head.push({ nombre: key, posicion: head[head.length - 1].posicion + 60 });
        // } else if (!tmp) {
        //     head.push({ nombre: key, posicion: head[head.length - 1].posicion + 100 });
        // }
        //if (!producto.hasOwnProperty(key))
        //console.log(infoExcel[match[key]]);
        producto[key] = infoExcel[match[key]];
    }

    // var checkItemVacio = function(key) {
    //     var tmp = head.find( item => item.nombre == key );
    //     if (!tmp) {
    //         head.push({ nombre: key, posicion: head[head.length - 1].posicion + 60 })
    //     }
    //     if (!producto.hasOwnProperty(key))
    //         producto[key] = ""
    // }
    // datos excel
    checkItemExcel("cceDescEsp"/*, true*/);// descripcion español
    checkItemExcel("cceDescIng");// descripcion ingles
    checkItemExcel("FraccionArancelaria");// fraccion
    // campos vacios
    //checkItemVacio("cceMarca");
    //checkItemVacio("cceModelo");
    //checkItemVacio("cceSerie");

    //if (comentarios)
    //    head.push({ nombre: comentarios.nombre, posicion: head[head.length - 1].posicion + 50 });
}

/**
* @param {string} nameTxt - nombre del txt
* @param {string} dir - directorio
* @return nombre y numero de facturas contenidas en el archivo
*/
function getNumFacturasTxt(nameFile, dir) {
    var archivo = {};
    var nameFileCompleto =  dir +"/"+ nameFile;
    var texto = fs.readFileSync(nameFileCompleto, 'utf8');
    archivo.nombre = nameFile;
    archivo.cantidad = texto.split("XXXINICIO").filter(item => item != item.trim()).length;
    return archivo;
}

//////// funciones en escucha de peticiones http ///////

/**
* obtiene una lista de txt en el directorio
* @param {string} directorio - pendientes, timbradas
* @return lista de archivos txt en el directorio { nombre, cantidad: cantidad de facturas }
*/
/*function getListTxt(req, res) {
    console.log("getListTxt");
    var dir = "";
    if (req.query.directorio == "pendientes")
        dir = dirFacturas;
    else if (req.query.directorio == "timbradas")
        dir = dirFacturasTimbradas;
    else
        return res.status(404).send({message:"directorio no valido"});

    var fIni, fFin;
    if (req.query.fIni) {
        fIni = new Date(req.query.fIni);
    } else {
        fIni = new Date("2014-01-01");
        //fIni.setDate(1);
    }
    if (req.query.fFin) {
        fFin = new Date(req.query.fFin);
    } else {
        fFin = new Date("2060-01-01");
        //fFins.setDate(30);
    }

    var getLista = function (files) {
        var lista = [];
        for (var i in files) {
            var archivo = {};
            var infoName = testNameTxt(files[i]);
            if (!infoName) continue;
            if (fIni.getTime() <= infoName.fecha.getTime() &&  infoName.fecha.getTime() <= fFin.getTime() ) {
                var archivo = getNumFacturasTxt(files[i], dir)
                lista.push(archivo);
            }
        }
        return lista;
    };

    fs.readdir(dir, (err, files) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        if (dir == "pendientes") {
            procesarDirectorio().then( () => {
                var lista = getLista(files);
                return res.status(200).send(lista);
            });
        } else {
            var lista = getLista(files);
            return res.status(200).send(lista);
        }


    });
}*/
function getListTxt(req, res) {
    console.log("getListTxt");
    var dir = "";
    if (req.query.directorio == "pendientes")
        dir = dirFacturas;
    else if (req.query.directorio == "timbradas")
        dir = dirFacturasTimbradas;
    else
        return res.status(404).send({message:"directorio no valido"});

    var fIni, fFin;
    if (req.query.fIni) {
        fIni = new Date(req.query.fIni);
    } else {
        fIni = new Date("2014-01-01");
        //fIni.setDate(1);
    }
    if (req.query.fFin) {
        fFin = new Date(req.query.fFin);
    } else {
        fFin = new Date("2060-01-01");
        //fFins.setDate(30);
    }

    var getLista = function (files) {
        var lista = [];
        for (var i in files) {
            var archivo = {};
            var infoName = testNameTxt(files[i]);
            if (!infoName) continue;
            if (fIni.getTime() <= infoName.fecha.getTime() &&  infoName.fecha.getTime() <= fFin.getTime() ) {
                var archivo = getNumFacturasTxt(files[i], dir)
                lista.push(archivo);
            }
        }
        return lista;
    };

    fs.readdir(dir, (err, files) => {
        if (err) {
            console.log(err);
            return res.status(500).send(err);
        }
        if (dir == "pendientes") {
            procesarDirectorio().then( () => {
                var lista = getLista(files);
                return res.status(200).send(lista);
            });
        } else {
            var lista = getLista(files);
            return res.status(200).send(lista);
        }   
    });
}
/**
* regresa las facturas en el txt
*/
function getFacturas(req, res) {
    console.log("getFacturas");
    var nameFile = dirFacturas + "/" + req.body.nameFile;
    var facturas = convertTxtToJson(nameFile);
    res.status(200).send(facturas);
}
/**
* regresa las facturas en el txt
*/
function reProcesarTxt(req, res) {
    console.log("reProcesarTxt");
    jsonExcel = cargaDeExcel(fileDatosExcel);
    jsonExcelRfc = cargaDeExcel(fileDatosEscelRfc);
    if (watch) {
        watch.close();
        watch = null;
        txtPendientesParaProcesar = [];
    }
    var list = fs.readdirSync(dirFacturas);
    var arrayPromises = [];
    for (var i in list) {
        if (!Isprocessed(list[i])) {
            continue;
        } else {
            var tmp = list[i].split(".")[0];
            tmp = tmp.split("_");
            tmp.splice(tmp.length-1, 1);
            var name = tmp.join("_") + ".txt";
            fs.renameSync(dirFacturas + "/" + list[i], dirFacturas + "/" + name);
        }
    }

    procesarDirectorio().then(() => {
        watch = fs.watch(dirFacturas, {encoding: 'utf8'}, callBackWatchFs);
        return res.status(200).send({message: "success"});
    }).catch(err => {
        console.log(err);
        return res.status(500).send(err);
    });
}
/**
* guardas las facturas en el txt
*/
function guardarTxt(req, res){
    var facturas = req.body.facturas;
    var nameTxt = req.body.nameTxt;
    console.log("Guardar -> " + nameTxt);
    if (nameTxt && !facturas){
        if (fs.existsSync(dirFacturas + "/" +nameTxt)) {
           fs.unlinkSync(dirFacturas + "/" + nameTxt);
        }
    }
    writeFile(facturas, nameTxt, dirFacturas)
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
function timbrar(req, res) {
    var nameTxt = req.body.nameTxt;
    var factura = req.body.factura;
    console.log("timbrar -> " + nameTxt);
    var numeroInterno = factura.factura[0].NumeroInterno;
    var infoFile = testNameTxt(nameTxt);
    if (!infoFile){
        return res.status(404).send({message: "nombre de factura no valido"});
    }
    if (infoFile.parts.length == 9 ){
        var part1 = infoFile.parts.splice(0,3);
        infoFile.parts.splice(0,3);
        nameTxt = part1.join("_") + "_" + numeroInterno + "_Thru_" + infoFile.parts.join("_");
    }
    writeFile([factura], nameTxt, dirFacturasTimbradas)
    .then( () => {
        res.status(200).send({message: "success"});
    })
    .catch( err => {
        res.status(500).send({error: err});
    });
}
/**
* reeditar, regresa de facturas timbradas a facturas pendientes
* @param {string} nameTxt - nombre del txt timbrado
*/
function reEditar(req, res) {
    var nameTxts = req.body.nameTxts;
    console.log("reEditar -> " + nameTxts);
    for (var i = 0; i < nameTxts.length; i++) {
        var nameTxt = dirFacturasTimbradas + "/" + nameTxts[i];
        var destino = dirFacturas + "/" + nameTxts[i];
        if(fs.existsSync(nameTxt)) {
            var fileAct = nameTxts[i];
            fs.renameSync(nameTxt, destino);
            sendNewTxt(fileAct);
        }
    }
    return res.status(200).send({message:"success"});
}

//comprueba si el nombre de archivo es valido y avisa de un nuevo txt mediante sokects
function sendNewTxt(nameTxt) {
    if (!testNameTxt(nameTxt)){
        console.log("nombre de archivo no valido ->" + nameTxt);
        return;
    }
    var txt = getNumFacturasTxt(nameTxt, dirFacturas)
    io.emit('newTxt', txt);
}
// comprueba si el nombre de archivo es valido
function testNameTxt(nameTxt) {
    var partsTxt = nameTxt.split("_");
    if (partsTxt.length != 9 && partsTxt.length != 8 && partsTxt.length != 7) {
        return false;
    }
    if (partsTxt[2] == "Memos"){
        return false;
    }
    if (partsTxt[partsTxt.length - 1] == "A1.txt") {
        var fecha = partsTxt[partsTxt.length - 2];
        fecha = new Date(fecha);
        if (fecha == "Invalid Date") {
            return false;
        }
        else {
            return {
                parts: partsTxt,
                fecha: fecha
            };
        }
    } else {
        var fecha = partsTxt[partsTxt.length - 1];
        fecha = new Date(fecha.split(".")[0]);
        if (fecha == "Invalid Date") {
            return false;
        }
        else {
            return {
                parts: partsTxt,
                fecha: fecha
            };
        }
    }
}

function procesarCarpeta(req, res){
    procesarDirectorio();
    res.status(200).send();
}

function setSocketIO (socketIO) {
    io = socketIO;
}

module.exports = {
        getListTxt,
        reEditar,
        getFacturas,
        guardarTxt,
        timbrar,
        //tmp
        procesarCarpeta,
        setSocketIO,
        reProcesarTxt
}

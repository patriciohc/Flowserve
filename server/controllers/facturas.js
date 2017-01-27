'use strict'

// configuaraciones de las base de datos
const configDB = require('../configDB');
// conexcion sql server
//const Connection = require('tedious').Connection;
//var Request = require('tedious').Request;
//var TYPES = require('tedious').TYPES
// lectura de archivos de directorios y archivos de texto
const fs = require('fs');
// lectura de excel
const XLSX = require('xlsx');
const excel = require('../excel')


// var connection = new Connection(configDB.sqlServer);

// connection.on('connect', function(err) {
//     if (err){
//         console.log("error: " + err);
//     } else {
//         console.log("Connected");
//     }
// });

//const dirFiles = "E:/datos_txt"
const dirFiles = "./datos_txt";


var jsonExcel = (function(){
    var workbook = XLSX.readFile("./info_excel/Base_avance_para_IT.xlsx");
    return excel.readExcel(workbook);
})();


function getListTxt(req, res) {
    fs.readdir(dirFiles, (err, files) => {
        if (err) {
            console.log(err);
            throw err;
        }
        return res.status(200).send(files);
    });
}

function getDataFile(req, res) {
    var nameFile = dirFiles + "/" + "33_NPG_Invoices_303479_Thru_303501_On_2016-11-24.txt"
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
                                dic["productos"] = { head: infoHead, rows: rows };
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

            saveText(facturasProcesadas);
            return res.status(200).send(facturasProcesadas);
    });
}

function procesarHead(linea){
    var head = [];
    var array = linea.split(" ")
    array = array.filter((a,b,c) =>{return c.indexOf(a,b+1)<0});
    array = array.filter( item => item != "");
    for (var i in array){
        var itemHead = {
            nombre: array[i],
            posicion: linea.search(array[i])
        }
        head.push(itemHead);
    }
    return head;
}

function procesarRow(linea, head){
    var row = [];
    for (var i = 1; i < head.length; i++){
        var inicio = head[i - 1].posicion;
        var fin = head[i].posicion;
        row.push(linea.substring(inicio, fin).trim());
    }
    row.push(linea.substring(head[head.length-1].posicion, linea.length).trim());
    return row;
}


function saveText(facturas) {
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
                        //for ()
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
        if (err) throw err;
        console.log('It\'s saved!');
    });

}

function testDB(req, res){
    // var request = new Request("fsgTLXPartMaster", function(err, rowCount) {
    //     if (err) {
    //         console.log(err);
    //         throw err;
    //         return res.status(200).send("error");
    //     }
    //     //return res.status(200).send(rowCount);
    // });

    // request.addParameter('PartCode', TYPES.VarChar, '300000-BASE');
    // request.addParameter('OrganizationKey', TYPES.Int, '300000-BASE');

    // request.on('row', rows => {
    //     console.log(rows);
    //     return res.status(200).send(rows);
    // });

    // request.on('doneProc', (rowCount, more, returnStatus, rows) => {
    //     console.log(rows);
    //     return res.status(200).send(rows);
    // });

    // //request.on('row', columns => {
    // //    return res.status(200).send(columns);
    // //});

    // connection.callProcedure(request);
}

module.exports = {
    getListTxt,
    testDB,
    getDataFile,
};

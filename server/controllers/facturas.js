'use strict'

// configuaraciones de las base de datos
const configDB = require('../configDB');
// conexcion sql server
//const Connection = require('tedious').Connection;
var Request = require('tedious').Request;
// lectura de archivos de directorios y archivos de texto
const fs = require('fs');
// lectura de excel
const XLSX = require('xlsx');
const excel = require('../excel')


//var connection = new Connection(configDB.sqlServer);

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
                        for (var i in elementos){
                            var item = elementos[i];
                            var key = item.split(" ")[0];
                            var value = item.substring(key.length, item.length);
                            dic[key] = value;
                        }
                        return dic;
                    });
            });

            var  filtro = [];
            for (var i = 0; i < facturas.length; i++){
                var factura = facturas[i];
                if (factura.length > 1){
                    var sku = factura[6].SKU;
                    var info = jsonExcel[0].data.find( item => {
                        var key = sku.substring(14, 30).trim();
                        return item.RPRDNO == key
                    });
                    console.log(info);
                }
            }
            res.status(200).send(facturas);
    });
}

function testDB(req, res){
    // var request = new Request("select * from table_test", function(err, rowCount) {
    //     if (err) {
    //         console.log(err);
    //         throw err;
    //         return res.status(200).send("error");
    //     }
    //     //return res.status(200).send(rowCount);
    // });

    // request.on('row', columns => {
    //     return res.status(200).send(columns);
    // });

    // connection.execSql(request);
}

module.exports = {
    getListTxt,
    testDB,
    getDataFile,
};

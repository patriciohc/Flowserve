// // configuaraciones de las base de datos
// const configDB = require('../configDB');
// // conexcion sql server
// const Connection = require('tedious').Connection;
// var Request = require('tedious').Request;
// var TYPES = require('tedious').TYPES
//
// var connection = new Connection(configDB.sqlServer);
//
// connection.on('connect', function(err) {
//     if (err){
//         console.log("error: " + err);
//     } else {
//         console.log("Connected");
//     }
// });

function getDatos(sku) {

    // return new Promise( (resolve, reject) => {
    //
    //     var request = new Request("fsgTLXPartMaster", function(err, rowCount) {
    //         if (err) {
    //             success(null);
    //         }
    //     });
    //
    //     request.addParameter('PartCode', TYPES.VarChar, sku);
    //     request.addParameter('OrganizationKey', TYPES.Int, 1);
    //
    //     // request.on('row', rows => {
    //     //     console.log(rows);
    //     //     return res.status(200).send(rows);
    //     // });
    //
    //     request.on('doneProc', (rowCount, more, returnStatus, rows) => {
    //         var marca = rows.find( item => item.colName == "PartManufacturer");
    //         var modelo = rows.find( item => item.colName == "MfgPartNumber");
    //         resolve({marca, modelo});
    //     });
    // });

    return new Promise((resolve, reject) => {
        setTimeout(resolve, parseInt(Math.random() * 3000), {marca: "marca"+ sku, modelo: "modelo"+sku});
    });

    //connection.callProcedure(request);
}


module.exports = {
    getDatos,
};

// configuaraciones de las base de datos
const configDB = require('../configDB');
// conexcion sql server
const Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES


function getDatos(p) {

     var connection = new Connection(configDB.sqlServer);

     return new Promise( (resolve, reject) => {

         var exceuteSql = function () {

             var request = new Request("fsgTLXPartMaster", function(err, rowCount) {
                 if (err) {
                     connection.close()
                     reject(err);
                 }
             });

             request.addParameter('PartCode', TYPES.VarChar, p.NoIdentificacion);
             //request.addParameter('PartCode', TYPES.NVarChar, 'B0156720-K12');
             request.addParameter('OrganizationKey', TYPES.Int, 1);

             request.on('row', rows => {
                 //console.log(rows);
                 var marca = rows.find( item => item.metadata.colName == "PartManufacturer");
                 var modelo = rows.find( item => item.metadata.colName == "MfgPartNumber");
                 p.Marca = marca.value;
                 p.Modelo = modelo.value;
                //  if (marca)
                //      p.Marca = marca.value;
                //  else
                //     p.Marca = "";
                //
                // if (modelo)
                //     p.Modelo = modelo.value;
                // else
                //     p.Modelo = "";
                 //connection.close();
                 //resolve("success");
                 //return res.status(200).send(rows);
             });
             request.on('doneProc', (rowCount, more, returnStatus, rows) => {
                connection.close();
                resolve("success");
             });
             connection.callProcedure(request);
         }

         connection.on('connect', function(err) {
             if (err){
                reject(err);
             } else {
             exceuteSql();
             }
         });

     });

  /* return new Promise((resolve, reject) => {
        p.cceMarca = p.VlrCodigo1;
        p.cceModelo = p.VlrCodigo1;
        resolve("success");
       //setTimeout(resolve, parseInt(Math.random() * 3000), {marca: sku, modelo: sku});
    });*/
}


function testDb(req, res){
  var connection = new Connection(configDB.sqlServer);
  connection.on('connect', function(err) {
             if (err){
                 return res.status(500).send({message: "conexion fallida"})
             } else {
                 return res.status(200).send({message: "conexion exitosa"})
             }
         });
}

module.exports = {
    getDatos,
    testDb
};

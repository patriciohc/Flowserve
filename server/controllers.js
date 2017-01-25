'use strict'
//const Connection = require('tedious').Connection;
const configDB = require('./configDB');
const fs = require('fs');
const models = require('./models');
var Request = require('tedious').Request;

//var connection = new Connection(configDB.sqlServer);

// connection.on('connect', function(err) {
//     if (err){
//         console.log("error: " + err);
//     } else {
//         console.log("Connected");
//     }
// });

const dirFiles = "E:/datos_txt"


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
                return item.split("\r\n");
            });
            //var lines = data.split("\r\n");
            //console.log(data);
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


function createUser(req, res) {

    var user = {
        name: req.body.name,
        userName: req.body.userName,
        area: req.body.area,
        password: req.body.password,
    }

    models.User.create(user).then(function(user){
        return res.status(200).send(user);
    });
}

function login(req, res) {
    var pass = req.body.password;
    var user = req.body.userName;

    models.User.findOne({
        where: { userName: user, password: pass }
    })
    .then(function(user){
        return res.status(200).send(user);
    });
}


module.exports = {
    getListTxt,
    testDB,
    getDataFile,
    createUser,
    login
};

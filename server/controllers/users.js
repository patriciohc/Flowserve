'use strict'

// configuaraciones de las base de datos
const configDB = require('../configDB');
// modelos de la base de datos sequelize
const models = require('../models');

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
    createUser,
    login
};

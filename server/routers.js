'use strict'

const express = require('express');
const api = express.Router();
const controllers = require('./controllers');
//const middleware = require('../middleware');

// txt
api.get('/listText/', controllers.getListTxt);
api.get('/testDB/',controllers.testDB);
api.get('/filetext/',controllers.getDataFile);

// users
api.post('/registroUsuarios/',controllers.createUser);
api.post('/login/',controllers.login);

//api.get('/user/:id', controllers.getUser);

//api.get('/cat-atributo/:id', catProductoCtrl.getCatProducto);

module.exports = api;

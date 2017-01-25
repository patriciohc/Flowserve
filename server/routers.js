'use strict'

const express = require('express');
const api = express.Router();
const controllers = require('./controllers');
//const middleware = require('../middleware');

// user
api.get('/listText/', controllers.getListTxt);
api.post('/filetext/',controllers.getDataFile);
//api.get('/user/:id', controllers.getUser);

//api.get('/cat-atributo/:id', catProductoCtrl.getCatProducto);

module.exports = api;

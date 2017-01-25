'use strict'

const express = require('express');
const api = express.Router();
const controllers = require('./controllers');
//const middleware = require('../middleware');

// user
api.get('/listTxt/', controllers.getListTxt);
//api.get('/user/:id', controllers.getUser);
//api.post('/user/',controllers.createUSer);
//api.get('/cat-atributo/:id', catProductoCtrl.getCatProducto);

module.exports = api;
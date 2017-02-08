'use strict'

const express = require('express');
const api = express.Router();
const facturas = require('./controllers/facturas');
const users = require('./controllers/users');
const middleware = require('./middleware');

// middleware.ensureAuthenticated,
// txt
api.get('/listText/', middleware.ensureAuthenticated, facturas.getListTxt);
//api.get('/testDB/',facturas.testDB);
api.post('/facturas/', facturas.getFacturas);
api.put('/facturas/', middleware.ensureAuthenticated, facturas.guardarTxt);
api.post('/timbrarFactura/', middleware.ensureAuthenticated, facturas.timbrar);
api.put('/reeditar/', middleware.ensureAuthenticated, facturas.reEditar);
api.get('/procesar/', facturas.procesarCarpeta); // temporal

// users
api.post('/registroUsuarios/', users.createUser);
api.post('/login/', users.login);

//api.get('/user/:id', controllers.getUser);
//api.get('/cat-atributo/:id', catProductoCtrl.getCatProducto);

module.exports = api;

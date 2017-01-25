'use strict';

const express = require('express');
const bodyParser = require('body-parser');
//const methodOverride = require("method-override");

const app = express();
const api = require('./routers');

app.use(express.static("www"));
// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/api', api);

app.listen('8080', () => {
    console.log("servidor corriendo en http://localhost:8080");
});

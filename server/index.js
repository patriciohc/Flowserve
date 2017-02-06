'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
//const methodOverride = require("method-override");

const app = express();
const api = require('./routers');

app.use(express.static("www"));
// Middlewares
app.use(bodyParser.json({limit: '52428800'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '52428800', parameterLimit:50000 }));

app.use('/api', api);

app.listen(config.PORT, () => {
    console.log(`servidor corriendo en http://localhost:${config.PORT}`);
});

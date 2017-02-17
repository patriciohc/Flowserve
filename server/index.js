'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const config = require('./config');
//const methodOverride = require("method-override");
const app = express();

app.use(express.static("www"));
// Middlewares
app.use(bodyParser.json({limit: '524288000'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '524288000', parameterLimit:500000 }));

// websockets
const server = require("http").Server(app);
const io = require("socket.io")(server);
const api = require('./routers')(io);

app.use('/api', api);

server.listen(config.PORT, () => {
    console.log(`servidor corriendo en http://localhost:${config.PORT}`);
});

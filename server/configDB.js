
var sqlite = {
    dialect: 'sqlite',
    storage: './database.sqlite'
}

var sqlServer = {
    userName: 'nodejs',
    password: 'nodejs',
    server: 'localhost',
    options: {
        port: 54187
    },
    // If you're on Windows Azure, you will need this:
    //options: {encrypt: true}
};


module.exports = {
    sqlServer,
    sqlite
}

'use strict'
const Sequelize = require("sequelize");
const dataBase = require('./configDB').sequelize;

var User = dataBase.define('user',
    {
        name: {
            type: Sequelize.STRING,
            field: 'name' // Will result in an attribute that is firstName when user facing but first_name in the database
        },
        userName: {
            type: Sequelize.STRING,
            field: 'user_name' // Will result in an attribute that is firstName when user facing but first_name in the database
        },
        area: {
            type: Sequelize.STRING,
            field: 'area' // Will result in an attribute that is firstName when user facing but first_name in the database
        },
        password: {
            type: Sequelize.STRING,
            field: 'password' // Will result in an attribute that is firstName when user facing but first_name in the database
        }
    }, {
        freezeTableName: true // Model tableName will be the same as the model name
});


User.sync({force: false}).then( res => {
    console.log(res);
});

module.exports = {
    User
};

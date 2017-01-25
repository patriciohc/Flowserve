'use strict'
const fs = require('fs');

const dirFiles = "datos_txt"

function getListTxt(req, res) {
    fs.readdir(dirFiles, (err, files) => {
        if (err) {
            throw err;
        }
        files.map( file => {
            //return 
        }).filter( file => {
            //return fs.statSync(file).isFile();
        }).forEach( file => {
            var ext = _self.path.extname(file);
            var name_complete = _self.path.basename(file);
            var name_simple = name_complete.replace(ext, "");
            console.log("---> %s : %s (%s)", name_complete, name_simple, ext);
        });
    });
}


module.exports = {
    getListTxt
};
'use strict'
const fs = require('fs');

const dirFiles = "./datos_txt"

function getListTxt(req, res) {
    fs.readdir(dirFiles, (err, files) => {
        if (err) {
            console.log(err);
            throw err;
        }
        return res.status(200).send(files);
        // files.map( file => {
        //     console.log(file);
        //     //return
        // }).filter( file => {
        //     console.log(file);
        //     //return fs.statSync(file).isFile();
        // }).forEach( file => {
        //     console.log(file);
        //     //var ext = _self.path.extname(file);
        //     //var name_complete = _self.path.basename(file);
        //     //var name_simple = name_complete.replace(ext, "");
        //     console.log("---> %s : %s (%s)", name_complete, name_simple, ext);
        // });
    });
}

function getDataFile(req, res) {
    fs.readFile(dirFiles + "/" + req.body.nameFiles, (err, data) => {
      if (err) throw err;
      console.log(data);
    });
}


module.exports = {
    getListTxt
};

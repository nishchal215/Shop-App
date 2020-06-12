const fs = require('fs')

const deleteFile = (filePath) =>{
    fs.unlink(filePath , err =>{
        if(err){
            next(err)
        }
    })
}

exports.deleteFile = deleteFile
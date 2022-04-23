const express = require('express');
const ipfsClient = require('ipfs-http-client');
const bodyparser = require('body-parser');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const ejs = require('ejs');

const ipfs = ipfsClient({host : 'localhost',port: '5001',protocol:'http'});
const app = express();

app.set('view engine','ejs');
app.use(bodyparser.urlencoded({extended: true}));
app.use(fileUpload());

app.use(express.json());

app.get('/',(req,res)=>{
    res.render('home');
});

app.post('/upload-file',(req,res)=>{
    try {
        let file = null
        for (let k in req.files) {
            file = req.files[k]
        }
        if (file!==null) {
            const fileName = file.name;
            const filePath = 'files/'+fileName;
            file.mv(filePath,async(err)=>{
                if(err){
                    console.log("error : while uploading file");
                    return res.status(500).send(err);
                }
                const fileHash = await addIpfsFile (fileName,filePath);
                fs.unlink(filePath,(err)=>{
                    if(err) console.log(err);
                })
                res.render('upload',{fileName,fileHash});
            })
        } else {
            res.status(500).send("no uploaded file");    
        }
    } catch (error) {
        res.status(500).send(error);
    }
});

const addIpfsFile = async (fileName,filePath)=>{
    const file = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({path: fileName,content:file});
    const {cid} = fileAdded;
    return cid;
}
app.listen(80,()=>{
    console.log('Server listening on port 80');
});

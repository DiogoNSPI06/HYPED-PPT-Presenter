const express = require('express');
const bodyParser = require('body-parser');
const useragent = require('express-useragent');
const busboy = require('connect-busboy');
const path = require('path'); 
const session = require('express-session');
const fs = require('fs-extra');
const db = require('quick.db');

const config = require('./config.json')

const app = express();

app.use(busboy());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(useragent.express());

app.set('trust proxy', 1)
app.use(session({
  secret: config.cookieToken,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true }
}))

//Route Upload
app.route('/upload').post(function (req, res, next) {
  let random = '';
  let dict = '1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXZ'
  for(var i = 0; i < 6; i++) {
    random = random + dict.charAt(Math.floor(Math.random() * dict.length));
  }
  let sessionToken = `NzST${random}`
  
  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {
    console.log("Fazendo Upload de: " + filename);
    
    fstream = fs.createWriteStream(__dirname + '/public/pdfs/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {    
      db.set(`PdfPath_${sessionToken}`, filename)
      
      console.log("Upload terminado:" + filename);       
      res.redirect(`https://ppt.hypeds.com/r/${sessionToken}`);
    });
  });
});

var router = express.Router();  

//Define routes
var reviewPresentation = require('./src/routes/reviewPresentation.js')
var startPresentation = require('./src/routes/startPresentation.js')

router.get('/', function(req, res) {
  res.sendFile(__dirname + `/public/views/Upload.html`);
});

//Use routes
app.use('/', router)

app.use('/r', reviewPresentation)
app.use('/s', startPresentation)

let port = 1337

app.listen(port);
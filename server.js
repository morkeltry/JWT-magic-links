// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const axios = require('axios');
const _ = require('lodash');

const auth = require ('./authRoutes');

app.use(cors());
app.use(bodyParser());
app.use(express.json());

// make all the files in 'public' available
// https://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

app.get('/login', auth.loginByMagicLink);
app.post('/signup', auth.signupByMagicLink);

//receive request of flight details and make request to flight API
app.post('/api/getflights/', function(req, res){

  const userFlight = req.body;// your JSON
  console.log(userFlight);

  getFlights(userFlight)
    .then(function(fullData){
      console.log ("full data" + fullData);
      res.send(fullData);
    })
    .catch(function (error) {
        res.send('error');
    });

});

function getFlights(data) {
    return new Promise((resolve, reject) => {

    const apikey = process.env.ACCESS_KEY;
    const params = {
      access_key: apikey,
      flight_date: data.flight_date,
      dep_iata: data.dep_iata,
      arr_iata: data.arr_iata
    }

axios.get('https://api.aviationstack.com/v1/flights', {params})
  .then(response => {
   console.log ('sending');
    const apiResponse = response.data;
    resolve(apiResponse);

  }).catch(error => {
    console.log(error);
  });

 });
};

var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

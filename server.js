const express = require('express')
const fetch = require('node-fetch')
const app = express()
const port = 3000
const SQL = require('sqlite3').verbose();
let db = new SQL.Database("DBFavor");


// db.run('CREATE TABLE favor(id INTEGER PRIMARY KEY, city text NOT NULL, ip text NOT NULL)')


let allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
    next();
}
app.use(allowCrossDomain);

const parseIp = (req) =>
    (typeof req.headers['x-forwarded-for'] === 'string'
        && req.headers['x-forwarded-for'].split(',').shift())
    || req.connection?.remoteAddress
    || req.socket?.remoteAddress
    || req.connection?.socket?.remoteAddress

function openWeatherCity(city){
    return "https://community-open-weather-map.p.rapidapi.com/weather?q="+ city;
}

function openWeatherCoords(lat, lon){
    return "https://community-open-weather-map.p.rapidapi.com/weather?lat=" + lat + "&lon=" + lon;
}

app.get('/city', (request, response) => {
    const city = request.query['q'];
    fetch(openWeatherCity(city), {
        "method": "GET",
        "headers": {
            "x-rapidapi-host": "community-open-weather-map.p.rapidapi.com",
            "x-rapidapi-key": "1483006ab6mshe2a3165adf287c6p124192jsn661aae0f7dd9"
        }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            response.send(data);
        })
})

app.get('/coords', (request, response) => {
    const lat = request.query['lat'];
    const lon = request.query['lon'];
    fetch(openWeatherCoords(lat, lon), {
        "method": "GET",
        "headers": {
            "x-rapidapi-host": "community-open-weather-map.p.rapidapi.com",
            "x-rapidapi-key": "1483006ab6mshe2a3165adf287c6p124192jsn661aae0f7dd9"
        }
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            response.send(data);
        })
})

app.get('/favor', async (request, response) => {
    let ip = parseIp(request);
    if (ip) {
        db.all('SELECT city FROM favor WHERE ip=$1', [ip], function (err, raw){
            response.send(raw);
        });

    }
})


app.post('/favor', async (request, response) => {
    let ip = parseIp(request);
    let city = request.query['city'];
    if (ip && city) {
        db.get("SELECT city FROM favor WHERE city = $1 AND ip = $2", {$1: city, $2: ip}, function(err, row){
            if(row!=null){
                return console.log(city + " уже есть у " + ip);
            }
            else{
                db.run('INSERT INTO favor(city, ip) VALUES($1, $2)', {$1: city, $2: ip});
                response.send(city);
            }
        })

    }
})

app.delete('/favor', async (request, response) => {
    let ip = parseIp(request);
    let city = request.query['city'];
    if (ip && city) {
        await db.run('DELETE FROM favor WHERE id IN (' +
            'SELECT id FROM favor WHERE ip=$1 AND city=$2 LIMIT 1)', [ip, city]);
        response.send(city);
    }
})


app.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log("server is listening on" + port)
})
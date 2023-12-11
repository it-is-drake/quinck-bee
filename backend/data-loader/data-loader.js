const mongo = require('mongodb');

const host = 'localhost';
var url = process.env.MONGODB_URL;

const client = new mongo.MongoClient(url);

// Database Name
const dbName = 'quinck-bee';

const express = require('express')
const app = express()
app.use(express.json({ limit: "1mb" }))

const port = 3001

app.get('/current_temperature', (req, res) => {
  getCurrentTemperature().then((result) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.writeHead(200)
    res.end(JSON.stringify(result))
  })
})

app.get('/temperatures_by_date', (req, res) => {
  getTemperaturesByDate(parseInt(req.query.year), parseInt(req.query.month), parseInt(req.query.day), parseInt(req.query.start_hour), parseInt(req.query.end_hour), parseInt(req.query.start_minute), parseInt(req.query.end_minute)).then((result) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.writeHead(200)
    res.end(JSON.stringify(result))
  })
})

app.get('/frequency_values', (req, res) => {
  getFrequencyValues(parseInt(req.query.year), parseInt(req.query.month), parseInt(req.query.day), parseInt(req.query.start_hour), parseInt(req.query.end_hour), parseInt(req.query.start_minute), parseInt(req.query.end_minute)).then((result) => {
    res.setHeader('Content-Type', 'application/json')
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.writeHead(200)
    res.end(JSON.stringify(result))
  })
})

app.listen(port, () => {
  console.log(`Data Loader listening on port ${port}`)
})


async function getCurrentTemperature() {
  await client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  const collection = db.collection('temperature')

  const findResult = await collection.findOne()
  return findResult
}

async function getTemperaturesByDate(year, month, day, start_hour, end_hour, start_minute, end_minute) {
  await client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  const collection = db.collection('temperature')

  const findResult = await collection.find({
    "year": year,
    "month": month,
    "day": day,
    "hours" : { $gte :  start_hour, $lte : end_hour},
    // "minutes" : { $gt :  start_minute, $lt : end_minute}
  }).toArray(function (err, result) {
    if (err) throw err
    console.log(result)
  })
  return findResult
}

async function getFrequencyValues(year, month, day, start_hour, end_hour, start_minute, end_minute) {
  await client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  const collection = db.collection('audio-data')

  const findResult = await collection.find({
    "year": year,
    "month": month,
    "day": day,
    "hours" : { $gte :  start_hour, $lte : end_hour},
    // "minutes" : { $gt :  start_minute, $lt : end_minute}
  }).toArray(function (err, result) {
    if (err) throw err
    console.log(result)
  })
  if (findResult.length > 0) {
    let spectrum = findResult[0].values
    if (findResult.length > 1) {
      for (let i = 1; i < findResult.length; i++) {
        for (let l = 0; l < spectrum.length; l++) {
          spectrum[l].value += findResult[i].values[l].value
        }
      }
      for (let i = 0; i < spectrum.length; i++) {
        spectrum[i].value /= spectrum.length
      }
    }
    return spectrum
  }
  return []
}
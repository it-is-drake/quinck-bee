const mongo = require('mongodb')
const ft = require('fourier-transform')

const host = 'localhost'
var url = process.env.MONGODB_URL

const client = new mongo.MongoClient(url)

// Database Name
const dbName = 'quinck-bee'

const express = require('express')
const app = express()
app.use(express.json({ limit: "1mb" }))

const port = 3000

const sampleRate = 10000
let lastTime = null
let audioData = null

app.post('/', (req, res) => {
  console.log("Request Received")
  console.log("Data type: " + req.body["data_type"])
  switch (req.body["data_type"]) {
    case ("temperature"):
      res.writeHead(200)
      res.end("temperature data received")
      setTemperature(req.body["value"])
      break
    case ("audio"):
        res.writeHead(200)
        res.end("audio data received")
        processAudioData(req.body.values, req.body.sequence_number, req.body.sequences)
        break
    default:
      res.writeHead(400)
      res.end("request is not valid")
      break
  }
})

app.listen(port, () => {
  console.log(`Data Receiver listening on port ${port}`)
})

async function setTemperature(value) {
  await client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  const collection = db.collection('temperature')

  const date = new Date()
  const insertResult = await collection.insertOne({
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    value: value
  })
  console.log('Inserted value =>', insertResult)

  return 'done.'
}

async function processAudioData(values, sequenceNumber, sequences) {
  if (new Date().getTime() - lastTime > 60000 || lastTime == null) {
    lastTime = new Date().getTime()
    audioData = Array(values.length * sequences).fill(-1)
  }
  for (let i = 0; i < values.length; i++) {
    audioData[i + (sequenceNumber * values.length)] = (values[i] / 2048 - 1)
  }
  let check = true
  for (let i = 0; i < audioData.length; i++) {
    if (audioData[i] == -1) {
      check = false
    }
  }
  
  if (check) {
    const spectrum = ft(audioData)
    const labeledSpectrum = spectrum.map((v, i) => {
      return {
        frequency: (sampleRate / audioData.length) * (i + 1),
        value: v
      }
    }).filter(el => {
      return el.frequency >= 20 && el.frequency <= 1000
    })

    saveSpectrum(labeledSpectrum)
  }
}

async function saveSpectrum(spectrum) {
  await client.connect()
  console.log('Connected successfully to server')
  const db = client.db(dbName)
  const collection = db.collection('audio-data')

  const date = new Date()
  const insertResult = await collection.insertOne({
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    values: spectrum 
  })
  console.log('Inserted value =>', insertResult)
}
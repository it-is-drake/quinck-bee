const mongo = require('mongodb')
const ft = require('fourier-transform')

const host = 'localhost'
var url = process.env.MONGODB_URL

const client = new mongo.MongoClient(url)
const dbName = 'quinck-bee'

const sampleRate = 10000
let lastTime = null
let audioData = null

// MQTT
const mqtt = require("mqtt")
const mqttServer = "54.170.125.10"
const mqttPort = "1883"
const clientId = "quinck-bee-backend" + Math.random().toString(16).slice(3)
const temperatureTopic = "quinck-bee-temperature"
const audioTopic = "quinck-bee-audio"

// Connection to MQTT server
console.log("Connecting to MQTT server...")
const mqttClient = mqtt.connect("mqtt://" + mqttServer + ":" + mqttPort, {
    clean: true,
    connectTimeout: 4000,
    username: '',
    password: '',
    reconnectPeriod: 1000,
})

// Subscription to MQTT topics
mqttClient.on("connect", () => {
    console.log("MQTT server connected")
    mqttClient.subscribe(temperatureTopic, () => {
        console.log("Subscribed to topic " + temperatureTopic)
    })
    mqttClient.subscribe(audioTopic, () => {
        console.log("Subscribed to topic " + audioTopic)
    })
})

// Receiving MQTT messages
mqttClient.on("message", (topic, payload) => {
  // console.log("MQTT Message received: " + payload.toString() + " (topic: " + topic + ")")
  switch(topic) {
      case (temperatureTopic):
          saveTemperature(payload.toString())
          break
      case (audioTopic):
          processAudioData(payload.toString())
          break
  }
})

async function saveTemperature(value) {
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
}

async function processAudioData(payload) {
  let messageData = JSON.parse(payload)

  if (new Date().getTime() - lastTime > 60000 || lastTime == null) {
    lastTime = new Date().getTime()
    audioData = Array(messageData.values.length * messageData.messages).fill(-1)
  }
  for (let i = 0; i < messageData.values.length; i++) {
    audioData[i + (messageData.sequence_number * messageData.values.length)] = (messageData.values[i] / 2048 - 1)
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
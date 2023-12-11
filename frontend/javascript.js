const httpServer = 'http://54.170.125.10:3001';

window.onload = function() {
  const currentTemperature = document.getElementById("current_temperature")
  const dateInput = document.getElementById("date_input")
  const startTimeInput = document.getElementById("start_time")
  const endTimeInput = document.getElementById("end_time")
  const temperatureChart = document.getElementById("temperature_chart")
  const frequencyChart = document.getElementById("frequency_chart")

  getCurrentTemperature(currentTemperature)
  setInterval(getCurrentTemperature(currentTemperature), 30000);

  dateInput.addEventListener('input', function() {
    getTemperaturesByDate(dateInput, startTimeInput, endTimeInput, temperatureChart)
    getFrequencies(dateInput, startTimeInput, endTimeInput, frequencyChart)
  })
  startTimeInput.addEventListener('input', function() {
    getTemperaturesByDate(dateInput, startTimeInput, endTimeInput, temperatureChart)
    getFrequencies(dateInput, startTimeInput, endTimeInput, frequencyChart)
  })
  endTimeInput.addEventListener('input', function() {
    getTemperaturesByDate(dateInput, startTimeInput, endTimeInput, temperatureChart)
    getFrequencies(dateInput, startTimeInput, endTimeInput, frequencyChart)
  })
}

function getCurrentTemperature(currentTemperature) {
  axios({
    method: 'get',
    url: httpServer + '/current_temperature',
    withCredentials: false,
  }).then(function(response) {
    let data = response.data
    currentTemperature.innerHTML = "Temperatura attuale: " + data["value"] + String.fromCharCode(167) + "C"
  })
}

function getTemperaturesByDate(dateInput, startTimeInput, endTimeInput, temperatureChart) {
  let date = new Date(dateInput.value)
  let start_time = startTimeInput.value
  let end_time = endTimeInput.value
  axios({
    method: 'get',
    url: httpServer + '/temperatures_by_date',
    withCredentials: false,
    params: {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      start_hour: start_time.substring(0, 2),
      end_hour: end_time.substring(0, 2),
      start_minute: start_time.substring(3, 5),
      end_minute: end_time.substring(3, 5)
    }
  }).then(function(response) {
    let data = response.data
    let values = data.map(element => {
      return {
        "x": parseInt(element["hours"]) * 60 + parseInt(element["minutes"]),
        "y": element["value"]
      }
    })
    temperatureChart = new Chart("temperature_chart", {
      type: "scatter",
      data: {
        datasets: [{
          backgroundColor:"rgba(0,0,255,1.0)",
          borderColor: "rgba(0,0,255,0.1)",
          data: values
        }]
      },
      options: {
        scales: {
          xAxes: [{
            ticks: {
              stepSize: 60,
              autoSkip: false,
              callback: function(value, index, ticks) {
                let hours = Math.floor(value / 60).toString()
                if (hours.length == 1) hours = "0" + hours
                let minutes = (value % 60).toString()
                if (minutes.length == 1) minutes = "0" + minutes
                return hours + ":" + minutes
              }
            }
          }],
          yAxes: [{
            ticks: {
              suggestedMin: 15,
              suggestedMax: 25
            }
          }]
        },
        legend: {display: false},
      }
    })
  })
}

function getFrequencies(dateInput, startTimeInput, endTimeInput, frequencyChart) {
  let date = new Date(dateInput.value)
  let start_time = startTimeInput.value
  let end_time = endTimeInput.value
  axios({
    method: 'get',
    url: httpServer + '/frequency_values',
    withCredentials: false,
    params: {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      start_hour: start_time.substring(0, 2),
      end_hour: end_time.substring(0, 2),
      start_minute: start_time.substring(3, 5),
      end_minute: end_time.substring(3, 5)
    }
  }).then(function(response) {
    let data = response.data
    let values = data.map(element => {
      return {
        "x": element.frequency,
        "y": element.value
      }
    })
    frequencyChart = new Chart("frequency_chart", {
      type: "scatter",
      data: {
        datasets: [{
          backgroundColor:"rgba(255,0,0,1.0)",
          borderColor: "rgba(255,0,0,0.1)",
          data: values
        }]
      },
      options: {
        scales: {
          xAxes: [{
            ticks: {
              callback: function(value, index, ticks) {
                return value + "Hz"
              }
            }
          }]
        },
        legend: {display: false},
      }
    })
  })
}
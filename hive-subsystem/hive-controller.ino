// TinyGSM configuration
#define TINY_GSM_MODEM_SIM800
#define TINY_GSM_RX_BUFFER 1024

// Libraries
#include <TinyGsmClient.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// GPRS credentials
const char apn[]      = "internet.it";
const char gprsUser[] = "";
const char gprsPass[] = "";

// SIM card PIN
const char simPIN[]   = ""; 

// Server details
const char server[] = "54.170.125.10";
const char resource[] = "/";
const int  port = 3000;

// TTGO T-Call pins
#define MODEM_RST            5
#define MODEM_PWKEY          4
#define MODEM_POWER_ON       23
#define MODEM_TX             27
#define MODEM_RX             26

// Audio data config
#define MAX_FREQ 10
#define SAMPLES 1024
#define SAMPLES_PER_REQUEST 128

// Pins
#define TEMP_SENSOR 21
#define MIC 2

TinyGsm modem(Serial1);

#define uS_TO_S_FACTOR 1000000UL   /* Conversion factor for micro seconds to seconds */
#define TIME_TO_SLEEP  150         /* Time ESP32 will go to sleep (in seconds) 3600 seconds = 1 hour */

#define IP5306_ADDR          0x75
#define IP5306_REG_SYS_CTL0  0x00

TinyGsmClient client(modem);
OneWire oneWire(TEMP_SENSOR);
DallasTemperature sensors(&oneWire);

unsigned short data[SAMPLES];
unsigned long sampling_period_us;

void setup() {
  Serial.begin(115200);

  // Set modem reset, enable, power pins
  pinMode(MODEM_PWKEY, OUTPUT);
  pinMode(MODEM_RST, OUTPUT);
  pinMode(MODEM_POWER_ON, OUTPUT);
  digitalWrite(MODEM_PWKEY, LOW);
  digitalWrite(MODEM_RST, HIGH);
  digitalWrite(MODEM_POWER_ON, HIGH);

  // Set GSM module baud rate and UART pins
  Serial1.begin(115200, SERIAL_8N1, MODEM_RX, MODEM_TX);

  Serial.println("Initializing modem...");
  modem.init();

  // Unlock your SIM card with a PIN if needed
  if (strlen(simPIN) && modem.getSimStatus() != 3 ) {
    modem.simUnlock(simPIN);
  }

  sensors.begin();
  sampling_period_us = round(1000ul * (1.0 / MAX_FREQ));
  esp_sleep_enable_timer_wakeup(TIME_TO_SLEEP * uS_TO_S_FACTOR);
}

void loop() {
  Serial.print("Connecting to APN: ");
  Serial.println(apn);
  if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
    Serial.println("Connection error");
  }
  else {
    Serial.println("Connected");

    // Get temperature value
    Serial.println("Requesting temperatures... ");
    sensors.requestTemperatures();
    float temp = sensors.getTempCByIndex(0);
    if(temp != DEVICE_DISCONNECTED_C) {
      Serial.print("Temperature is: ");
      Serial.println(temp);
    } else {
      Serial.println("Error: Could not read temperature data");
    }

    // Send temperature value
    String httpRequestData = "{\"data_type\": \"temperature\", \"value\": " + String(temp) + "}";
    sendHttpRequest(httpRequestData);

    // Get audio data
    Serial.print("Getting audio data...");
    for (int i = 0; i < SAMPLES; i++) {
      unsigned long chrono = micros();
      data[i] = analogRead(MIC);
      while (micros() - chrono < sampling_period_us); // do nothing
    }
    Serial.println("DONE");

    // Send audio data
    int request_n = SAMPLES/SAMPLES_PER_REQUEST;
    for (int i = 0; i < request_n; i++) {
      String httpRequestData = "{\"data_type\": \"audio\", \"sequences\": " + String(request_n) + ",\"sequence_number\": " + String(i) + ", \"values\": [";
      for (int l = 0; l < SAMPLES_PER_REQUEST; l++) {
        httpRequestData = httpRequestData + String(data[i * SAMPLES_PER_REQUEST + l]);
        if (l < SAMPLES_PER_REQUEST - 1) {
          httpRequestData = httpRequestData + ", ";
        }
      }
      httpRequestData = httpRequestData + "]}";
      Serial.println(httpRequestData);
      sendHttpRequest(httpRequestData);
    }
    modem.gprsDisconnect();
    Serial.println(F("GPRS disconnected"));
  }
  esp_deep_sleep_start();
}

void sendHttpRequest(String httpRequestData) {
  Serial.print("Connecting to ");
  Serial.print(server);
  if (!client.connect(server, port)) {
    Serial.println(" fail");
  }
  else {
    Serial.println(" OK");
  
    // Making HTTP POST request
    Serial.println("Performing HTTP POST request...");
    client.print(String("POST ") + resource + " HTTP/1.1\r\n");
    client.print(String("Host: ") + server + "\r\n");
    client.println("Connection: close");
    client.println("Content-Type: application/json");
    client.print("Content-Length: ");
    client.println(httpRequestData.length());
    client.println();
    client.println(httpRequestData);

    unsigned long timeout = millis();
    while (client.connected() && millis() - timeout < 10000L) {
      while (client.available()) {
        char c = client.read();
        // Serial.print(c);
        timeout = millis();
      }
    }
    Serial.println();

    client.stop();
    Serial.println(F("Server disconnected"));
  }
}

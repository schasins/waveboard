#include <Bridge.h>
#include <Process.h>
#include <Adafruit_GPS.h>
#include <SoftwareSerial.h>
#define GPSECHO false

Adafruit_GPS GPS(&Serial1);
HardwareSerial mySerial = Serial1;
uint32_t timer = millis();
const int sampleSize = 10;
const int xInput = A0;
const int yInput = A1;
const int zInput = A2;

// Raw Ranges:
int xRawMin = 378;
int xRawMax = 633;

int yRawMin = 377;
int yRawMax = 640;

int zRawMin = 380;
int zRawMax = 630;

void setup() {
  analogReference(EXTERNAL);
  Serial.begin(115200);
  delay(5000);
  Serial.println("Adafruit GPS library basic test!");
  GPS.begin(9600);
  
  //turn on RMC and GGA (fix data) including altitude
  GPS.sendCommand(PMTK_SET_NMEA_OUTPUT_RMCGGA);
  
  // Set the update rate
  GPS.sendCommand(PMTK_SET_NMEA_UPDATE_1HZ);
  GPS.sendCommand(PGCMD_ANTENNA);

  delay(1000);
  mySerial.println(PMTK_Q_RELEASE);
}

void loop() {
  char c = GPS.read();
  if (GPS.newNMEAreceived()) {
    if (!GPS.parse(GPS.lastNMEA())) { return; }
  }

  if (timer > millis()) { timer = millis(); }
  if (millis() - timer > 2000) {
    //reset the timer
    timer = millis();
    
    int xRaw = ReadAxis(xInput);
    int yRaw = ReadAxis(yInput);
    int zRaw = ReadAxis(zInput);
    long xScaled = map(xRaw, xRawMin, xRawMax, -1000, 1000);
    long yScaled = map(yRaw, yRawMin, yRawMax, -1000, 1000);
    long zScaled = map(zRaw, zRawMin, zRawMax, -1000, 1000);
    float xAccel = xScaled / 1000.0;
    float yAccel = yScaled / 1000.0;
    float zAccel = zScaled / 1000.0;

    Serial.print("\nTime: ");
    Serial.print(GPS.hour, DEC); Serial.print(':');
    Serial.println(GPS.minute, DEC);
    Serial.print("Fix: "); Serial.print((int)GPS.fix);
    Serial.print(" quality: "); Serial.println((int)GPS.fixquality); 
    if (GPS.fix) {
      Serial.print("Location: ");
      Serial.print(GPS.latitude, 4); Serial.print(GPS.lat);
      Serial.print(", "); 
      Serial.print(GPS.longitude, 4); Serial.println(GPS.lon);
      Serial.print("Satellites: "); Serial.println((int)GPS.satellites);
      
      String gps = String(GPS.latitude) + String(GPS.lat) + ", " + String(GPS.longitude) + String(GPS.lon);
      post(gps, String(xAccel), String(yAccel), String(zAccel));
    }
    
  }
}

int ReadAxis(int axisPin) {
  long reading = 0;
  analogRead(axisPin);
  delay(1);
  for (int i = 0; i < sampleSize; i++)
  {
    reading += analogRead(axisPin);
  }
  return reading/sampleSize;
}

void post(String gps, String x, String y, String z) {
  Process p;
  p.begin("/mnt/sda1/tts.py");
  p.addParameter(gps);
  p.addParameter(x);
  p.addParameter(y);
  p.addParameter(z);
  p.run();
}

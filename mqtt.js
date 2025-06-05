const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
require('dotenv').config();

const app = express();
app.use(cors()); // Enable CORS
app.use(express.json()); // Support for JSON payloads

// MQTT Credentials
const clientId = 'emqx_nodejs_' + Math.random().toString(16).substring(2, 8);
const username = 'makerz';
const password = 'makerz';

// Connect to MQTT Broker
const mqttClient = mqtt.connect('ws://151.106.113.75:8083/mqtt', {
  clientId,
  username,
  password,
});

mqttClient.on("connect", () => {
  console.log("✅ Connected to MQTT Broker");

  // Subscribe to topic 'TEST'
  mqttClient.subscribe("VM0001", { qos: 1 }, (err) => {
    if (err) {
      console.error("❌ Subscription failed:", err);
    } else {
      console.log(`📡 Subscribed to topic: TEST`);
    }
    mqttClient.end(); // Disconnect after publishing
  });

  // Message Payload
  const message = JSON.stringify({
    status: "success",
    transaction_id: "TXN123456",
    amount: 100.00,
    currency: "THB",
    timestamp: new Date().toISOString()
  });

  // Publish to topic 'TEST'
  mqttClient.publish("VM0001", message, { qos: 1 }, (err) => {
    if (err) {
      console.error("❌ Publish failed:", err);
    } else {
      console.log(`📤 Message sent to 'TEST':`, message);
    }
    mqttClient.end(); // Disconnect after publishing
  });
});

// Handle Incoming Messages from Subscribed Topics
mqttClient.on("message", (topic, message) => {
  console.log(`📥 Received message on topic '${topic}':`, message.toString());
});

// Handle Connection Errors
mqttClient.on("error", (err) => {
  console.error("❌ MQTT Error:", err);
});

// Express Server Setup
const port = process.env.PORT || 3000; // Default to 3000 if not set
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

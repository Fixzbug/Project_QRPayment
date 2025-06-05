const mqtt = require("mqtt");

// MQTT Broker Connection Config
const brokerUrl = "ws://151.106.113.75:8083/mqtt"; // WebSocket MQTT Broker
const username = "makerz";
const password = "makerz";

const TOTAL_DEVICES = 1000; // Number of devices to simulate
const MAX_CONCURRENT_CONNECTIONS = 50; // Limit connections per batch
const CONNECTION_DELAY = 100; // Delay per batch (ms)

let connectedDevices = 0; // Track successful connections

// Function to create and manage MQTT clients
function createMqttClient(deviceId) {
  return new Promise((resolve, reject) => {
    const clientId = `device_${deviceId}_${Math.random().toString(16).substring(2, 8)}`;
    const mqttClient = mqtt.connect(brokerUrl, {
      clientId,
      username,
      password,
    });

    mqttClient.on("connect", () => {
      connectedDevices++;
      console.log(`✅ Device ${deviceId} connected (${connectedDevices}/${TOTAL_DEVICES})`);

      const topic = `VM${deviceId}`; // Unique topic per device

      // Subscribe to a topic
      mqttClient.subscribe(topic, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Device ${deviceId} failed to subscribe:`, err);
          reject(err);
        } else {
          console.log(`📡 Device ${deviceId} subscribed to topic: ${topic}`);
        }
      });

      // Publish test message
      const message = JSON.stringify({
        device: `Device_${deviceId}`,
        status: "success",
        transaction_id: `TXN${deviceId}_${Date.now()}`,
        amount: Math.floor(Math.random() * 1000),
        currency: "THB",
        timestamp: new Date().toISOString(),
      });

      mqttClient.publish(topic, message, { qos: 1 }, (err) => {
        if (err) {
          console.error(`❌ Device ${deviceId} failed to publish:`, err);
          reject(err);
        } else {
          console.log(`📤 Device ${deviceId} sent message to '${topic}':`, message);
          resolve();
        }
      });
    });

    // Handle messages
    mqttClient.on("message", (topic, message) => {
      console.log(`📥 Device ${deviceId} received message on '${topic}':`, message.toString());
    });

    // Handle errors
    mqttClient.on("error", (err) => {
      console.error(`❌ Device ${deviceId} MQTT Error:`, err);
      reject(err);
    });
  });
}

// Function to manage concurrent connections in batches
async function connectDevicesInBatches() {
  let batchStart = 0;

  while (batchStart < TOTAL_DEVICES) {
    const batchEnd = Math.min(batchStart + MAX_CONCURRENT_CONNECTIONS, TOTAL_DEVICES);
    const batchDevices = [];

    for (let i = batchStart + 1; i <= batchEnd; i++) {
      batchDevices.push(createMqttClient(i));
    }

    await Promise.all(batchDevices) // Connect batch concurrently
      .then(() => console.log(`✅ Batch ${batchStart + 1}-${batchEnd} connected successfully`))
      .catch((err) => console.error(`❌ Batch ${batchStart + 1}-${batchEnd} failed`, err));

    batchStart = batchEnd;

    if (batchStart < TOTAL_DEVICES) {
      await new Promise((resolve) => setTimeout(resolve, CONNECTION_DELAY)); // Wait before next batch
    }
  }

  console.log(`🚀 All ${TOTAL_DEVICES} devices connected successfully!`);
}

// Start MQTT connection simulation
connectDevicesInBatches();

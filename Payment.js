const express = require("express");
const bodyParser = require("body-parser");
const mqtt = require("mqtt");

const app = express();
const PORT = 3000;

// MQTT Broker config
const brokerUrl = "ws://151.106.113.75:8083/mqtt";
const username = "makerz";
const password = "makerz";

// Middleware
app.use(bodyParser.json());

// POST /payment/VM0001
app.post("/payment/:device_id", async (req, res) => {
  const deviceId = req.params.device_id;
  const { result, ksher_order_no, mch_order_no, total_fee } = req.body;

  if (!result || !ksher_order_no || !mch_order_no || total_fee === undefined) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const payload = {
    type: "verify",
    device_id: deviceId,
    result: result,
    ksher_order_no: ksher_order_no,
    mch_order_no: mch_order_no,
    total_fee: parseInt(total_fee) * 100,
  };

  const clientId = `webhook_${Math.random().toString(16).slice(2, 6)}`;
  const mqttClient = mqtt.connect(brokerUrl, {
    clientId,
    username,
    password,
  });

  mqttClient.on("connect", () => {
    mqttClient.publish(deviceId, JSON.stringify(payload), { qos: 1 }, (err) => {
      mqttClient.end();
      if (err) {
        console.error("❌ MQTT publish failed:", err);
        return res.status(500).json({ error: "MQTT publish failed" });
      }

      console.log(`📤 Sent to ${deviceId}:`, payload);
      res.json({ status: 200, result: payload });
    });
  });

  mqttClient.on("error", (err) => {
    console.error("❌ MQTT error:", err);
    mqttClient.end();
    res.status(500).json({ error: "MQTT connection error" });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on http://localhost:${PORT}`);
});

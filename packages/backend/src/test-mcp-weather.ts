/**
 * Test MCP client's x402_request for weather API
 */
import { configDotenv } from "dotenv";
configDotenv();

const API_URL = "http://localhost:3001";

console.log("\n🧪 Testing MCP-style weather API request...\n");

// Step 1: Get 402
const res1 = await fetch(`${API_URL}/x402/resource/weather-data`);
console.log(`Step 1: ${res1.status} ${res1.statusText}`);

if (res1.status === 402) {
  const payment = await res1.json();
  console.log("Payment required:", JSON.stringify(payment, null, 2));
  
  // Simulate what MCP client would send
  const mockPaymentProof = {
    txHash: "0x3f8d323c57f187250a9a5574a8e6fbd84ada4e23edca809efd288a7b0732d510",
    transactionHash: "0x3f8d323c57f187250a9a5574a8e6fbd84ada4e23edca809efd288a7b0732d510",
    network: "mantle-sepolia",
    chainId: 5003,
    timestamp: Date.now(),
  };
  
  console.log("\nStep 2: Retrying with payment proof:");
  console.log(JSON.stringify(mockPaymentProof, null, 2));
  
  const res2 = await fetch(`${API_URL}/x402/resource/weather-data`, {
    headers: {
      "X-PAYMENT": JSON.stringify(mockPaymentProof),
    },
  });
  
  console.log(`\nResult: ${res2.status} ${res2.statusText}`);
  
  if (res2.ok) {
    const data = await res2.json();
    console.log("\n✅ Weather data received!");
    console.log(`Temperature: ${data.current?.temperature_2m}°C`);
    console.log(`Wind: ${data.current?.wind_speed_10m} km/h`);
  } else {
    const error = await res2.text();
    console.log("\n❌ Failed:", error);
  }
}

/**
 * Run All x402 Tests (Mantle Sepolia / MNT)
 * 
 * Runs both resource and API tests sequentially
 * 
 * Run: npx tsx src/test/run-all-tests.ts
 */

import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function runTest(testName: string, testFile: string) {
  console.log("\n" + "=".repeat(70));
  console.log(`🧪 Running: ${testName}`);
  console.log("=".repeat(70));
  
  try {
    const { stdout, stderr } = await execAsync(`npx tsx ${testFile}`);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    return true;
  } catch (error: any) {
    console.error(`❌ ${testName} failed:`);
    console.error(error.message);
    return false;
  }
}

async function main() {
  console.log("\n" + "=".repeat(70));
  console.log("🚀 x402 TEST SUITE (Mantle Sepolia / MNT)");
  console.log("=".repeat(70));

  const tests = [
    { name: "Resource Test", file: "src/test/test-resource.ts" },
    { name: "API Test", file: "src/test/test-api.ts" },
  ];

  const results: { name: string; passed: boolean }[] = [];

  for (const test of tests) {
    const passed = await runTest(test.name, test.file);
    results.push({ name: test.name, passed });
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log("\n" + "=".repeat(70));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(70));
  
  results.forEach(result => {
    console.log(`${result.passed ? "✅" : "❌"} ${result.name}: ${result.passed ? "PASSED" : "FAILED"}`);
  });

  const allPassed = results.every(r => r.passed);
  console.log("\n" + (allPassed ? "🎉 All tests passed!" : "⚠️  Some tests failed"));
  console.log("=".repeat(70) + "\n");

  process.exit(allPassed ? 0 : 1);
}

main();

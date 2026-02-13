import { describe, it, expect, vi } from "vitest";
import { handleA2ARequest } from "../../a2a/handler.js";

// Mock Express req/res
function mockReq(body: any) {
  return { body } as any;
}

function mockRes() {
  const res: any = {
    statusCode: 200,
    body: null,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(data: any) {
      res.body = data;
      return res;
    },
  };
  return res;
}

describe("handleA2ARequest", () => {
  it("should return METHOD_NOT_FOUND for unknown method", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 1,
      method: "unknown/method",
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.jsonrpc).toBe("2.0");
    expect(res.body.id).toBe(1);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32601);
    expect(res.body.error.message).toContain("Method not found");
  });

  it("should handle message/send with missing parts", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 2,
      method: "message/send",
      params: { message: {} },
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32602);
    expect(res.body.error.message).toContain("Missing message.parts");
  });

  it("should handle message/send with no valid action", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 3,
      method: "message/send",
      params: {
        message: {
          role: "user",
          parts: [{ type: "text", text: "Hello" }],
        },
      },
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32002);
    expect(res.body.error.message).toContain("No valid action");
  });

  it("should handle tasks/get with missing id", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 4,
      method: "tasks/get",
      params: {},
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32602);
    expect(res.body.error.message).toContain("Missing params.id");
  });

  it("should handle tasks/get with non-existent task", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 5,
      method: "tasks/get",
      params: { id: "nonexistent-task" },
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32001);
    expect(res.body.error.message).toContain("Task not found");
  });

  it("should handle tasks/cancel with missing id", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 6,
      method: "tasks/cancel",
      params: {},
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32602);
  });

  it("should handle tasks/cancel with non-existent task", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 7,
      method: "tasks/cancel",
      params: { id: "nonexistent" },
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32001);
  });

  it("should handle submit-payment with missing fields", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 8,
      method: "message/send",
      params: {
        message: {
          role: "user",
          parts: [
            {
              type: "data",
              data: { action: "submit-payment" },
            },
          ],
        },
      },
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32602);
    expect(res.body.error.message).toContain("submit-payment requires");
  });

  it("should handle submit-payment for non-existent task", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 9,
      method: "message/send",
      params: {
        message: {
          role: "user",
          parts: [
            {
              type: "data",
              data: {
                action: "submit-payment",
                taskId: "nonexistent",
                payment: {
                  transactionHash: "0xabc",
                  network: "bite-v2-sandbox",
                  chainId: 103698795,
                  timestamp: Date.now(),
                },
              },
            },
          ],
        },
      },
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32001);
  });

  it("should return correct JSON-RPC 2.0 format", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 10,
      method: "unknown",
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.jsonrpc).toBe("2.0");
    expect(res.body.id).toBe(10);
  });

  it("should handle ap2:payment-mandate with missing fields", async () => {
    const req = mockReq({
      jsonrpc: "2.0",
      id: 11,
      method: "message/send",
      params: {
        message: {
          role: "user",
          parts: [
            {
              type: "data",
              data: { action: "ap2:payment-mandate" },
            },
          ],
        },
      },
    });
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32602);
  });

  it("should handle unhandled errors gracefully", async () => {
    // Pass null body to trigger an unhandled error
    const req = { body: null } as any;
    const res = mockRes();

    await handleA2ARequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe(-32603);
  });
});

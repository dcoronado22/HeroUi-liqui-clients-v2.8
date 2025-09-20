// ws-server.js
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 4000 });

wss.on("connection", (ws, req) => {
  console.log("Cliente conectado ✅");

  // Opción A: hardcodea el mismo ID que ves en tu UI:
  // const entityId = "4b10a080-1ef9-4ec9-945e-f4c6445d3847";

  // Opción B (mejor): pásalo por querystring: ws://localhost:4000?entityId=...
  const url = new URL(req.url, "http://localhost");
  const entityId = url.searchParams.get("entityId") || "demo";

  ws.send(JSON.stringify({
    name: "process.started",
    entity: { type: "vinculacion", id: entityId }, // <- id, no entityId
    processId: "p1",
    processType: "BURO",
    message: "Corriendo buró...",
    updatedAt: new Date().toISOString(),
  }));

  setTimeout(() => {
    ws.send(JSON.stringify({
      name: "process.require_input",
      entity: { type: "vinculacion", id: entityId },
      processId: "p1",
      processType: "BURO",
      stepId: "s1",
      message: "Necesitamos datos adicionales para Buró",
      actionId: "a1",
      updatedAt: new Date().toISOString(),
    }));
  }, 10000);

  setTimeout(() => {
    ws.send(JSON.stringify({
      name: "process.failed",
      entity: { type: "vinculacion", id: entityId },
      processId: "p1",
      processType: "BURO",
      severity: "hard",
      message: "Buró falló",
      updatedAt: new Date().toISOString(),
    }));
  }, 15000);

  ws.on("close", () => console.log("Cliente desconectado ❌"));
});

console.log("Servidor WS corriendo en ws://localhost:4000");
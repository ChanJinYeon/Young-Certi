import http from "node:http";

const port = 5173;

const server = http.createServer((_req, res) => {
  res.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
  res.end("YoungCerti frontend placeholder\n");
});

server.listen(port, "0.0.0.0", () => {
  console.log(`frontend placeholder listening on ${port}`);
});

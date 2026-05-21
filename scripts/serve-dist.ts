import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, resolve, sep } from "node:path";

interface ServerConfig {
  readonly host: string;
  readonly port: number;
  readonly rootDirectory: string;
}

interface ResolveRequestInput {
  readonly rootDirectory: string;
  readonly request: IncomingMessage;
}

const config: ServerConfig = {
  host: "127.0.0.1",
  port: 3010,
  rootDirectory: resolve(process.cwd(), "dist"),
};

const contentTypes: Readonly<Record<string, string>> = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mp4": "video/mp4",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function isMethodAllowed(method: string | undefined): boolean {
  return method === "GET" || method === "HEAD";
}

function getContentType(filePath: string): string {
  return contentTypes[extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

async function canReadFile(filePath: string): Promise<boolean> {
  try {
    const fileStat = await stat(filePath);
    await access(filePath);

    return fileStat.isFile();
  } catch {
    return false;
  }
}

async function resolveRequestedFile(input: ResolveRequestInput): Promise<string | null> {
  const host = input.request.headers.host ?? `${config.host}:${config.port}`;
  const requestUrl = new URL(input.request.url ?? "/", `http://${host}`);
  const requestedPath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const relativePath = decodeURIComponent(requestedPath).replace(/^\/+/, "");
  const normalizedPath = resolve(input.rootDirectory, relativePath);
  const rootPrefix = `${input.rootDirectory}${sep}`;

  if (normalizedPath !== input.rootDirectory && !normalizedPath.startsWith(rootPrefix)) {
    return null;
  }

  const fileStat = await stat(normalizedPath).catch(() => null);
  const candidatePath = fileStat?.isDirectory() ? join(normalizedPath, "index.html") : normalizedPath;

  if (await canReadFile(candidatePath)) {
    return candidatePath;
  }

  if (extname(normalizedPath) === "") {
    const fallbackPath = join(input.rootDirectory, "index.html");

    return (await canReadFile(fallbackPath)) ? fallbackPath : null;
  }

  return null;
}

function sendText(response: ServerResponse, statusCode: number, message: string): void {
  response.writeHead(statusCode, {
    "content-length": Buffer.byteLength(message),
    "content-type": "text/plain; charset=utf-8",
  });
  response.end(message);
}

async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  if (!isMethodAllowed(request.method)) {
    sendText(response, 405, "Method Not Allowed");

    return;
  }

  const filePath = await resolveRequestedFile({ rootDirectory: config.rootDirectory, request });

  if (filePath === null) {
    sendText(response, 404, "Not Found");

    return;
  }

  const fileStat = await stat(filePath);

  response.writeHead(200, {
    "cache-control": filePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
    "content-length": fileStat.size,
    "content-type": getContentType(filePath),
  });

  if (request.method === "HEAD") {
    response.end();

    return;
  }

  createReadStream(filePath).pipe(response);
}

createServer((request, response) => {
  handleRequest(request, response).catch((error: unknown) => {
    console.error(error);
    sendText(response, 500, "Internal Server Error");
  });
}).listen(config.port, config.host, () => {
  console.log(`Serving ${config.rootDirectory} at http://${config.host}:${config.port}`);
});

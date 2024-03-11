import { BatchInterceptor } from "@mswjs/interceptors";
import { ClientRequestInterceptor } from "@mswjs/interceptors/ClientRequest";
import { XMLHttpRequestInterceptor } from "@mswjs/interceptors/XMLHttpRequest";

import safePromise from "./safePromise";
import { streamToJson } from "./streamToJson";
import { saveNetworkLog } from "./storeToDatabase";

export enum Database_Types {
  PG = "pg",
}

const LATENCY_TIMES = new Map();
let IGNORED_HOST: string[] = [];

function isRouteIgnored(route: string) {
  return IGNORED_HOST.some((ignore) => {
    return (
      ignore.toLowerCase().includes(route.toLowerCase()) ||
      route.toLowerCase().includes(ignore.toLowerCase())
    );
  });
}

export default function initHttpWrapper(
  dbClient: Database_Types,
  dbUrl: string,
  serviceName: string,
  ignoredHosts: string[]
) {
  IGNORED_HOST = ignoredHosts;
  const interceptor = new BatchInterceptor({
    name: "batch-interceptor",
    interceptors: [
      new ClientRequestInterceptor(),
      new XMLHttpRequestInterceptor(),
    ],
  });

  interceptor.apply();

  interceptor.on("request", ({ requestId, request }) => {
    if (isRouteIgnored(request.url.toString() || "")) {
      return;
    }
    LATENCY_TIMES.set(requestId, process.hrtime());
  });

  interceptor.on("response", async ({ requestId, request, response }) => {
    if (isRouteIgnored(request.url.toString() || "")) {
      return;
    }
    // Clone req,res
    const requestClone = request.clone();
    const responseClone = response.clone();

    // Fetch Header Maps
    const requestHeaders = Object.fromEntries(requestClone.headers.entries());
    const responseHeaders = Object.fromEntries(responseClone.headers.entries());

    // Decode Body ReadableStream
    const [reqError, requestBody] = await safePromise(
      streamToJson(requestClone.body, responseHeaders)
    );
    const [reError, responseBody] = await safePromise(
      streamToJson(responseClone.body, responseHeaders)
    );

    // Determine Latency
    const difference = process.hrtime(LATENCY_TIMES.get(requestId));
    const responseLatency = difference[0] * 1e3 + difference[1] * 1e-6;
    LATENCY_TIMES.delete(requestId);

    // Save into DB
    const payload = {
      serviceName,
      responseLatency: responseLatency,
      route: requestClone.url.toString(),
      method: requestClone.method,
      requestHeaders: requestHeaders,
      requestBody: reqError ? null : requestBody,
      responseStatus: responseClone.status,
      responseHeaders: responseHeaders,
      responseBody: reError ? null : responseBody,
    };

    void saveNetworkLog(dbClient, dbUrl, payload);
  });
}

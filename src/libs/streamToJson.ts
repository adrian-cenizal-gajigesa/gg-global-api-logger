import { gunzipSync } from "zlib";
import { ReadableStream } from "stream/web";

export async function streamToJson(
  stream: ReadableStream<Uint8Array> | null,
  headers: Record<string, string>
) {
  if (!stream) {
    return null;
  }
  const reader = stream.getReader(); // `ReadableStreamDefaultReader`
  const decoder = new TextDecoder("utf-8");
  const chunks: string[] = [];

  async function read() {
    const { done, value } = await reader.read();

    // all chunks have been read?
    if (done) {
      const data = chunks.join("");
      return JSON.parse(data);
    } else {
      // raw decode the payload
      let chunk = decoder.decode(value, { stream: true });
      try {
        // try to decode if gzip is indicated
        // Determine encoding | This is crucial since additional decoding will be needed for compressed response
        if (
          [headers["content-type"], headers["content-encoding"]]
            .join()
            .includes("gzip")
        ) {
          chunk = gunzipSync(value).toString("utf-8");
        }
      } catch (ex) {
        // ignore gzip error. Since some API indicates gzip however data can be decoded uncompressed.
      }
      chunks.push(chunk);
      return read(); // read the next chunk
    }
  }

  return read();
}

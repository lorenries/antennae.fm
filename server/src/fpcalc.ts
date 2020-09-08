import once from "once";
import { Stream } from "stream";
import { spawn } from "child_process";
import * as es from "event-stream";
import concat from "concat-stream";
import filter from "stream-filter";
import reduce from "stream-reduce";
import * as miss from "mississippi";

interface Options {
  length: number;
  stdin?: Stream;
  ts?: boolean;
  chunk?: number;
}

function isStream(stream: string | Stream): stream is Stream {
  return typeof (stream as Stream).pipe === "function";
}

export default function fpcalc(
  file: string | Stream,
  options: Options,
  callback: (error: Error, data: any) => void
) {
  // Make sure the callback is called only once
  callback = once(callback);

  // Command-line arguments to pass to fpcalc
  var args = [];

  // `-length` command-line argument
  if (options.length) {
    args.push("-length", options.length);
  }

  if (options.ts) {
    args.push("-ts");
  }

  if (options.chunk) {
    args.push("-chunk", options.chunk);
  }

  if (isStream(file)) {
    args.push("-");
    options.stdin = file;
  } else {
    args.push(file);
  }

  const command = "fpcalc";

  // Start the  fpcalc child process
  const cp = spawn(command, args);

  if (options.stdin) {
    options.stdin.pipe(cp.stdin);
  }

  run(args, options)
    .on("error", callback)
    .pipe(parse())
    .on("data", function (results) {
      callback(null, results);
    });
}

// Runs the fpcalc tool and returns a readable stream that will emit stdout
// or an error event if an error occurs
function run(args, options) {
  // The command to run
  const command = options.command || "fpcalc";
  // Start the  fpcalc child process
  const cp = spawn(command, args);
  // Create the stream that we will eventually return. This stream
  // passes through any data (cp's stdout) but does not emit an end
  // event so that we can make sure the process exited without error.
  const stream = es.mapSync(function () {});

  // If passed stdin stream, pipe it to the child process
  if (options.stdin) {
    options.stdin.pipe(cp.stdin);
  }

  // Pass fpcalc stdout through the stream
  cp.stdout.pipe(stream);

  // Catch fpcalc stderr errors even when exit code is 0
  // See https://bitbucket.org/acoustid/chromaprint/issue/2/fpcalc-return-non-zero-exit-code-if
  cp.stderr.pipe(
    concat(function (data) {
      if (data && data.toString().slice(0, 6) === "ERROR:") {
        stream.emit("error", new Error("something went wrong"));
      }
    })
  );

  // Check process exit code and end the stream
  cp.on("close", function (code) {
    if (code !== 0) {
      stream.emit("error", new Error("fpcalc failed"));
    }

    stream.queue(null);
  });

  return stream;
}

// -- fpcalc stdout stream parsing

function parse() {
  return es.pipeline(
    // Parse one complete line at a time
    es.split(),
    // Only use non-empty lines
    filter(Boolean),
    // Parse each line into name/value pair
    es.mapSync(parseData),
    // Reduce data into single result object to pass to callback
    reduce(function (result, data) {
      result[data.name] = data.value;
      return result;
    }, {})
  );
}

// Data is given as lines like `FILE=path/to/file`, so we split the
// parts out to a name/value pair
function parseData(data) {
  var index = data.indexOf("=");
  return {
    name: data.slice(0, index).toLowerCase(),
    value: data.slice(index + 1),
  };
}

import { spawn } from "child_process";
import log from "electron-log/main";
import path from "path";

const RESOURCE_EXTENSIONS = [".lsb", ".lsf", ".lsj"];
const LOCA_EXTENSIONS = [".loca"];

export function extract(lslibPath: string, destination: string, source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(lslibPath, ["-a", "extract-package", "-g", "bg3", "-s", source, "-d", destination]);

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Pak extraction failed with code: ${code}`));
        return;
      }

      resolve();
    });

    process.stdout.on("data", (data) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        log.verbose(message);
      }
    });

    process.stderr.on("data", (data) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        log.warn(message);
      }
    });
  });
}

export function convert(lslibPath: string, source: string): Promise<void> {
  const extension = path.extname(source).toLowerCase();
  if (RESOURCE_EXTENSIONS.includes(extension)) {
    return convertResource(lslibPath, `${source}.lsx`, source);
  }

  if (LOCA_EXTENSIONS.includes(extension)) {
    return convertLoca(lslibPath, `${source}.xml`, source);
  }

  throw new Error(`Invalid conversion source: ${source}`);
}

function convertResource(lslibPath: string, destination: string, source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = path.extname(destination).slice(1);
    const input = path.extname(source).slice(1);
    const process = spawn(lslibPath, ["-a", "convert-resource", "-g", "bg3", "-d", destination, "-s", source, "-o", output, "-i", input]);

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Resource conversion failed with code: ${code}`));
        return;
      }

      resolve();
    });

    process.stdout.on("data", (data) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        log.verbose(message);
      }
    });

    process.stderr.on("data", (data) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        log.warn(message);
      }
    });
  });
}

function convertLoca(lslibPath: string, destination: string, source: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const process = spawn(lslibPath, ["-a", "convert-loca", "-g", "bg3", "-d", destination, "-s", source]);

    process.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Loca conversion failed with code: ${code}`));
        return;
      }

      resolve();
    });

    process.stdout.on("data", (data) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        log.verbose(message);
      }
    });

    process.stderr.on("data", (data) => {
      const messages = data.toString().trim().split("\n");
      for (const message of messages) {
        log.warn(message);
      }
    });
  });
}

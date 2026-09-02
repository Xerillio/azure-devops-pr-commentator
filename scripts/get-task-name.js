const fs = require("fs");

const args = process.argv.slice(2);
const taskManifestPath = args[0];
if (taskManifestPath == null || taskManifestPath === "") {
    throw new Error("No path to the task manifest file was specified.");
}

const taskManifest = JSON.parse(fs.readFileSync(taskManifestPath, "utf8"));
if (taskManifest.name == null || taskManifest.name === "") {
    throw new Error(`The task manifest at "${taskManifestPath}" does not define a valid "name" field.`);
}

console.log(taskManifest.name);

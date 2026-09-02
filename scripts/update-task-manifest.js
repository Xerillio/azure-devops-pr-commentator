const fs = require("fs");
const path = require("path");

const [taskManifestPath, versionString, taskId] = process.argv.slice(2);
if (taskManifestPath == null || taskManifestPath === "") {
    throw new Error("No path to the task manifest file was specified.");
}
if (versionString == null || versionString === "") {
    throw new Error("No version was specified.");
}
if (taskId == null || taskId === "") {
    throw new Error("No task ID was specified.");
}

const versionParts = versionString.split(".");
if (versionParts.length !== 3) {
    throw new Error("The specified version must contain major, minor and patch versions in the form '<major>.<minor>.<patch>'");
}

const taskManifest = JSON.parse(fs.readFileSync(taskManifestPath, "utf8"));
taskManifest.version = {
    Major: versionParts[0],
    Minor: versionParts[1],
    Patch: versionParts[2],
};
taskManifest.id = taskId;

const outputPath = path.resolve(taskManifestPath);
fs.writeFileSync(outputPath, `${JSON.stringify(taskManifest, null, 4)}\n`);

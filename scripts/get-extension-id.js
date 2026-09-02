const fs = require("fs");

const args = process.argv.slice(2);
const manifestPath = args[0];
if (manifestPath == null || manifestPath === "") {
    throw new Error("No path to the manifest file was specified.");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (manifest.id == null || manifest.id === "") {
    throw new Error(`The manifest at "${manifestPath}" does not define a valid "id" field.`);
}

console.log(manifest.id);

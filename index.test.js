import fs from "fs";

import express from "express";
import { execa } from "execa";

const defaultFileName = "data.json";

const app = express();
const server = app.listen(3000);
app.use(express.static("./test-fixture/"));
await execa("node", ["index.js", "localhost:3000"]);
server.close();

const urls = JSON.parse(
	fs.readFileSync(defaultFileName, { encoding: "utf-8" })
);

const errorFixture = [
	"http://localhost:3000/child-b/img.jpeg",
	"http://localhost:3000/child-b/img.iojiajsdja",
	"http://localhost:3000/child-b/img.png",
	"http://localhost:3000/child-a/child-b",
	"http://localhost:3000/child-does-not-exist",
];

const foundFixture = [
	"http://localhost:3000",
	"http://localhost:3000/child-a",
	"http://localhost:3000/child-b",
	"http://localhost:3000/child-c",
];

// Compare the results
const unmatchedFixtures = [
	...urls.found.filter((x) => !foundFixture.includes(x)),
	...urls.errors.filter((x) => !errorFixture.includes(x)),
];

if (unmatchedFixtures.length === 0) {
	console.log("✅ Found correct URLs and errors");
} else {
	console.error(`❌ Failed to find correct URLs and errors\n${unmatchedFixtures.join(
		"\n"
	)}
`);
}

fs.rmSync(defaultFileName);

import fs from "fs";
import express from "express";
import { execa } from "execa";
import getSiteUrls from "./index.js";

const defaultFileName = "data.json";

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

const test = async () => {
	// Start localhost:300 of test-fixture dir
	const app = express();
	const server = app.listen(3000);
	app.use(express.static("./test-fixture/"));

	// Run cli and function over the URL
	await execa("node", ["cli.js", "localhost:3000"]);
	const scriptResult = await getSiteUrls("http://localhost:3000");

	const cliResult = JSON.parse(fs.readFileSync(defaultFileName, "utf-8"));
	fs.rmSync(defaultFileName);
	server.close();

	// Compare the results
	[scriptResult, cliResult].forEach((result) => {
		const unmatchedFixtures = [
			...result.found.filter((x) => !foundFixture.includes(x)),
			...result.errors.filter((x) => !errorFixture.includes(x)),
		];

		if (unmatchedFixtures.length === 0) {
			console.log("✅ Found correct URLs and errors");
		} else {
			throw new Error(`❌ Failed to find correct URLs and errors\n${unmatchedFixtures.join(
				"\n"
			)}
		`);
		}
	});
};

await test();

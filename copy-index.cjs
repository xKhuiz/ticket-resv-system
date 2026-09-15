const fs = require("fs");

fs.copyFileSync("dist/index.html", "dist/404.html");

console.log("Created dist/404.html");

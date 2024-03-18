#!/usr/bin/env node

// Imports libs
var chalk = require("chalk")
var boxen = require("boxen")
var fs
var path
var inquirer
var ora
var spinner

// Function to show help page
function showHelp(){
	return console.log(`
 Usage
   $ teablejson

 Options
   --version -v     Show installed version
   --help    -h     Show infos on usage

 How to get your Access Token?
   1. Go on the dashboard of Teable
   2. Click on your username / email in the bottom left corner
   3. Click on the settings "Access Tokens" and use the "Create new token" button
   4. Authorize your token to access needed bases and scopes (read table)

 How to get a Base ID?
   1. Open Teable dashboard and go to your base or any table inside it
   2. Look at the URL, it should look like: https://app.teable.io/base/xxx/yyy/zzz
   3. The base ID is the first part of the URL, in this case "xxx"

 FAQ:
   Q: How many records can the CLI get?
   A: 1000 (API limit)
`)
}

// Function to show version
function showVersion(){
	console.log(`TeableToJSON is using version ${chalk.cyan(require("./package.json").version)}`)
	console.log("────────────────────────────────────────────")
	console.log("Developed by Johan")
	console.log(chalk.cyan("https://johanstick.fr"))
	process.exit()
}

// Check if some arguments are present
var defaultArgs = process.argv.slice(2)
if(defaultArgs.includes("version") || defaultArgs.includes("v") || defaultArgs.includes("--version") || defaultArgs.includes("-v")) return showVersion()
if(defaultArgs.includes("help") || defaultArgs.includes("h") || defaultArgs.includes("--help") || defaultArgs.includes("-h")) return showHelp()

// Check updates
const updateNotifier = require("update-notifier")
const pkg = require("./package.json")
const notifierUpdate = updateNotifier({ pkg, updateCheckInterval: 10 }) // on vérifie les MAJ
if(notifierUpdate.update && pkg.version != notifierUpdate.update.latest){ // si une MAJ est disponible
	console.log(boxen(`Update available ${chalk.dim(pkg.version)}${chalk.reset(" → ")}${chalk.green(notifierUpdate.update.latest)}\nRun ${chalk.cyan(`npm i -g ${pkg.name}`)} to update`, {
		padding: 1,
		margin: 1,
		textAlignment: "left",
		borderColor: "yellow",
		borderStyle: "round"
	}))

	console.log("\u0007")
}

// Function to create a .env file
async function createEnvFile(){
	// Import inquirer
	if(!inquirer) inquirer = require("inquirer")

	// Log
	console.log("To use this CLI, you will need a valid .env file with your Teable access token and base ID.")
	console.log("We will help you to create it by asking you some questions.")

	// Ask Auth Token
	console.log(`\n${chalk.yellow("| How to get your Access Token:")}\n1. Go on the dashboard of Teable\n2. Click on your username / email in the bottom left corner\n3. Click on the settings "Access Tokens" and use the "Create new token" button\n4. Authorize your token to access needed bases and scopes (read table)`)
	var { TEABLE_AUTH_TOKEN } = await inquirer.prompt([{
		type: "input",
		name: "TEABLE_AUTH_TOKEN",
		message: "Access token",
		validate: function(answer){
			if(answer.length < 1) return "You must provide an access token"
			return true
		}
	}])

	// Ask Base ID
	console.log(`\n${chalk.yellow("| How to get a Base ID:")}\n1. Open Teable dashboard and go to your base or any table inside it\n2. Look at the URL, it should look like: https://app.teable.io/base/xxx/yyy/zzz\n3. The base ID is the first part of the URL, in this case "xxx"`)
	var { TEABLE_BASE_ID } = await inquirer.prompt([{
		type: "input",
		name: "TEABLE_BASE_ID",
		message: "Base ID",
		validate: function(answer){
			if(answer.length < 1) return "You must provide a base ID"
			return true
		}
	}])

	// Ask file name if user want it
	console.log(`\n${chalk.yellow("| Optional:")}\nYou can provide a file name for the JSON file (default: teable.json)\nEnter a relative path to save the file inside a folder (it must already exist)`)
	var { TEABLE_FILENAME } = await inquirer.prompt([{
		type: "input",
		name: "TEABLE_FILENAME",
		message: "Optional File name",
		validate: function(answer){
			if(answer.length > 1 && answer.endsWith(".json")) return "File name should not end with any extension"
			return true
		}
	}])

	// Create the content of the .env
	var envContent = `# TeableToJSON\nTEABLE_AUTH_TOKEN=${TEABLE_AUTH_TOKEN}\nTEABLE_BASE_ID=${TEABLE_BASE_ID}`
	if(TEABLE_FILENAME) envContent += `\nTEABLE_FILENAME=${TEABLE_FILENAME}`

	// Write the .env file
	writeFile(path.join(process.cwd(), ".env"), envContent)

	return true
}

// Function to write file while checking for write error
function writeFile(file, content){
	try {
		fs.writeFileSync(file, content)
	} catch(err) {
		if(spinner) spinner.stop()
		console.error(boxen(err.stack || err || err, { title: "An error occured ― writing file", padding: 1, margin: 1, textAlignment: "left", borderColor: "red", borderStyle: "round" }))
		process.exit(1)
	}
}

// Main function
async function main(){
	// Import libs
	if(!fs) fs = require("fs")
	if(!path) path = require("path")
	if(!ora) ora = require("ora")
	if(!spinner) spinner = ora()

	// Check if .env file is present
	spinner.start("Checking .env file")
	var envFile = path.join(process.cwd(), ".env")
	if(!fs.existsSync(envFile)){
		spinner.stop()
		await createEnvFile()
	}

	// Parse .env file
	spinner.text = "Parsing .env file"
	var envContent = fs.readFileSync(envFile, "utf8")
	var envLines = envContent.split("\n")
	var envData = {}
	envLines.forEach(line => {
		if(line.startsWith("#")) return
		if(line.includes("=")){
			var lineSplit = line.split("=")
			if(lineSplit[1].startsWith("\"") && lineSplit[1].endsWith("\"")) lineSplit[1] = lineSplit[1].slice(1, -1)
			envData[lineSplit[0]] = lineSplit[1]
		}
	})

	// Check if required data is present
	spinner.text = "Checking required data"
	if(!envData.TEABLE_AUTH_TOKEN){
		envData.TEABLE_AUTH_TOKEN = process.env.TEABLE_AUTH_TOKEN
		if(!envData.TEABLE_AUTH_TOKEN) return spinner.fail("TEABLE_AUTH_TOKEN (Access Token, found in your user settings) is required in .env file")
	}
	if(!envData.TEABLE_BASE_ID){
		envData.TEABLE_BASE_ID = process.env.TEABLE_BASE_ID
		if(!envData.TEABLE_BASE_ID) return spinner.fail("TEABLE_BASE_ID (ID of the data base to check, use command with --help for more infos) is required in .env file")
	}
	var fileName = envData.TEABLE_FILENAME || process.env.TEABLE_FILENAME || "teable"

	// Get all tables inside the base
	spinner.text = "Fetching base data"
	var baseData = await fetch(`https://app.teable.io/api/base/${envData.TEABLE_BASE_ID}/table`, {
		headers: {
			"Authorization": `Bearer ${envData.TEABLE_AUTH_TOKEN}`
		}
	}).then(res => res.json()).catch(err => { return { message: err } })

	// If any error occured
	spinner.text = "Checking base response"
	if(baseData.message){
		spinner.stop()
		console.error(boxen(baseData.message || baseData.code || baseData.status || JSON.stringify(baseData), { title: "An error occured ― fetching base data", padding: 1, margin: 1, textAlignment: "left", borderColor: "red", borderStyle: "round" }))
		process.exit(1)
	}
	if(baseData.length == 0){
		spinner.stop()
		console.error(boxen("Bases list has been accessed without issues, but no tables have been found", { title: "An error occured ― fetching base data", padding: 1, margin: 1, textAlignment: "left", borderColor: "red", borderStyle: "round" }))
		process.exit(1)
	}

	// Import inquirer
	if(!inquirer) inquirer = require("inquirer")

	// If we got more than one table
	var tableSelected
	if(baseData.length > 1){ // Ask user to select the tables to get data from
		spinner.stop()
		tableSelected = await inquirer.prompt([{
			type: "checkbox",
			name: "tables",
			message: "Select the tables to get data from",
			choices: baseData.map(table => { return { name: table.name, value: table.id, checked: true } }),
			validate: function(answer){
				if(answer.length < 1) return "You must choose at least one table"
				return true
			}
		}])
	} else { // If only one table, select it
		tableSelected = { tables: [baseData[0].id] }
	}

	// Variable for later
	var finalJson = { attributes: { generatedOn: new Date().toISOString(), platform: process.platform, generator: "TeableToJSON" } }

	// Pass on every table
	spinner.start("Fetching tables")
	for(var i = 0; i < tableSelected.tables.length; i++){
		var tableId = tableSelected.tables[i]
		var tableName = baseData.find(table => table.id == tableId).name
		var tablePosText = `${i + 1}/${tableSelected.tables.length}`

		// Get table data
		spinner.text = `Fetching table (${tablePosText})`
		var tableData = await fetch(`https://app.teable.io/api/table/${tableId}/record?take=1000`, {
			headers: {
				"Authorization": `Bearer ${envData.TEABLE_AUTH_TOKEN}`
			}
		}).then(res => res.json()).catch(err => { return { message: err } })

		// If any error occured
		spinner.text = `Quick checks (${tablePosText})`
		if(tableData.message){
			spinner.stop()
			console.error(boxen(tableData.message || tableData.code || tableData.status || JSON.stringify(tableData), { title: `An error occured ― fetching table data ${i + 1}/${tableSelected.tables.length}`, padding: 1, margin: 1, textAlignment: "left", borderColor: "red", borderStyle: "round" }))
			process.exit(1)
		}
		if(tableData.records.length == 0){
			spinner.stop()
			console.error(boxen("Table has been accessed without issues, but no records have been found", { title: `An error occured ― fetching table data ${i + 1}/${tableSelected.tables.length}`, padding: 1, margin: 1, textAlignment: "left", borderColor: "red", borderStyle: "round" }))
			process.exit(1)
		}

		// Save data in variable
		spinner.text = `Saving data in memory (${tablePosText})`
		finalJson[tableName.toLowerCase().replace(/\W/ig, "_").trim()] = tableData.records
			.sort((a, b) => new Date(b.lastModifiedTime) - new Date(a.lastModifiedTime))
			.map(record => {
				var newRecord = {}
				Object.keys(record.fields).forEach(key => {
					newRecord[key?.toLowerCase()?.trim()] = typeof record?.fields?.[key] == "string" ? record.fields[key]?.trim() : record.fields[key]
				})
				return newRecord
			})
	}

	// Saving JSON file
	spinner.text = "Saving JSON file"
	var jsonFile = path.join(process.cwd(), `${fileName}.json`)

	// Check if a Teable script is present in folder
	var scriptFile = path.join(process.cwd(), ".teablescript.js")
	if(fs.existsSync(scriptFile)){
		spinner.start("Executing user-script")

		// Execute script
		var returnedByScript
		try {
			returnedByScript = await require(scriptFile)(finalJson)
		} catch(err) {
			spinner.stop()
			console.error(boxen(err.stack || err.message || err, { title: "An error occured ― executing user-script", padding: 1, margin: 1, textAlignment: "left", borderColor: "red", borderStyle: "round" }))
			process.exit(1)
		}

		// Check if script returned something
		if(returnedByScript && typeof returnedByScript == "string"){
			spinner.stop()
			console.error(boxen(returnedByScript, { title: "An error occured ― executing user-script", padding: 1, margin: 1, textAlignment: "left", borderColor: "red", borderStyle: "round" }))
			process.exit(1)
		}
		if(returnedByScript && typeof returnedByScript == "object"){
			finalJson = returnedByScript
		}
	}

	// Write JSON file
	writeFile(jsonFile, JSON.stringify(finalJson))
	spinner.succeed(`JSON file has been generated at ${jsonFile} (${Object.keys(finalJson).length - 1} tables)`)

	// Ask if user want to generate a text file
	var { generateTxtConfirm } = await inquirer.prompt([{
		type: "confirm",
		name: "generateTxtConfirm",
		message: "Do you want to generate a text file with the same data?",
		default: false
	}])
	if(generateTxtConfirm){
		// Spinner
		spinner.start("Generating and saving text file")

		// Generate text file
		var textContent = ""
		Object.keys(finalJson).forEach(key => {
			if(key == "attributes") return
			textContent += `=================== Table: ${key} ===================\n\n`
			finalJson[key].forEach(record => {
				textContent += "-----------------------------------------------------------------------\n"
				Object.keys(record).forEach(field => {
					textContent += `    ${field}: ${record[field]}\n`
				})
				textContent += "-----------------------------------------------------------------------\n\n"
			})
			textContent += "=====================================================\n\n"
		})

		// Write text file
		var txtFile = path.join(process.cwd(), `${fileName}.txt`)
		writeFile(txtFile, textContent)
		spinner.succeed(`Text file has been generated at ${txtFile}`)
	}
}
main()
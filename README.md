###### Version française [ici](https://github.com/johan-perso/teable-to-json/blob/main/README.fr.md).

# TeableToJSON

A CLI designed to export one or more tables from a Teable base to a JSON file, to use in a project as a CMS.

https://github.com/johan-perso/teable-to-json/assets/41506568/d5cf0847-fdbd-4397-87ba-1cae05907482


## Installation

> TeableToJSON only supports recent versions of NodeJS (v20+).

```bash
# With npm
npm i -g teablejson

# Or with pnpm
pnpm i -g teablejson
```

```bash
$ teablejson --version
$ teablejson --help
```


## Configuration

To access one of your bases, you will need to configure a `.env` file in the folder where you execute TeableToJSON. Example:

```env
# Authentification, required
TEABLE_AUTH_TOKEN=teable_xxx
TEABLE_BASE_ID=xxx

# Option, facultative
TEABLE_FILENAME=nomdefichier
```

If no .env file is found when running the command, TeableToJSON will help you create one.


## User script

If you need your exported base to be checked or modified before being saved, you can create a file named `.teablescript.js` in the folder where you run TeableToJSON.

* Your script must export a function that takes a JSON object as a parameter, the one of the exported base.
* If a string is returned, the JSON file will not be saved and the content of the string will be displayed in the console.
* If an object is returned, the JSON file will be saved with the content of the object.
* If nothing is returned, the JSON file will be saved as is.

Exemple :

```js
module.exports = async function(json){
	// Check that the base contains a table named "issues"
	if(!json.issues) return "The base doesn't contain any table named 'issues'"

	// Remove objects that are marked as "archived"
	json.issues = json.issues.filter(issue => !issue.archived)

	// Return the modified JSON
	return json
}
```


## License

MIT © [Johan](https://johanstick.fr). Support this project via [Ko-Fi](https://ko-fi.com/johan_stickman) or [PayPal](https://paypal.me/moipastoii) if you want to help me 💙

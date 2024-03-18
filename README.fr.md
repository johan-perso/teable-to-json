###### English version [here](https://github.com/johan-perso/teable-to-json/blob/main/README.md).

# TeableToJSON

Un CLI conçu pour exporter une ou plusieurs tables d'une base Teable vers un fichier JSON, pour l'utiliser dans un projet comme si c'était un CMS.


<!-- TODO: video -->

## Installation

> TeableToJSON ne supporte que les versions récentes de NodeJS (v20+).

```bash
# Avec npm
npm i -g teablejson

# Ou avec pnpm
pnpm i -g teablejson
```

```bash
$ teablejson --version
$ teablejson --help
```


## Configuration

Pour accéder à une de vos bases, vous devrez configurer un fichier `.env` dans le dossier où vous exécutez TeableToJSON. Voici un exemple :

```env
# Authentification, requis
TEABLE_AUTH_TOKEN=teable_xxx
TEABLE_BASE_ID=xxx

# Option, facultatif
TEABLE_FILENAME=nomdefichier
```

Si aucun fichier .env n'est trouvé lors de l'exécution de la commande, TeableToJSON vous aidera à en créer un.


## Script utilisateur

Si vous avez besoin que votre base exporté soit vérifiée ou modifiée avant d'être enregistré, vous pouvez créer un fichier nommé `.teablescript.js` dans le dossier auquel vous exécutez TeableToJSON.

* Votre script doit exporter une fonction qui prend en paramètre un objet JSON, celui de la base exportée.
* Si un string est retourné, le fichier JSON ne sera pas enregistré et le contenu du string sera affiché dans la console.
* Si un objet est retourné, le fichier JSON sera enregistré avec le contenu de l'objet.
* Si rien n'est retourné, le fichier JSON sera enregistré tel quel.

Exemple :

```js
module.exports = async function(json){
	// Vérifier que la base contienne une table nommée "issues"
	if(!json.issues) return "La base ne contient pas de table nommée 'issues'"

	// Supprimer les objets qui sont marqués comme "archivés"
	json.issues = json.issues.filter(issue => !issue.archived)

	// Retourner le JSON modifié
	return json
}
```


## Licence

MIT © [Johan](https://johanstick.fr). Soutenez ce projet via [Ko-Fi](https://ko-fi.com/johan_stickman) ou [PayPal](https://paypal.me/moipastoii) si vous souhaitez m'aider 💙
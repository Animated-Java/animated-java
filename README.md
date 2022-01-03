# Animated Java

## Setting up Animated Java for local development

### Requirements

-   nodejs
-   yarn

### Setup

1. Clone or download this repo.
2. Run `yarn setup` to do the one time setup.
3. Run `yarn dev` to build animated java and watch for changes

### Making a production build

1. If you have not follow the setup instructions.
2. run `yarn build`

## Adding Localizations.

### For a new language.

1. Fork the animated-java repo.
2. copy `src/lang/en.yaml` and rename it to the language you're translating. If a language file with that name already exists you should overwrite it.
3. translate!
4. Make a pull request with your translations against the animated java repo.
5. We'll look over the PR ASAP and provide feedback if nessessary, or merge it.

To edit an existing language follow the above steps; but instead of overwriting the file just edit it as is.
You can check what translation keys are missing using the following code inside of blockbench's dev tools (Opened with Ctrl+shift+i)
```js
ANIMATED_JAVA.logging = true
ANIMATED_JAVA.logIntlDifferences()
```

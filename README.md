<p align="center"><img src="https://user-images.githubusercontent.com/48780301/147949112-1929eeeb-e8e6-412d-886e-5b3d6615886f.png" width="256" alt="Animated Java Logo"></img></p>
<h1 align="center">Animated Java<br>
  <a href="https://discord.gg/jFgY4PXZfp"><img src="https://img.shields.io/discord/785339959518953482?color=5865f2&label=Discord&style=flat" alt="Discord"></a>
  <a href="https://www.patreon.com/animatedjava"><img src="https://img.shields.io/badge/Supporters-1-ff5733" alt="Patreon"></a>
</h1>

Welcome to Animated Java, A tool for mapmakers to create smooth, and detailed animations for Minecraft Java Edition.

# Installing
- Open Blockbench and navigate to the plugin list
- Click on the "Available" tab, then search for `Animated Java`
- Click `install`
- Congratulations! You've installed Animated Java!

# Contributing to Animated Java

### Setting up a Development Enviornment
You will need to install `nodejs` and `yarn` before you get started.

1. Clone the repo
2. Run `yarn setup` to setup the yarn env and build the development tools.
3. Run `yarn dev` to build automatically on file changes.

To make a production build, run `yarn build` inside your development enviornment.

### Adding Localizations

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

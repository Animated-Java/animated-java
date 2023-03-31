<div align="center">
	<img src="https://raw.githubusercontent.com/Animated-Java/animated-java/experimental/src/assets/animated_java_icon.webp"/>
</div>
<h1 align="center">
	Animated Java
	<br>
	<a href="https://discord.gg/jFgY4PXZfp">
		<img src="https://img.shields.io/discord/785339959518953482?color=5865f2&label=Discord&style=flat" alt="Discord" />
	</a>
	<a>
		<img src="https://img.shields.io/github/package-json/v/animated-java/animated-java" alt="GitHub package.json version" />
	</a>
</h1>
<h3 align="center">
	A Blockbench plugin that makes complex animation a breeze in Minecraft: Java Edition.
</h3>
<br/>

# How to Install
Open the Plugins menu in BlockBench (File > Plugins)

![Plugin Menu](https://raw.githubusercontent.com/Animated-Java/animated-java/experimental/src/assets/plugin_menu.png)

In the Plugins menu, click on `Load Plugin from URL`

![Load Plugin from URL](https://raw.githubusercontent.com/Animated-Java/animated-java/experimental/src/assets/load_plugin_from_url.png)

Then, paste this URL into the box that appears: https://animated-java.dev/animated_java.js

![URL](https://raw.githubusercontent.com/Animated-Java/animated-java/experimental/src/assets/plugin_menu.png)

Click Confirm, and success! You've just installed Animated Java.

# Getting Started
Check out the [Getting Started](https://animated-java.dev/docs/getting_started) page either online or in-app for detailed information on getting started with Animated Java.

# Contributing
## Prerequisites
Things you'll need installed before you can setup the development environment
- [Node.js](https://nodejs.org/en/)
- [Yarn](https://classic.yarnpkg.com/lang/en/docs/install/#windows-stable)

## Setting up the Development Environment

1. Clone the repository.
2. Run `yarn install` to install dependencies.
3. Run `yarn build:dev` to start the development environment.
4. Open Blockbench, then go to `File > Plugins > Load Plugin From File` and select the `animated_java.js` file from your local repo (`dist/animated-java.js`).

## Adding Localizations
1. Copy the `en.yaml` file in `src/lang/` and rename it to match the language you're translating to.
2. Translate! Note that you should be testing your translations as you go in Blockbench.
3. Once you're done translating and testing, open a pull request with your changes.

# Creating a Custom Exporter
We have a guide on how to create an external exporter for Animated Java [here](https://github.com/Animated-Java/animated-java-exporter-plugin-template).
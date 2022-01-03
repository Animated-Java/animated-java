# Animated Java

## Setting up Animated Java for local development

### requirements

-   nodejs
-   yarn

### setup

1. clone or download this repo.
2. run `yarn setup` to do the one time setup.
3. run `yarn dev` to build animated java and watch for changes

### making a production build

1. if you have not follow the setup instructions.
2. run `yarn build`

## Adding Localizations.

### For a untranslated language.

1. fork the animated-java repo.
2. copy `src/lang/en.yaml` and rename it to your desired language prefix overwriting the preexisting file if it does not exist already we will not accept a translation for it.
3. translate!
4. make a pull request against the animated java repo.
5. let us know you made a pr and we will review it, we may ask another person to look it over and if everything looks good we will merge it.

### For an already translated language (modifying existing keys)

1. fork the animated-java repo.
2. make changes.
3. make a pull request against the animated java repo.
4. let us know you made a pr and we will review it, we may ask another person to look it over and if everything looks good we will merge it.

### For an already translated language (adding new keys)

1. fork the animated-java repo.
2. to see what keys are different you can run the following in the blockbench dev tools

```js
ANIMATED_JAVA.logging = true
ANIMATED_JAVA.logIntlDifferences()
```

3. make changes refering to `src/lang/en.yaml` for reference.
4. make a pull request against the animated java repo.
5. let us know you made a pr and we will review it, we may ask another person to look it over and if everything looks good we will merge it.

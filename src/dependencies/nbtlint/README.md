# NBTLint

Quickly and easily validate the stringified NBT format (SNBT) used in Minecraft commands.
Available on the web at https://www.soltoder.com/NBTLint/

[Also available as a JavaScript library.](https://github.com/AjaxGb/NBTLint/blob/master/docs/nbt-lint.js)

```html
<script src="nbt-lint.js"></script>
<script>
	var tag1
	try {
		tag1 = nbtlint.parse(input.value)
	} catch (e) {
		output.value = e.message
	}

	var tag2 = new nbtlint.TagCompound({
		Score: new nbtlint.TagInteger(1500),
		Pos: new nbtlint.TagList(nbtlint.TagDouble, [
			new nbtlint.TagDouble(15.5),
			new nbtlint.TagDouble(123),
			new nbtlint.TagDouble(-491.77),
		]),
		SelectedItem: new nbtlint.TagCompound({
			id: new nbtlint.TagString('minecraft:diamond_sword'),
		}),
	})
	console.log(nbtlint.stringify(tag2, '\t'))

	// {
	// 	Score: 1500,
	// 	Pos: [15.5d, 123d, -491.77d],
	// 	SelectedItem: {
	// 		id: "minecraft:diamond_sword"
	// 	}
	// }
</script>
```

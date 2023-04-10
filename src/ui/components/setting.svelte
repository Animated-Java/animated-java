<script lang="ts">
	import * as AJ from '../../settings'
	import Number from './settings/number.svelte'
	import TextInline from './settings/textInline.svelte'
	import Checkbox from './settings/checkbox.svelte'
	import Codebox from './settings/codebox.svelte'
	import ListBuilder from './settings/listBuilder.svelte'
	import Dropdown from './settings/dropdown.svelte'
	import File from './settings/file.svelte'
	import Folder from './settings/folder.svelte'
	import DoubleNumber from './settings/doubleNumber.svelte'

	export let setting: AJ.Setting<any>
</script>

{#if setting instanceof AJ.CheckboxSetting}
	<Checkbox {setting} />
{:else if setting instanceof AJ.CodeboxSetting}
	<Codebox {setting} />
{:else if setting instanceof AJ.ListBuilderSetting}
	<ListBuilder {setting} />
{:else if setting instanceof AJ.DropdownSetting}
	<Dropdown {setting} />
{:else if setting instanceof AJ.FileSetting}
	<File {setting} />
{:else if setting instanceof AJ.FolderSetting}
	<Folder {setting} />
{:else if setting instanceof AJ.NumberSetting}
	<Number {setting} />
{:else if setting instanceof AJ.DoubleNumberSetting}
	<DoubleNumber {setting} />
{:else if setting instanceof AJ.InlineTextSetting}
	<TextInline {setting} />
{:else}
	<div>Encountered unknown setting type</div>
{/if}

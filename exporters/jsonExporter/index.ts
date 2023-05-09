import { loadExporter } from './jsonExporter'

requestAnimationFrame(function repeat() {
	if (AnimatedJava?.loaded) loadExporter()
	else requestAnimationFrame(repeat)
})

import { loadExporter } from './rawExporter'

requestAnimationFrame(function repeat() {
	if (AnimatedJava?.loaded) loadExporter()
	else requestAnimationFrame(repeat)
})

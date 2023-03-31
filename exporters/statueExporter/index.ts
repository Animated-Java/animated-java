import { loadExporter } from './statueExporter'

requestAnimationFrame(function repeat() {
	if (AnimatedJava?.loaded) loadExporter()
	else requestAnimationFrame(repeat)
})

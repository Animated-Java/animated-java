import { loadExporter } from './animationExporter'

requestAnimationFrame(function repeat() {
	if (AnimatedJava?.loaded) loadExporter()
	else requestAnimationFrame(repeat)
})

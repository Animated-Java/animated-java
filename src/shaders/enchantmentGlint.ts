const GLINT_OVERLAY_MATERIAL = new THREE.ShaderMaterial({
	uniforms: {
		uTime: { value: 0 },
		uGlint: { value: 0.5 },
		uGlintScale: { value: 1.0 },
		uMap: { value: null },
	},
	vertexShader: `
		varying vec2 vUv;

		void main() {
			vUv = uv;

			// Slightly push vertices out along normals to prevent z-fighting
			vec3 pushedPosition = position + normal * 0.001;
			gl_Position = projectionMatrix * modelViewMatrix * vec4(pushedPosition, 1.0);
		}
	`,
	fragmentShader: `
		uniform float uTime;
		uniform float uGlint;
		uniform float uGlintScale;
		uniform sampler2D uMap;
		varying vec2 vUv;

		float hash(vec2 p){ p=fract(p*vec2(127.1,311.7)); p+=dot(p,p+74.13); return fract(p.x*p.y); }
		float vnoise(vec2 p){
		vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
			return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
		}
		float fbm(vec2 p){ float v=0.0,a=0.5; for(int i=0;i<5;i++){ v+=a*vnoise(p); p=p*2.1+vec2(4.7,3.3); a*=0.5; } return v; }

		vec3 glintPass(vec2 uv, float speed, float angle, vec3 cA, vec3 cB){
		float s=sin(angle), c=cos(angle);
		vec2 ruv = vec2(c*uv.x-s*uv.y, s*uv.x+c*uv.y);
		vec2 suv = ruv*8.0 + vec2(uTime*speed, uTime*speed*0.65);
		float band = pow(abs(sin((suv.x+suv.y)*3.14159)), 2.2);
		float org  = fbm(ruv*3.5 + uTime*0.07);
		float hsh  = sin(uTime*0.8 + ruv.x*3.5 + ruv.y*2.1)*0.5+0.5;
			return mix(cA,cB,hsh) * band * (org*0.55+0.45);
		}

		void main() {
			// Sample the alpha channel from the original mesh's texture map
			vec4 texColor = texture2D(uMap, vUv);
			// If the underlying texture pixel is completely transparent, discard this overlay pixel
			if (texColor.a < 0.01) discard;

			// Scale the texture coordinates locally before passing them into the passes
			vec2 scaledUv = vUv * uGlintScale;

			// Calculate dual-pass glint
			vec3 g1 = glintPass(scaledUv, 0.40,  0.8727, vec3(0.70, 0.00, 1.00), vec3(0.30, 0.00, 0.80));
			vec3 g2 = glintPass(scaledUv,-0.22, -0.1745, vec3(0.50, 0.05, 0.90), vec3(0.20, 0.00, 0.60));

			// Output only the glint color, masked by the original texture's alpha channel
			gl_FragColor = vec4((g1 * 0.65 + g2 * 0.45) * uGlint, texColor.a);
		}
	`,
	transparent: true,
	depthWrite: false,
	blending: THREE.AdditiveBlending,
})

// Track materials globally to keep uTime ticking
const ACTIVE_OVERLAY_MATERIALS: THREE.ShaderMaterial[] = []
function overlayTimeUpdate() {
	ACTIVE_OVERLAY_MATERIALS.forEach(mat => {
		mat.uniforms.uTime.value += 0.016
	})
	requestAnimationFrame(overlayTimeUpdate)
}
overlayTimeUpdate()

// 2. The updated Apply function
export function applyEnchantmentGlintToMesh(mesh: THREE.Mesh, uvScale = 1.0) {
	// Prevent duplicate overlays
	if (mesh.getObjectByName('EnchantmentGlintOverlay')) return

	const originalMat = mesh.material as any

	// Grab a reference to the texture map
	const originalTexture = originalMat.map ?? null

	// Create a unique material instance for this overlay so it maps the correct texture
	const overlayMaterial = GLINT_OVERLAY_MATERIAL.clone()
	overlayMaterial.uniforms.uMap.value = originalTexture
	overlayMaterial.uniforms.uGlintScale.value = uvScale
	ACTIVE_OVERLAY_MATERIALS.push(overlayMaterial)

	// Create the overlay mesh sharing the original geometry
	const overlayMesh = new THREE.Mesh(mesh.geometry, overlayMaterial)
	overlayMesh.name = 'EnchantmentGlintOverlay'

	overlayMesh.renderOrder = 1 // Ensure it renders on top of the original mesh
	overlayMesh.scale.multiplyScalar(1.001) // Slightly scale up to prevent z-fighting

	// Ensure it stays locked to the parent mesh position/rotation
	mesh.add(overlayMesh)
}

// 3. The updated Remove function
export function removeEnchantmentGlintFromMesh(mesh: THREE.Mesh) {
	const overlayMesh = mesh.getObjectByName('EnchantmentGlintOverlay') as THREE.Mesh

	if (overlayMesh) {
		// Clean up the cloned overlay material from our uniform updater array
		const index = ACTIVE_OVERLAY_MATERIALS.indexOf(overlayMesh.material as THREE.ShaderMaterial)
		if (index !== -1)
			ACTIVE_OVERLAY_MATERIALS.splice(index, 1)

			// Clean up memory
		;(overlayMesh.material as THREE.ShaderMaterial).dispose()

		// Remove from the scene graph
		mesh.remove(overlayMesh)
	}
}

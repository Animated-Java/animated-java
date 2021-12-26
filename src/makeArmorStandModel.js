export function makeArmorStandModel() {
	const root = new THREE.Object3D()
	const [elements, texture] = [
		[
			{
				size: [12, 1, 12],
				pos: [0, -5.5, 0],
				origin: [0, 0, 0],
				north: {
					uv: [0, 11, 3, 11.25],
				},
				east: {
					uv: [3, 11, 6, 11.25],
				},
				south: {
					uv: [6, 11, 9, 11.25],
				},
				west: {
					uv: [9, 11, 12, 11.25],
				},
				up: {
					uv: [3, 8, 6, 11],
					rotation: 90,
				},
				down: {
					uv: [6, 8, 9, 11],
					rotation: 270,
				},
			},
			{
				size: [2, 11, 2],
				pos: [0, 0.5, -2],
				origin: [0, 0, 0],
				north: {
					uv: [8.5, 4.5, 9, 7.5],
				},
				east: {
					uv: [9, 4.5, 9.5, 7.5],
				},
				south: {
					uv: [9.5, 4.5, 10, 7.5],
				},
				west: {
					uv: [8, 4.5, 8.5, 7.5],
				},
				up: {
					uv: [8.5, 4, 9, 4.5],
					rotation: 90,
				},
				down: {
					uv: [9, 4, 9.5, 4.5],
					rotation: 270,
				},
			},
			{
				size: [2, 11, 2],
				pos: [0, 0.5, 2],
				origin: [0, 0, 0],
				north: {
					uv: [8.5, 4.5, 9, 7.5],
				},
				east: {
					uv: [9, 4.5, 9.5, 7.5],
				},
				south: {
					uv: [9.5, 4.5, 10, 7.5],
				},
				west: {
					uv: [8, 4.5, 8.5, 7.5],
				},
				up: {
					uv: [8.5, 4, 9, 4.5],
					rotation: 90,
				},
				down: {
					uv: [9, 4, 9.5, 4.5],
					rotation: 270,
				},
			},
			{
				size: [2, 2, 8],
				pos: [0, 7, 0],
				origin: [0, 0, 0],
				north: {
					uv: [0.25, 5.75, 0.75, 6.25],
					texture: '#0',
				},
				east: {
					uv: [0.25, 5.75, 2.25, 6.25],
					texture: '#0',
				},
				south: {
					uv: [4.75, 5.75, 5.25, 6.25],
					texture: '#0',
				},
				west: {
					uv: [2.75, 5.75, 4.75, 6.25],
					texture: '#0',
				},
				up: {
					uv: [0, 12.5, 2, 13],
					texture: '#0',
					rotation: 90,
					rotation: 90,
				},
				down: {
					uv: [0, 12.5, 2, 13],
					texture: '#0',
					rotation: 90,
					rotation: 270,
				},
			},
			{
				size: [2, 7, 2],
				pos: [0, 11.5, 2],
				origin: [0, 0, 0],
				north: {
					uv: [8.5, 4.5, 9, 7.5],
				},
				east: {
					uv: [9, 4.5, 9.5, 7.5],
				},
				south: {
					uv: [9.5, 4.5, 10, 7.5],
				},
				west: {
					uv: [8, 4.5, 8.5, 7.5],
				},
				up: {
					uv: [8.5, 4, 9, 4.5],
					rotation: 90,
				},
				down: {
					uv: [9, 4, 9.5, 4.5],
					rotation: 270,
				},
			},
			{
				size: [2, 7, 2],
				pos: [0, 11.5, -2],
				origin: [0, 0, 0],
				north: {
					uv: [8.5, 4.5, 9, 7.5],
				},
				east: {
					uv: [9, 4.5, 9.5, 7.5],
				},
				south: {
					uv: [9.5, 4.5, 10, 7.5],
				},
				west: {
					uv: [8, 4.5, 8.5, 7.5],
				},
				up: {
					uv: [8.5, 4, 9, 4.5],
					rotation: 90,
				},
				down: {
					uv: [9, 4, 9.5, 4.5],
					rotation: 270,
				},
			},
			{
				size: [3, 3, 12],
				pos: [0, 16.505, 0],
				origin: [0, 0, 0],
				north: {
					uv: [3, 7.25, 3.75, 8],
				},
				east: {
					uv: [3.75, 7.25, 6.75, 8],
					texture: '#0',
				},
				south: {
					uv: [6.75, 7.25, 7.5, 8],
					texture: '#0',
				},
				west: {
					uv: [0, 7.25, 3, 8],
				},
				up: {
					uv: [0.75, 6.5, 3.75, 7.25],
					texture: '#0',
					rotation: 90,
					rotation: 90,
				},
				down: {
					uv: [3.75, 6.5, 6.75, 7.25],
					texture: '#0',
					rotation: 90,
					rotation: 270,
				},
			},
			{
				size: [2, 6, 2],
				pos: [0, 21, 0],
				origin: [0, 0, 0],
				north: {
					uv: [0.5, 0.5, 1, 2.25],
				},
				east: {
					uv: [1, 0.5, 1.5, 2.25],
				},
				south: {
					uv: [1.5, 0.5, 2, 2.25],
				},
				west: {
					uv: [0, 0.5, 0.5, 2.25],
				},
				up: {
					uv: [0.5, 0, 1, 0.5],
					rotation: 90,
				},
				down: {
					uv: [1, 0, 1.5, 0.5],
					rotation: 270,
				},
			},
			{
				size: [2, 12, 2],
				pos: [0, 12, -6],
				origin: [0, 0, 0],
				north: {
					uv: [7, 0.5, 7.5, 3.5],
				},
				east: {
					uv: [6.5, 0.5, 6, 3.5],
				},
				south: {
					uv: [7.5, 0.5, 8, 3.5],
				},
				west: {
					uv: [6, 0.5, 6.5, 3.5],
				},
				up: {
					uv: [6.5, 0, 7, 0.5],
					rotation: 90,
				},
				down: {
					uv: [7, 0, 7.5, 0.5],
					rotation: 270,
				},
			},
			{
				size: [2, 12, 2],
				pos: [0, 12, 6],
				origin: [0, 0, 0],
				north: {
					uv: [7, 0.5, 7.5, 3.5],
				},
				east: {
					uv: [6.5, 0.5, 7, 3.5],
				},
				south: {
					uv: [7.5, 0.5, 8, 3.5],
				},
				west: {
					uv: [6.5, 0.5, 6, 3.5],
				},
				up: {
					uv: [6.5, 0, 7, 0.5],
					rotation: 90,
				},
				down: {
					uv: [7, 0, 7.5, 0.5],
					rotation: 270,
				},
			},
		],
		'assets/armor_stand.png',
	]
	var img = new Image()
	img.src = texture
	var tex = new THREE.Texture(img)
	img.tex = tex
	img.tex.magFilter = THREE.NearestFilter
	img.tex.minFilter = THREE.NearestFilter
	img.onload = function () {
		tex.needsUpdate = true
	}
	img.crossOrigin = ''
	var mat = new THREE.MeshLambertMaterial({
		color: 0xffffff,
		map: tex,
		transparent: true,
		vertexColors: THREE.FaceColors,
		side: 2,
		alphaTest: 0.05,
	})
	elements.forEach(function (s) {
		var mesh = new THREE.Mesh(
			new THREE.BoxGeometry(s.size[0], s.size[1], s.size[2]),
			mat
		)
		if (s.origin) {
			mesh.position.set(s.origin[0], s.origin[1], s.origin[2])
			mesh.geometry.translate(-s.origin[0], -s.origin[1], -s.origin[2])
		}
		mesh.geometry.translate(s.pos[0], s.pos[1], s.pos[2])
		if (s.rotation) {
			mesh.rotation.setFromDegreeArray(s.rotation)
		}
		if (s.model) {
			mesh.r_model = s.model
		}

		function getUVArray(face) {
			var arr = [
				[face.uv[0] / 16, 1 - face.uv[1] / 16],
				[face.uv[2] / 16, 1 - face.uv[1] / 16],
				[face.uv[0] / 16, 1 - face.uv[3] / 16],
				[face.uv[2] / 16, 1 - face.uv[3] / 16],
			]
			var rot = face.rotation + 0
			while (rot > 0) {
				let a = arr[0]
				arr[0] = arr[2]
				arr[2] = arr[3]
				arr[3] = arr[1]
				arr[1] = a
				rot = rot - 90
			}
			return arr
		}

		for (var face in s) {
			if (s.hasOwnProperty(face) && s[face].uv !== undefined) {
				var fIndex = 0
				switch (face) {
					case 'north':
						fIndex = 10
						break
					case 'east':
						fIndex = 0
						break
					case 'south':
						fIndex = 8
						break
					case 'west':
						fIndex = 2
						break
					case 'up':
						fIndex = 4
						break
					case 'down':
						fIndex = 6
						break
				}
				let uv_array = getUVArray(s[face])
				mesh.geometry.attributes.uv.array.set(
					uv_array[0],
					fIndex * 4 + 0
				) // 0,1
				mesh.geometry.attributes.uv.array.set(
					uv_array[1],
					fIndex * 4 + 2
				) // 1,1
				mesh.geometry.attributes.uv.array.set(
					uv_array[2],
					fIndex * 4 + 4
				) // 0,0
				mesh.geometry.attributes.uv.array.set(
					uv_array[3],
					fIndex * 4 + 6
				) // 1,0
				mesh.geometry.attributes.uv.needsUpdate = true
			}
		}
		mesh.geometry.elementsNeedUpdate = true

		root.add(mesh)
	})
	return root
}

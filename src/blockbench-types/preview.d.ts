interface AnglePreset {
    position: ArrayVector3
    target?: ArrayVector3
    rotation?: ArrayVector3
    projection: 'unset' | 'orthographic' | 'perspective'
    zoom?: number
    focal_length?: number
    lockedAngle?: number
}

interface PreviewOptions {
    id: string
    antialias?: boolean
}

class Preview extends Deletable {
    constructor(options: PreviewOptions)

    id: string
    canvas: HTMLCanvasElement
    height: number
    width: number
    node: HTMLElement
    /**
     * True if the preview is in orthographic camera mode
     */
    isOrtho: boolean
    /**
     * Angle, when in a specific side view
     */
    angle: null | number
    readonly camera: THREE.PerspectiveCamera | THREE.OrthographicCamera
    camPers: THREE.PerspectiveCamera
    camOrtho: THREE.OrthographicCamera
    controls: object
    annotations: object
    renderer: THREE.WebGLRenderer
    background: {
        name: string
        image: any
        size: number
        x: number
        y: number
        lock: boolean
    }
    raycaster: THREE.Raycaster

    raycast(event: MouseEvent): false | {
        type: 'keyframe' | 'vertex' | 'cube'
        event: Event
        cube?: Cube
        intersects?: object[]
        face?: string
        vertex: any
        keyframe: Keyframe
    }
    render(): void
    setProjectionMode(orthographic: boolean): this
    setFOV(fov: number): void
    setLockedAngle(angle: number): this

    loadAnglePreset(angle_preset: AnglePreset): this
    /**
     * Opens a dialog to create and save a new angle preset
     */
    newAnglePreset(): this

    getFacingDirection(): 'north' | 'south' | 'east' | 'west'
    getFacingHeight(): 'up' | 'middle' | 'down'

    occupyTransformer(): this
    showContextMenu(event: Event | HTMLElement): this



    /**
     * List of all previews
     */
    static all: Preview[]
    /**
     * The last used preview
     */
    static selected: Preview
}

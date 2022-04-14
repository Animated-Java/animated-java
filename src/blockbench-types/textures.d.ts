/// <reference types="three" />

interface TextureData {
	path?: string
	name?: string
	folder?: string
	namespace?: string
	id?: string
    particle?: boolean
    visible?: boolean
    mode?: string
    saved?: boolean
    keep_size?: boolean
    source?: string
}
interface TextureEditOptions {
    /**
     * Edit method. 'canvas' is default
     */
    method?: 'canvas' | 'jimp'
    /**
     * Name of the undo entry that is created
     */
    edit_name?: string
    /**
     * Whether to use the cached canvas/jimp instance
     */
    use_cache?: boolean
    /**
     * If true, no undo point is created. Default is false
     */
    no_undo?: boolean
    /**
     * If true, the texture is not updated visually
     */
    no_update?: boolean
}

declare class Texture {
    constructor(data: TextureData, uuid?: string);
    readonly frameCount: number | undefined;
    readonly display_height: number;
    readonly ratio: number;

    getErrorMessage(): string;
    extend(data: TextureData): this;
    /**
     * Loads the texture from it's current source
     * @param cb Callback function
     */
    load(cb?: () => {}): this;
    fromJavaLink(link: string, path_array: string[]): this;
    fromFile(file: {name: string, content?: string, path: string}): this;
    fromPath(path: string): this;
    fromDataURL(data_url: string): this;
    fromDefaultPack(): true | undefined;
    /**
     * Loads the default white error texture
     * @param error_id Sets the error ID of the texture
     */
    loadEmpty(error_id?: number): this;

    updateSource(dataUrl: string): this;
    updateMaterial(): this;

    /**
     * Opens a dialog to replace the texture with another file
     * @param force If true, no warning appears of the texture has unsaved changes
     */
    reopen(force: boolean): void;
    /**
     * Reloads the texture. Only works in the desktop app
     */
    reloadTexture(): void;
    getMaterial(): THREE.MeshLambertMaterial;
    select(event?: Event): this;
    /**
     * Adds texture to the textures list and initializes it
     * @param undo If true, an undo point is created
     */
    add(undo?: boolean): any;
    /**
     * Removes the texture
     * @param no_update If true, the texture is silently removed. The interface is not updated, no undo point is created
     */
    remove(no_update?: boolean): void;
    toggleVisibility(): this;
    enableParticle(): this;
    /**
     * Enables 'particle' on this texture if it is not enabled on any other texture
     */
    fillParticle(): this;
    /**
     * Applies the texture to the selected elements
     * @param all If true, the texture is applied to all faces of the elements. If 'blank', the texture is only applied to blank faces
     */
    apply(all: true | false | 'blank'): this;
    /**
     * Shows the texture file in the file explorer
     */
    openFolder(): this;
    /**
     * Opens the texture in the configured image editor
     */
    openEditor(): this;
    showContextMenu(event: MouseEvent): void;
    openMenu(): void;
    resizeDialog(): this;
    /**
     * Scroll the texture list to this texture
     */
    scrollTo(): void;
    save(as: any): this;
    /**
     * Returns the content of the texture as a base64 encoded string
     */
    getBase64(): string;
    /**
     * Wrapper to do edits to the texture. 
     * @param callback 
     * @param options Editing options
     */
    edit(callback: (instance: HTMLCanvasElement | object) => void | HTMLCanvasElement, options: TextureEditOptions): void;
    menu: Menu

    static all: Texture[]
    static getDefault: () => Texture
}
/**
 * Saves all textures
 * @param lazy If true, the texture isn't saved if it doesn't have a local file to save to
 */
declare function saveTextures(lazy?: boolean): void;
/**
 * Update the draggable/sortable functionality of the texture list
 */
declare function loadTextureDraggable(): void;
/**
 * Unselect all textures
 */
declare function unselectTextures(): void;

/**
 * Handles playback of animated textures
 */
declare namespace TextureAnimator {
    const isPlaying: boolean
    const interval: any
    function start(): void
    function stop(): void
    function toggle(): void
    function updateSpeed(): void
    function nextFrame(): void
    function reset(): void
    function updateButton(): void
}
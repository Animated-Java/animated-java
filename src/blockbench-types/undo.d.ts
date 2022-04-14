interface UndoAspects {
    selection?: boolean
    elements?: OutlinerElement[]
    outliner?: boolean
    group?: Group
    textures?: Texture[]
    texture_order?: boolean
    selected_texture?: boolean
    settings?: {}
    uv_mode?: boolean
    animations?: Animation[]
    keyframes?: Keyframe[]
    display_slots?: string[]
    exploded_view?: boolean
}
type UndoSave = {
    aspects: UndoAspects
    selection?: []
    selection_group?: UUID
    elements?: {}
    outliner?: []
    group?: {}
    textures?: {}
    texture_order?: UUID[]
    selected_texture?: UUID | null
    settings?: {}
    uv_mode?: {
        box_uv: boolean
        width: number
        height: number
    }
    animations?: {}
    keyframes?: {}
    display_slots?: {}
    exploded_views?: boolean
}
type UndoEntry = {
    before: UndoSave
    post: UndoSave
    action: string
    time: number
}

declare class UndoSystem {
    constructor();
    initEdit(aspects: UndoAspects): any;
    finishEdit(action: string, aspects?: UndoAspects): {
        before: any;
        post: any;
        action: any;
        time: number;
    };
    cancelEdit(): void;
    addKeyframeCasualties(keyframes: Keyframe[]): void;
    undo(remote?: boolean): void;
    redo(remote?: boolean): void;
    remoteEdit(entry: UndoEntry): void;
    loadSave(save: UndoSave, reference: UndoSave, mode?: string): void;
}
declare let Undo: UndoSystem;

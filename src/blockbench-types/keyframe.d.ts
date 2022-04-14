declare class KeyframeDataPoint {
    constructor(keyframe: Keyframe);
    extend(data: any): void;
    getUndoCopy(): {};
}

interface KeyframeOptions {

}
type axisLetter = 'x' | 'y' | 'z'


declare class Keyframe {
    constructor(options: KeyframeOptions, uuid: any);
    extend(data: KeyframeOptions): this;
    get(axis: axisLetter, data_point?: number): any;
    calc(axis: axisLetter, data_point?: number): any;
    set(axis: axisLetter, value: any, data_point?: number): this;
    offset(axis: axisLetter, amount: any, data_point?: number): any;
    flip(axis: axisLetter): this;
    getLerp(other: any, axis: axisLetter, amount: any, allow_expression: any): any;
    getCatmullromLerp(before_plus: Keyframe, before: Keyframe, after: Keyframe, after_plus: Keyframe, axis: axisLetter, alpha: number): any;
    getArray(data_point?: number): any[];
    getFixed(data_point?: number): any;
    getTimecodeString(): string;
    compileBedrockKeyframe(): object;
    replaceOthers(save: any): void;
    select(event: any): this;
    callPlayhead(): this;
    showContextMenu(event: Event): this;
    remove(): void;
    forSelected(callback: (keyframe: Keyframe) => void, undo_tag: any): this[];
    getUndoCopy(save: any): {
        animator: any;
        channel?: string | null;
        data_points: object[];
    };
}
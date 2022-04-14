interface CustomMenuItem {
    name: string
}
type MenuItem = CustomMenuItem | Action | string;

/**
 * Creates a new context menu
 */
declare class Menu extends Deletable {
    constructor(template: MenuItem[])

    /**
     * Opens the menu somewhere
     * @param position Position where to open the menu. Can be a mouse event, or a node that the menu is spawned below.
     * @param context Context for the click events inside the menu
     */
    open(position: MouseEvent | HTMLElement, context?: any): this
    /**
     * Closes the menu if it's open
     */
    hide(): this
    /**
     * Adds an action to the menu structure
     * @param action Action to add
     * @param path Path pointing to the location. Use the ID of each level of the menu, or index within a level, separated by a point. For example, `export.0` places the action at the top position of the Export submenu.
     */
    addAction(action: Action, path?: string): void
    /**
     * 
     * @param path Path pointing to the location. Use the ID of each level of the menu, or index within a level, or item ID, separated by a point. For example, `export.export_special_format` removes the action "Export Special Format" from the Export submenu.
     */
    removeAction(path: string): void
}

/**
 * Creates a new menu in the menu bar
 */
declare class BarMenu extends Menu {
    constructor(id: string, structure: MenuItem[], condition?: any)
    /**
     * Visually highlights an action within the menu, until the user opens the menu
     */
    highlight(action: Action): void
}

declare namespace MenuBar {
    const menus: {
        file: Menu
        edit: Menu
        transform: Menu
        display: Menu
        filter: Menu
        animation: Menu
        view: Menu
        help: Menu
        [id: string]: Menu
    }
    /**
     * Adds an action to the menu structure
     * @param action Action to add
     * @param path Path pointing to the location. Use the ID of each level of the menu, or index within a level, separated by a point. For example, `file.export.0` places the action at the top position of the Export submenu in the File menu.
     */
    function addAction(action: Action, path?: string): void
    /**
     * 
     * @param path Path pointing to the location. Use the ID of each level of the menu, or index within a level, or item ID, separated by a point. For example, `export.export_special_format` removes the action "Export Special Format" from the Export submenu.
     */
    function removeAction(path: string)
    /**
     * Update the menu bar
     */
    function update(): void
}
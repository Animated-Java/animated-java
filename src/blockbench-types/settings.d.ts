declare const settings: {
    [id: string]: Setting
};

interface SettingOptions {
    name: string
    type?: 'number' | 'string' | 'boolean' | 'password' | 'select' | 'click'
    value: boolean | number | string
    condition?: any
    category: string
    description?: string
    //launch_setting?: boolean
    min?: number
    max?: number
    step?: number
    icon?: string
    click?: () => void
    options?: {
        [id: string]: string
    }
    onChange?: (value: any) => void
}

declare class Setting extends Deletable {
    constructor(id: string, options: SettingOptions);

}
declare const Settings: {
    structure: {};
    stored: {};
    /**
     * Opens the settings dialog
     * @param options 
     */
    open(options?: Partial<{
        search: string
        tab: 'setting' | 'keybindings' | 'layout_settings' | 'credits'
    }>): void;
    /**
     * Save all settings to the local storage
     */
    saveLocalStorages(): void;
    /**
     * Save the settings and apply changes
     */
    save(): void;
    /**
     * Returns the value of the specified setting
     */
    get(setting_id: string): any;
};
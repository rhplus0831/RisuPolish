// @ts-ignore
import {default_polish, default_polish_kr} from "../res/defaultPrompt";

function getMyArgument(name: string) {
    // @ts-ignore
    return globalThis.__pluginApis__.getArg(`RisuInputPolish::${name}`)
}

function setMyArgument(name: string, value: string) {
    // @ts-ignore
    return globalThis.__pluginApis__.setArg(`RisuInputPolish::${name}`, value)
}

export function getBoolean(name: string, defaultValue: boolean) {
    const value = getMyArgument(name);
    // 값이 비어있으면 true
    if (!value) {
        return defaultValue;
    }

    return value == 1 || value == "1" || value.toString().toLowerCase() == "true";
}

export function useAxModel(): boolean {
    return getBoolean('use_ax_model', true);
}

export function setUseAxModel(value: boolean): void {
    return setMyArgument('use_ax_model', value ? 'true' : 'false')
}

export function getModuleToggle(name: string, defaultValue: string): string {
    const value = getGlobalChatVar(name)
    if(value == "null") {
        return defaultValue;
    }
    return value;
}

export function getModuleToggleBoolean(name: string, defaultValue: boolean): boolean {
    const value = getGlobalChatVar(name)
    if(value == "null") {
        return defaultValue;
    }
    return value == "1";
}
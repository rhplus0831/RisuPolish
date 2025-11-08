import {SlicedChat} from "./risu";

let activeRequests = 0;
let debounceTimer: number | undefined = undefined;


async function onAllRequestsFinished() {

}

const beforeFunc = (content: any, mode: any) => {
    if (debounceTimer) {
        window.clearTimeout(debounceTimer);
        debounceTimer = undefined;
    }
    activeRequests++;
    return content;
}

addRisuReplacer('beforeRequest', beforeFunc)

const afterFunc = (content: any, mode: any) => {
    activeRequests--;

    if (activeRequests <= 0) {
        activeRequests = 0;
        if (debounceTimer) {
            window.clearTimeout(debounceTimer);
        }
        debounceTimer = window.setTimeout(() => {
            if (activeRequests <= 0) {
                onAllRequestsFinished();
            }
            debounceTimer = undefined;
        }, 5000)
    }

    return content;
}

addRisuReplacer('afterRequest', afterFunc)

export function unloadReplacer() {
    removeRisuReplacer('beforeRequest', beforeFunc)
    removeRisuReplacer('afterRequest', afterFunc)
}

export {};
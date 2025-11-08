import {unloadReplacer} from "./lib/automatic";
import {unloadButton} from "./lib/ElementInjection";

export * from './lib/ElementInjection';

onUnload(() => {
    unloadButton()
    unloadReplacer()
})
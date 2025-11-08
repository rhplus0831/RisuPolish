declare function getDatabase(): SlicedDatabase;

declare function setDatabase(data: any): void;

declare function getChar(): SlicedCharacter;

declare function setChar(char: SlicedCharacter): void;

declare function addRisuReplacer(name: string, func: ReplacerFunction)

declare function removeRisuReplacer(name: string, func: ReplacerFunction)

declare function onUnload(callback: () => void);

declare async function requestChatData(argument: RequestDataArgument, model: ModelModeExtended, abortSignal: null): Promise<RequestDataResponse>;

declare function risuChatParser(data: string, argument: {
    // chatIndex
    chatID?: number
    db?: Database
    chara?: string | SlicedCharacter
    rmVar?: boolean,
    var?: { [key: string]: string }
    tokenizeAccurate?: boolean
    consistantChar?: boolean
    visualize?: boolean,
    role?: string
    runVar?: boolean
    functions?: Map<string, { data: string, arg: string[] }>
    callStack?: number
    cbsConditions?: CbsConditions
} = {})

declare function getModuleLorebooks();

declare async function loadLoreBookV3Prompt(): Promise<{actives: {depth: number, pos: string, prompt: string, role: "system" | "user" | "assistant", order: number, tokens: number, priority: number, source: string, inject: {operation: "append" | "prepend" | "replace", location: string, param: string, lore: boolean} | null}[], matchLog: {}[]}>;

declare async function tokenize(data:string): Promise<number>;

declare function getGlobalChatVar(key:string): string;

declare async function alertSelect(msg:string[], display?:string): Promise<number>;
// LICENSED: https://github.com/kwaroran/RisuAI/blob/main/LICENSE

export interface SlicedMessage {
    chatId: string,
    data: string
}

export interface SlicedChat {
    id: string
    name: string
    message: SlicedMessage[],
    fmIndex: number
}

export interface SlicedCharacter {
    chaId: string
    chats: SlicedChat[],
    name: string,
    chatPage: number,
    firstMessage: string,
    alternateGreetings: string[]
}

export interface IndexedCharacter extends SlicedCharacter {
    index: number
}

/**
 * 프로젝트용으로 저장해야할 부분만 정의한 데이터
 */
export interface SlicedDatabase {
    characters: SlicedCharacter[];
    characterOrder: any[];
    loreBook: any[];
    personas: any[];
    modules: any[];
    statics: any;
    statistics: any;
    botPresets: any[];
    maxContext: number
}

export interface OpenAIChat {
    role: 'system' | 'user' | 'assistant' | 'function'
    content: string
    memo?: string
    name?: string
    removable?: boolean
    attr?: string[]
    multimodals?: MultiModal[]
    thoughts?: string[]
    cachePoint?: boolean
}

export interface MultiModal {
    type: 'image' | 'video' | 'audio'
    base64: string,
    height?: number,
    width?: number
}

export type ReplacerFunction = (content: OpenAIChat[], type: string) => OpenAIChat[] | Promise<OpenAIChat[]>

export interface RequestDataArgument {
    formated: OpenAIChat[]
    bias: { [key: number]: number }
    biasString?: [string, number][]
    currentChar?: undefined
    temperature?: number
    maxTokens?: number
    PresensePenalty?: number
    frequencyPenalty?: number,
    useStreaming?: boolean
    isGroupChat?: boolean
    useEmotion?: boolean
    continue?: boolean
    chatId?: string
    noMultiGen?: boolean
    schema?: string
    extractJson?: string
    imageResponse?: boolean
    previewBody?: boolean
    staticModel?: string
    escape?: boolean
    tools?: undefined
    rememberToolUsage?: boolean
}

export type ModelModeExtended = 'model' | 'submodel' | 'memory' | 'emotion' | 'otherAx' | 'translate'

export type RequestDataResponse = {
    type: 'success' | 'fail'
    result: string
    noRetry?: boolean,
    special?: {
        emotion?: string
    },
    failByServerError?: boolean
    model?: string
}

export interface LoreBook {
    key: string
    secondkey: string
    insertorder: number
    comment: string
    content: string
    mode: 'multiple' | 'constant' | 'normal' | 'child' | 'folder',
    alwaysActive: boolean
    selective: boolean
    extentions?: {
        risu_case_sensitive: boolean
    }
    activationPercent?: number
    loreCache?: {
        key: string
        data: string[]
    },
    useRegex?: boolean
    bookVersion?: number
    id?: string
    folder?: string
}

export async function processLore(char: SlicedCharacter) {
    const fullLoreBooks = (await loadLoreBookV3Prompt()).actives
    const maxContext = getDatabase().maxContext
    if (maxContext < 0) {
        return JSON.stringify([])
    }

    let totalTokens = 0
    let loreBooks: string[] = []

    for (const book of fullLoreBooks) {
        const parsed = risuChatParser(book.prompt, {chara: char}).trim()
        if (parsed.length === 0) {
            continue
        }

        const tokens = await tokenize(parsed)

        if (totalTokens + tokens > maxContext) {
            break
        }
        totalTokens += tokens
        loreBooks.push(parsed)
    }

    return loreBooks.join("\n")
}
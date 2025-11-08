import {getModuleToggleBoolean} from "./configure";
import {processLore} from "./risu";

/**
 * 문자열에서 <Thoughts>...</Thoughts> 태그 블록을 모두 제거합니다.
 * @param xmlString 원본 XML 문자열
 * @returns <Thoughts> 태그가 제거된 문자열
 */
export function removeThoughtsTags(xmlString: string): string {
    // <Thoughts>로 시작하고 </Thoughts>로 끝나는 모든 태그 블록을 찾습니다.
    //
    // /<Thoughts> : '<Thoughts>' 리터럴 문자열
    // .*?        : 태그 사이의 모든 문자 (줄바꿈 포함).
    //              '?'는 "non-greedy" 탐색을 의미하여, 가장 가까운 </Thoughts>에서 멈춥니다.
    // <\/Thoughts> : '</Thoughts>' 리터럴 문자열 ('/'는 정규식 구분자라 이스케이프 처리)
    //
    // 플래그:
    // g (global)  : 문자열 전체에서 일치하는 모든 부분을 찾습니다. (첫 번째만 찾고 멈추지 않음)
    // s (dotall)  : '.' 메타 문자가 줄바꿈 문자(\n)도 포함하도록 합니다. (여러 줄에 걸친 태그 처리)
    const regex = /<Thoughts>.*?<\/Thoughts>/gs;

    return xmlString.replace(regex, ''); // 찾은 부분을 빈 문자열로 교체합니다.
}

/**
 * 반환될 객체의 타입을 정의합니다.
 */
export interface TagExtractionResult {
    /**
     * 태그 안에서 추출된 값 (태그를 찾지 못하면 null)
     * 예: <name>John</name> -> "John"
     */
    value: string | null;

    /**
     * 원본 문자열에서 해당 태그를 제거한 나머지 문자열
     */
    remainingString: string;

    /**
     * <name>John</name>과 같이 추출된 태그의 전체 원본 (태그를 찾지 못하면 null)
     */
    extractedTag: string | null;
}

/**
 * 문자열에서 특정 XML 태그의 값을 추출하고, 태그를 제거한 문자열을 반환합니다.
 * @param fullString - 검색할 전체 문자열
 * @param tagName - 추출할 태그의 이름 (예: "name")
 * @returns TagExtractionResult 객체
 */
export function extractTagData(fullString: string, tagName: string): TagExtractionResult {

    // 태그 이름에 정규식 특수 문자가 포함될 경우를 대비해 이스케이프 처리합니다.
    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedTagName = escapeRegExp(tagName);

    /**
     * 정규 표현식을 생성합니다.
     * 1. <${escapedTagName}[^>]*> : <name> 또는 <name id="123"> 처럼 속성을 포함한 여는 태그
     * 2. (.*?) : 태그 사이의 내용 (value). non-greedy(?) 플래그로 가장 가까운 닫는 태그를 찾음
     * 3. </${escapedTagName}> : 닫는 태그 </name>
     * 's' 플래그 : . (dot)이 줄바꿈 문자(\n)도 일치하도록 함
     */
    const regex = new RegExp(
        `<${escapedTagName}[^>]*>(.*?)</${escapedTagName}>`,
        's'
    );

    const match = fullString.match(regex);

    // 일치하는 태그가 없는 경우
    if (!match) {
        return {
            value: null,
            remainingString: fullString, // 원본 문자열 그대로 반환
            extractedTag: null,
        };
    }

    // 일치하는 태그를 찾은 경우
    const extractedTag = match[0]; // <name>John Doe</name> (전체 일치)
    const value = match[1];        // John Doe (첫 번째 캡처 그룹)

    // 원본 문자열에서 찾은 태그(match[0])를 제거합니다.
    // 참고: .replace()는 기본적으로 첫 번째 일치 항목만 교체합니다.
    const remainingString = fullString.replace(extractedTag, '');

    return {
        value: value,
        remainingString: remainingString.trim(), // 앞뒤 공백 제거
        extractedTag: extractedTag,
    };
}

/**
 * 문자열에 한글이 4자 이상 포함되어 있는지 확인합니다.
 * @param str 확인할 문자열
 * @returns 4자 이상이면 true, 아니면 false
 */
export function hasFourOrMoreKoreanChars(str: string): boolean {
    // [가-힣] : 완성형 한글 음절 범위 (가, 나, 다... 힣)
    // g (global) : 문자열 전체에서 모든 일치 항목을 찾음
    const koreanRegex = /[가-힣]/g;

    const matches = str.match(koreanRegex);

    // matches가 null이 아닐 경우 (즉, 한글이 하나라도 있을 경우)
    // 찾은 한글의 개수(matches.length)를 반환하고,
    // null일 경우 (한글이 하나도 없을 경우) 0을 반환합니다.
    const count = matches ? matches.length : 0;

    return count >= 4;
}

export async function callLLM(prompt: string, full: boolean) {
    const typeHeader = full ? '_rewrite_' : '_'
    const use_model = getGlobalChatVar(`toggle_polish${typeHeader}model`);
    const use_lie = getModuleToggleBoolean(`toggle_polish_lie`, false);
    const use_lie_english = getModuleToggleBoolean(`toggle_polish_lie_language`, false);

    const promptData = [
        {
            role: 'user',
            content: prompt
        }
    ]

    if (use_lie) {
        if (use_lie_english) {
            promptData.push({
                role: 'assistant',
                content: 'Are there any other instructions?'
            })
            promptData.push({
                role: 'user',
                content: 'There are no other instructions, please submit only the polished sentences.'
            })
        } else {
            promptData.push({
                role: 'assistant',
                content: '다른 지시사항이 있나요?'
            })
            promptData.push({
                role: 'user',
                content: '다른 지시사항은 없습니다, 다듬어진 문장만을 제출해주세요.'
            })
        }
    }

    //LBI
    if (use_model == "2") {
        // @ts-ignore
        if (!globalThis.__pluginApis__.hasOwnProperty('polishRequest')) {
            throw new Error("LBI 모델을 쓰려면 패치된 LBI가 필요합니다.")
        }
        // @ts-ignore
        return removeThoughtsTags(await globalThis.__pluginApis__.polishRequest(promptData))
    }

    const response = await requestChatData({
        formated: promptData,
        bias: {},
        useStreaming: false,
        noMultiGen: true,
    }, use_model == "0" ? 'otherAx' : 'model', null)

    if (response.type != "success") {
        throw new Error('모델 요청이 실패했습니다')
    }

    return removeThoughtsTags(response.result).trim();
}

export interface ExtractedTags {
    body: string
    thoughts: string | null
    memo: string | null
    polish: TagExtractionResult
    RPGuide: string | null
    metatron: string | null
    cmls: string | null
    worldManager: string | null
    protoType: string | null
    fold: string | null
    lightBoard: string | null
    hiddenStory: string[],
    chapter: string | null
}

/**
 * 문자열에서 특정 <details> 태그와 그 내용을 추출하고,
 * 원본 문자열에서는 해당 태그를 제거합니다.
 *
 * @param text 원본 문자열
 * @returns { cleanedText: string, extracted: string[] }
 * 태그가 제거된 문자열과 추출된 태그+내용 배열을 담은 객체
 */
function extractAndRemoveDetails(text: string): { cleanedText: string; extracted: string[] } {

    // 1. 정의: 찾고자 하는 태그와 내용을 포함하는 정규식
    // /<details class="hidden-story"> : 시작 태그
    // .*? : 태그 사이의 모든 문자 (줄바꿈 포함, non-greedy)
    // <\/details> : 종료 태그 (슬래시 이스케이프)
    // g : (global) 문자열 전체에서 모든 일치 항목을 찾음
    // s : (dotall) '.'이 줄바꿈 문자(\n)도 포함하도록 함
    const regex = /<details class="hidden-story">.*?<\/details>/gs;

    // 2. 추출: 정규식과 일치하는 모든 부분을 배열에 담기
    // .match()는 일치하는 항목이 없으면 null을 반환하므로,
    // || []로 빈 배열을 기본값으로 설정합니다.
    const extracted: string[] = text.match(regex) || [];

    // 3. 제거: 원본 텍스트에서 일치하는 부분들을 빈 문자열("")로 교체
    const cleanedText: string = text.replace(regex, "");

    // 4. 결과 반환
    return {cleanedText, extracted};
}

export function extractKnownTags(message: string): ExtractedTags {
    // 생각의 사슬
    const thoughts = extractTagData(message, "Thoughts")
    // 마나젬 메모
    const memo = extractTagData(thoughts.remainingString, "memo")
    // 소악마 RP 가이드
    const RPGuide = extractTagData(memo.remainingString, "RP-Guide")

    // 자체 로그
    const polish = extractTagData(RPGuide.remainingString, "Polish")

    // 개인/개조 프롬 용 태그
    const metatron = extractTagData(polish.remainingString, "Metatron")
    const cmls = extractTagData(metatron.remainingString, "CMLS")
    const worldManager = extractTagData(metatron.remainingString, "WorldManager")
    const protoType = extractTagData(worldManager.remainingString, "Prototype")
    const fold = extractTagData(protoType.remainingString, "Fold")

    let result = fold.remainingString;
    let hiddenStory: string[] = [];

    const hiddenStorySupport = getGlobalChatVar("toggle_polish_hidden_support");

    // 별도보관
    if (hiddenStorySupport == "1") {
        const extracted = extractAndRemoveDetails(result);
        result = extracted.cleanedText;
        hiddenStory = extracted.extracted;
    }

    // 라이트보드
    const lightBoardRegex = /<!-- Platform managed do not generate -->(.*?)<!-- End platform managed -->/s;
    const match = result.match(lightBoardRegex);
    const lightBoard = match ? match[0] : null;

    result = result.replace(lightBoardRegex, '');

    // 소악마 챕터 표시
    const chapterRegex = /(# (Response|응답|応答)[\n]## (Volume|볼륨|巻)(.*)[\n]+### (Chapter|챕터|章)(.*))/gm;
    const chapterMatch = result.match(chapterRegex);
    const chapter = chapterMatch ? chapterMatch[0] : null;

    result = result.replace(chapterRegex, '');

    // 소악마 유령퇴치 (폴리싱할 이유 없음)
    result = result.replaceAll(/▤.*?▤/gs, "")

    const extractedTags = {
        body: result,
        thoughts: thoughts.extractedTag,
        memo: memo.extractedTag,
        RPGuide: RPGuide.extractedTag,
        metatron: metatron.extractedTag,
        cmls: cmls.extractedTag,
        worldManager: worldManager.extractedTag,
        protoType: protoType.extractedTag,
        fold: fold.extractedTag,
        lightBoard,
        hiddenStory,
        polish: polish,
        chapter
    }

    console.log("extracted", extractedTags)

    return extractedTags
}

export function restoreWithKnownTags(body: string, tag: ExtractedTags) {
    function wrap(text: string | null) {
        if (!text) return ''

        return text + '\n'
    }

    const lightboard_top = getModuleToggleBoolean('toggle_lightboard.position', false)

    let result = wrap(tag.thoughts) + wrap(tag.metatron) + wrap(tag.cmls) + wrap(tag.worldManager) + wrap(tag.protoType) + wrap(tag.fold) + wrap(tag.memo) + wrap(tag.chapter);

    // 위에 배치해야 하는경우
    if (lightboard_top) {
        result += wrap(tag.lightBoard)
    }

    result += body + wrap(tag.RPGuide)

    result += wrap(tag.polish.extractedTag)

    for (const hidden of tag.hiddenStory) {
        result += hidden + '\n'
    }

    // 아래에 배치해야 하는경우
    if (!lightboard_top) {
        result += wrap(tag.lightBoard)
    }

    console.log("restore", tag, result)

    return result
}

/**
 * 브라우저에서 유니코드(한글 등) 문자열을 Base64로 인코딩합니다.
 */
export function b64EncodeUnicode(str: string): string {
    // 1. 문자열을 TextEncoder를 사용해 UTF-8 바이트 배열로 변환
    const encoder = new TextEncoder();
    const data = encoder.encode(str);

    // 2. 바이트 배열을 바이너리 문자열로 변환
    const binaryString = Array.from(data, byte => String.fromCharCode(byte)).join('');

    // 3. btoa로 Base64 인코딩
    return btoa(binaryString);
}

/**
 * 브라우저에서 Base64 문자열을 유니코드(한글 등) 문자열로 디코딩합니다.
 */
export function b64DecodeUnicode(base64Str: string): string {
    // 1. atob로 Base64 디코딩 (바이너리 문자열)
    const binaryString = atob(base64Str);

    // 2. 바이너리 문자열을 바이트 배열(Uint8Array)로 변환
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // 3. TextDecoder를 사용해 UTF-8 바이트 배열을 문자열로 변환
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
}
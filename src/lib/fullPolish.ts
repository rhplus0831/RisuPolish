import {LoreBook, processLore, SlicedMessage} from "./risu";
import {getModuleToggleBoolean} from "./configure";
import {b64EncodeUnicode, callLLM, extractKnownTags, extractTagData, restoreWithKnownTags} from "./utils";

export async function fullPolish(element: HTMLElement) {
    const messageChatId = element.dataset.chatId;
    const textBlock = element.querySelector<HTMLSpanElement>(".chattext")
    if (!textBlock) return;
    const parent = textBlock.parentElement;
    if (!parent) return;
    // 이미 폴리싱 중인경우
    if (parent.querySelector("#po-indicator") != null) return;

    textBlock.style.opacity = '0.5'
    textBlock.style.pointerEvents = 'none'
    const indicator = document.createElement('div')
    indicator.id = "po-indicator"
    indicator.className = "chattext"

    const indicatorP = document.createElement('p')
    indicatorP.innerText = '문장을 다듬고 있습니다...'

    indicator.append(indicatorP)

    parent.insertBefore(indicator, textBlock)

    try {
        const char = getChar()
        const holdenPage = char.chatPage;
        const currentChat = char.chats[char.chatPage]

        const loreBooks: LoreBook[] = [...currentChat?.localLore ?? [], ...char.globalLore, ...getModuleLorebooks()]

        let prompt = ''

        for (const lorebook of loreBooks) {
            if (lorebook.comment == 'PPolish_다시쓰기프롬프트') {
                prompt = risuChatParser(lorebook.content, {chara: char})
            }
        }

        if (!prompt) {
            throw new Error("다시쓰기 프롬프트가 없습니다.")
        }

        let messageIndex = -1;

        for (let i = 0; i < currentChat.message.length; i++) {
            if (currentChat.message[i].chatId == messageChatId) {
                messageIndex = i;
                break;
            }
        }

        if (messageIndex == -1) {
            throw new Error("일치하는 메시지를 찾지 못했습니다.")
        }

        let message: SlicedMessage = currentChat.message[messageIndex];

        const use_lore = getModuleToggleBoolean("toggle_polish_rewrite_lore", false);
        let lore = ''
        if (use_lore) {
            lore = await processLore(char);
        }

        let extractedTags = extractKnownTags(message.data)

        let fullBody = message.data

        if (extractedTags.polish.value && !extractedTags.polish.value.includes("<LogPol>")) {
            const msg_do_nothing = "아무것도 하지 않기"
            const msg_revert = "로그를 지우고 원래대로 되돌리기"
            const msg_polish_original = "원래 문장을 다시 다듬기"
            const msg_polish_revised = "다듬어진 문장을 다시 다듬기"
            const selected = await alertSelect([msg_do_nothing, msg_revert, msg_polish_original, msg_polish_revised], "이미 수정기록이 있습니다, 어떻게 할까요?")
            console.log(selected)
            // 아무것도 안하기
            if (selected == 0) {
                return;
            }
            //되돌리기
            if (selected == 1) {
                message.data = extractedTags.polish.value;
                setChar(char)
                return;
            }
            // 원래 문장 다듬기
            if (selected == 2) {
                fullBody = extractedTags.polish.value;
                extractedTags = extractKnownTags(extractedTags.polish.value)
            }
            extractedTags.polish.value = null;
            extractedTags.polish.extractedTag = null;
        }

        prompt = prompt.replaceAll("__lore__", lore)
        prompt = prompt.replaceAll("__input__", extractedTags.body)

        const polished = await callLLM(prompt, true);

        const afterChar = getChar();
        if (char.chaId != afterChar.chaId || char.chatPage != holdenPage) {
            throw new Error("캐릭터나 채팅이 변경되었습니다?")
        }

        let restore = restoreWithKnownTags(polished, extractedTags);
        restore += "\n\n"
        restore += `<Polish>${fullBody}</Polish>`

        message.data = restore;
        setChar(char)
        console.log("완료")
    } catch (e: any) {
        console.log(e)
        alert(e)
    } finally {
        textBlock.style.opacity = '1'
        textBlock.style.pointerEvents = 'auto'
        indicatorP.remove()
        indicator.remove()
    }
}
// @ts-ignore
import tailwindStyles from '../../dist/main.css';
import {BaseOverlay} from "../ui/baseOverlay";
import editTemplate from '../ui/edit.html';
import {fullPolish} from "./fullPolish";

// 주입된 스타일이 중복되지 않도록 한 번만 실행
(function () {
    let style: HTMLStyleElement | null = document.getElementById('risu-po-styles') as HTMLStyleElement;
    if (!style) {
        style = document.createElement('style');
        style.id = 'risu-po-styles';
        document.head.appendChild(style);
    }
    style.innerHTML = tailwindStyles;
})();

function makeMutationObserver(callbacks: (() => void)[], targetNode: HTMLElement | undefined = undefined, config: MutationObserverInit | undefined = undefined) {
    if (!targetNode) {
        targetNode = document.body
    }
    if (!config) {
        config = {attributes: true, childList: true, subtree: true};
    }
    const innerCallback = (_: any, observer: MutationObserver) => {
        observer.disconnect()
        for (const callback of callbacks) {
            callback()
        }
        observer.observe(targetNode, config);
    };
    const observer = new MutationObserver(innerCallback);
    observer.observe(targetNode, config);
    return observer;
}


/**
 * 부모를 따라 올라가며 챗 아이디를 구합니다.
 * @param element
 */
function getMessageIdElementFromParent(element: HTMLElement | null) {
    if (!element) {
        throw new Error("채팅 아이디를 찾지 못했습니다")
    }

    // Actually, It's message ID. but risu state it as chat-id
    const chatId = element.dataset.chatId;
    if (chatId) return element;

    return getMessageIdElementFromParent(element.parentElement)
}

function makeProgressDiv() {
    const textarea = document.querySelector('.text-input-area') as HTMLTextAreaElement | null;
    const messageContainer = textarea?.parentElement?.parentElement;
    if (!messageContainer) {
        // TODO: Notify It?
        return;
    }
    const progressDiv = document.createElement('div')
    progressDiv.className = "po-flex po-w-full po-h-8"
    progressDiv.innerText = '작업중...'

    messageContainer.insertBefore(progressDiv, messageContainer.childNodes[1])

    return progressDiv;
}

async function putPolishButton() {
    const chats = document.body.querySelectorAll<HTMLDivElement>('.chat-message-container');
    if (!chats) return;

    for (const chat of chats) {
        const editButton = chat.querySelector<HTMLButtonElement>(".button-icon-edit")
        if (!editButton) continue;

        const parent = editButton.parentElement;
        if (!parent) return;

        let polishButton = parent.querySelector<HTMLButtonElement>("#po-chat-polish-button")
        if (!polishButton) {
            polishButton = document.createElement('button')
            polishButton.onclick = async () => {
                try {
                    const messageId = getMessageIdElementFromParent(editButton)
                    await fullPolish(messageId)
                } catch (e: any) {
                    console.log(e)
                    alert(e)
                }
            }
        }
        polishButton.id = "po-chat-polish-button"
        polishButton.className = editButton.className;
        polishButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles-icon lucide-sparkles"><path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"/><path d="M20 2v4"/><path d="M22 4h-4"/><circle cx="4" cy="20" r="2"/></svg>`
        editButton.parentElement?.prepend(polishButton)
    }
}

const observer = makeMutationObserver([putPolishButton])

export function unloadButton() {
    observer.disconnect()
}

export {};
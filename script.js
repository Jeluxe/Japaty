const body = document.getElementsByTagName("body")[0];
const chatInput = document.querySelector("#chat-input");
const sendButton = document.querySelector("#send-btn");
const menuButton = document.querySelector("#sm-open-sidebar");
const sidebarWrapper = document.querySelector(".sidebar-wrapper");
const sidebar = document.querySelector(".sidebar");
const sidebarToggler = document.querySelector(".sidebar-toggler");
const chatContainer = document.querySelector(".chat-container");
const removeImageButtons = document.getElementsByClassName("remove-image-buttons");
const randomButton = document.querySelector("#random-btn");
const deleteButton = document.querySelector("#delete-btn");
const dropdown = document.querySelector("#dropdown")
const smDropdown = document.querySelector("#sm-dropdown");
const selectedDropdownMenuItem = document.querySelector("#selected-dropdown-menu-item");
const selectedSmDropdownMenuItem = document.querySelector("#selected-sm-dropdown-menu-item");
const dragZone = document.querySelector(".drag-zone");
const dropZone = document.querySelector(".drop-zone");
const fileUpload = document.querySelector("#image-upload");
const imageInputContainer = document.getElementsByClassName("image-input-container")[0];

let file = null;
let imageList = [];
let isSmallDevice = false;
let dropdownMenu;
let clonedPreviousElement;
let isDragging = false;
let selectedModel = { id: 4, model: "gpt-4o" };
let isFirstSidebarInit = true;
let isInputOpen = false;
let isDropdownOpen = false;
let isSidebarOpen = true;
let userMessage = null;
let selectedContentType = "text";
let chats = {};
let selectedChat = null;
let messages = [];
let prompt = null;
let imageResolution = null;
let urlArray = { text: TEXT_API, image: IMAGE_API };


const loadDataFromLocalstorage = async () => {
    const selectedChatLS = JSON.parse(localStorage.getItem("selected-chat"));
    const model = JSON.parse(localStorage.getItem("model"));
    const LSChats = JSON.parse(localStorage.getItem("chats"));
    chats = LSChats || {};

    if (model) {
        selectedModel = model;
    }

    selectedDropdownMenuItem.textContent = selectedModel.model;
    selectedSmDropdownMenuItem.textContent = selectedModel.model;

    renderSidebar({ selectedChatLS })

    if (selectedChatLS) {
        selectedChat = selectedChatLS;
    }

    handleSelectingChat(document.getElementById(selectedChat))
    render(selectedChat)
}

const render = (selectedChat) => {
    let contentText = "";
    const defaultText = `<div class="default-text">
                            <h1>Japaty</h1>
                            <p>Start a conversation and explore the power of AI.<br> Your chat history will be displayed here.</p>
                        </div>`;
    messages = [];
    if (selectedChat === null || selectedChat === "new-chat" || selectedChat === undefined) {
        contentText = defaultText;
    } else {
        messages = chats[selectedChat]?.messages;
        for (let message in messages) {
            const { role, type, content } = messages[message];
            contentText += formattedHTML({ role, type, content });
        }
    }
    chatContainer.innerHTML = contentText;
    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Scroll to bottom of the chat container
}

const saveToLocalStorage = async ({ selectedChatID = null, type = null, value = null, messages = null }) => {
    if (type === 'chat-title') {
        chats[selectedChatID].name = value;
    } else {
        if (selectedChatID === "new-chat" || selectedChatID === null) {
            let id = generateID();

            const newTitle = await createNewChat({ id, category: "Today", name: null, before: true, firstMessage: true });
            chats[id] = {
                name: newTitle,
                messages,
                created_at: Date.now(),
                edited_at: null
            };
            setSelectedChat(id);
        } else if (messages) {
            chats[selectedChatID].messages = messages;
        }
    }
    if ((type === 'chat-title' || messages !== null) && selectedChatID !== "new-chat" && selectedChatID !== null) {
        chats[selectedChatID].edited_at = Date.now();
    }

    localStorage.setItem("chats", JSON.stringify(chats));
    render(selectedChat !== selectedChatID ? selectedChat : selectedChatID);
    renderSidebar({ edited: true })
}

const createResponseBody = ({ model, selectedContentType, messages, prompt, gpt3 = false }) => {
    const defaultTextResponseProperties = {
        model,
        messages,
        max_tokens: 1480,
    }

    const defaultImageResponseProperties = {
        prompt,
        model: DALLE2_RESOLUTIONS.includes(imageResolution) ? "dall-e-2" : "dall-e-3",
        size: imageResolution ?? "1792x1024",
    }

    return JSON.stringify(selectedContentType === "text" ?
        defaultTextResponseProperties :
        defaultImageResponseProperties
    )
}

const createResponse = async ({ body }) => {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body
    }
    const response = await fetch(urlArray[selectedContentType], requestOptions);
    return response;
}

const getChatResponse = async (incomingChatDiv, selectedChatID) => {
    const messageContent = incomingChatDiv.querySelector(".message-content");
    try {
        const body = createResponseBody({
            model: selectedModel.model,
            selectedContentType,
            messages: messages.filter(message => message.type !== "image")
                .map(({ role, content }) =>
                    ({ role, content })
                ),
            prompt: userMessage
        })

        const response = await createResponse({ body })
        const data = await response.json();

        if (!response.ok) {
            console.error(data.error)
            throw new Error(`HTTP error! status: ${response.status} error: ${data.error.code}`);
        }

        let newMessage = selectedContentType === "text" ?
            data.choices[0].message.content :
            data.data[0].url;

        messages.push({
            role: "assistant",
            type: selectedContentType,
            content: selectedContentType === 'image' ?
                { alt: userMessage, image: newMessage } :
                newMessage,
        });

        if (selectedContentType === 'text') {
            newMessage = formattedMessage(newMessage);
        } else {
            newMessage = `<img src="${newMessage}" alt="${userMessage.split("img: ")[1]}" />`
        }

        if (selectedChat === selectedChatID) {
            messageContent.innerHTML = newMessage;
            highlightCode(messageContent)
        }

        saveToLocalStorage({ selectedChatID, messages })
    } catch (error) {
        messageContent.classList.add("error");
        messageContent.textContent = `${error.message}. Please try again.`;
    } finally {
        document.title = "Japaty"
        chatContainer.scrollTo(0, chatContainer.scrollHeight);
    }
}

const highlightCode = (element) => {
    element.querySelectorAll("pre code").forEach(el => hljs.highlightElement(el));
}

const copyResponse = (copyBtn, type) => {
    // Copy the text content of the response to the clipboard
    if (copyBtn.nodeName === "B") {
        navigator.clipboard.writeText(copyBtn.textContent);
    } else {
        const responseElement = type ? copyBtn.parentElement.querySelector(type) : copyBtn.parentElement.parentElement.querySelector("code");
        navigator.clipboard.writeText(!type?.includes("img") ? responseElement.textContent.trim() : responseElement.src);
        copyBtn.textContent = "done";
        setTimeout(() => copyBtn.textContent = "content_copy", 1000);
    }
}

const showTypingAnimation = () => {
    // Display the typing animation and call the getChatResponse function
    imageList = [];
    imageInputContainer.innerHTML = "";
    imageInputContainer.style.display = "none";

    createMessageElement({ role: "assistant", type: selectedContentType, content: null, loading: true })
    const lastElement = chatContainer.lastElementChild;
    getChatResponse(lastElement, selectedChat);
}

const createMessageElement = (props) => {
    const html = formattedHTML(props);
    chatContainer.innerHTML += html;
    chatContainer.scrollTo(0, chatContainer.scrollHeight);
}

const handleOutgoingChat = () => {
    try {
        userMessage = chatInput.value.trim(); // Get chatInput value and remove extra spaces
        if (!userMessage) return;

        if (selectedChat === 'new-chat' || selectedChat === null) {
            chatContainer.innerHTML = "";
        }

        selectedContentType = "text";

        if (EXTRACT_IMAGE_REGEX.test(userMessage)) {
            const foundImageResolution = userMessage.replace(EXTRACT_IMAGE_REGEX, "$1");
            userMessage = userMessage.replace(EXTRACT_IMAGE_REGEX, "$2");

            if (foundImageResolution) {
                if (!ALLOWED_RESOLUTIONS.includes(foundImageResolution)) {
                    throw new Error("The resolution that you requested is not one of the allowed resolutions:\n256x256\n512x512\n1024x1024\n1024x1792\n1792x1024\nPlease pick of these resolutions if you won\'t pick one then by default it will be 1792x1024")
                }
                imageResolution = foundImageResolution
            }

            selectedContentType = "image";
        }

        const userMessageContent = {
            role: "user",
            type: "text",
            content: [{ type: "text", text: userMessage }].concat(imageList),
        }

        let tempMessage = [...userMessageContent.content]

        messages.push(userMessageContent);

        if (selectedChat) {
            saveToLocalStorage({ selectedChatID: selectedChat })
        }

        chatInput.value = "";
        chatInput.style.height = `${initialInputHeight}px`;
        chatContainer.querySelector(".default-text")?.remove();

        if (selectedChat === 'new-chat' || selectedChat === null) {
            const html = formattedHTML({ role: "user", type: "text", content: tempMessage });
            chatContainer.innerHTML += html;
        }

        chatContainer.scrollTo(0, chatContainer.scrollHeight);
        setTimeout(showTypingAnimation, 500);
    } catch (error) {
        const html = formattedHTML({ role: "user", type: "text", content: userMessage });
        chatContainer.innerHTML += html;
        createMessageElement({ role: "assistant", type: "text", content: error.message, error: true })
    }
}

const formattedHTML = ({ role, type = "text", content = null, loading = false, error = false }) => {
    if (loading) {
        document.title = "Jpty\'s thinking"
    }

    return `
    <div class='chat ${role === "user" ? "outgoing" : "incoming"}'>
    <div class="chat-content">` +
        `<div class="chat-details ${error ? "error" : ""}">
            ${role === "user" ? `<img src="images/monica.jpg" alt="monica-img"></img>` : `<img src="images/chatbot.jpg" alt="chatbot-img"></img>`}
            <div class="message-content">` +
        `${role === "assistant" && loading && content === null ?
            `<div class="typing-animation">
                <div class="typing-dot" style="--delay: 0.2s"></div>
                <div class="typing-dot" style="--delay: 0.3s"></div>
                <div class="typing-dot" style="--delay: 0.4s"></div>
            </div>` :
            createFormattedMessage(type, content, role === "user", error)
        }</div>` +
        `<span onclick="copyResponse(this,'${type === "text" ? "div" : ".message-content img"}')" class="material-symbols-rounded copy-btn">content_copy</span>
            </div>
        </div>
    </div>`;
}

const createFormattedMessage = (type, message, isUser, error) => {
    const newDiv = document.createElement("div");

    newDiv.innerHTML = `${isUser ?
        formatUserMessage(type, message) :
        formattedMessage(message, error)}
        `;

    highlightCode(newDiv);
    return newDiv.innerHTML.trim();
}

const formatUserMessage = (type, message) => {
    message = type == "text" ? message[0].text.replace(ANGLE_BRACKET_REGEX, (match) => {
        return match === "<" ? "&lt;" : "&gt;"
    }) : message;

    return type === "text" ?
        (Array.isArray(message) ? `<div class="message-images">` +
            message.filter((_, idx) => idx !== 0).map(img => {
                return `<img src="${img.image_url.url}" />`
            }) : "") +
        `</div>` +
        `<p>${message[0].text || message}</p>` : `<img src="${message.image}" alt="${message.alt}" />`
}

const formattedMessage = (newMessage) => {
    if (newMessage?.image) {
        return `<img src="${newMessage.image}" alt="${newMessage.alt}" />`
    }

    newMessage = newMessage.replaceAll(ANGLE_BRACKET_REGEX, (match) => {
        return match === "<" ? "&lt;" : "&gt;"
    });

    newMessage = codeBlockFormatter(newMessage)

    newMessage = formatNewLine(newMessage)

    newMessage = newMessage.replaceAll(REMOVE_NEW_LINE_AFTER_PRE_TAG_REGEX, "$1");

    newMessage = newMessage.replaceAll(BOLD_REGEX, "<b>$1</b>");

    newMessage = displayColor(newMessage);

    newMessage = codeFormatter(newMessage);

    newMessage = newMessage.replaceAll(HEADING_REGEX, "<h" + "$1".length + ">$2</h" + "$1".length + ">");

    newMessage = newMessage.replaceAll(LINK_REGEX, `<a href="$2" target="_blank">$1</a> `)

    newMessage = newMessage.replaceAll(UNDERLINING_REGEX, "<u>$1</u>");

    return newMessage;
}

const handleSelectDropdownMenuItem = (e) => {
    e.preventDefault();
    e.stopPropagation();
    selectedDropdownMenuItem.textContent = e.target.textContent;
    selectedSmDropdownMenuItem.textContent = e.target.textContent;

    const id = e.target.getAttribute("id");
    selectedModel = MODELS.find(item => item.id === Number(id))
    localStorage.setItem("model", JSON.stringify(selectedModel));
    if (isDropdownOpen) {
        isDropdownOpen = false;
        dropdownMenu.classList.add("hide")
    }
    isDropdownOpen = true;
}

const createNewChat = async ({ id, name, category, before = false, selectedID = null, firstMessage = false }) => {
    const sidebarItem = document.createElement("div");
    const sidebarItemActions = document.createElement("div");
    const editButton = document.createElement("span");
    const deleteButton = document.createElement("span");
    const sidebarItemTitle = document.createElement("span");

    sidebarItem.setAttribute("id", id);
    sidebarItem.classList.add('sidebar-item');
    sidebarItemTitle.classList.add('sidebar-item-title');
    sidebarItemActions.classList.add('actions-container');
    editButton.classList.add('material-symbols-rounded', "edit-btn");
    deleteButton.classList.add('material-symbols-rounded', "delete-btn");

    editButton.textContent = "edit_square";
    deleteButton.textContent = "delete";

    if (firstMessage) {
        const messageToSummarize = { role: "user", content: messages[1].content.alt ?? messages[1].content };
        messageToSummarize.content = `summarize in 1-5 words this message: ${messageToSummarize.content}`
        delete messageToSummarize.type;

        try {
            const body = createResponseBody({ model: "gpt-3.5-turbo-0125", selectedContentType: "text", messages: [messageToSummarize], gpt3: true })

            const response = await createResponse({ body })
            const data = await response.json();

            if (data.error) throw new Error(data)

            sidebarItemTitle.textContent = data.choices[0].message.content;
            name = data.choices[0].message.content;
        } catch (error) {
            console.error(error)
        }
    } else {
        sidebarItemTitle.textContent = name;
    }

    sidebarItem.appendChild(sidebarItemTitle);
    editButton.addEventListener("click", (e) => editChatName(e));
    deleteButton.addEventListener("click", (e) => deleteChat(e));
    sidebarItemActions.appendChild(editButton)
    sidebarItemActions.appendChild(deleteButton)
    sidebarItem.appendChild(sidebarItemActions);

    if ((selectedID === id || before)) {
        sidebarItem.classList.add('selected');
    }

    const container = document.querySelector(`.sidebar-category#${category.replaceAll(" ", "-")}`)

    if (container) {
        if (before) {
            container.insertBefore(sidebarItem, container.childNodes[1]);
        } else {
            container.appendChild(sidebarItem);
        }
    }

    return name;
}

const editChatName = (e) => {
    e.stopPropagation();
    removeInputs();
    isInputOpen = true;
    const parentElement = e.target.parentElement.parentElement;

    const tempInput = document.createElement("input");
    const saveIcon = document.createElement("span");
    saveIcon.id = "save-btn";
    saveIcon.className = "material-symbols-rounded";
    saveIcon.textContent = "check";
    saveIcon.addEventListener("click", handleEdit);

    const cancelIcon = document.createElement("span");
    cancelIcon.id = "cancel-btn";
    cancelIcon.className = "material-symbols-rounded";
    cancelIcon.textContent = "close";
    cancelIcon.addEventListener("click", rerenderSidebarItem);
    clonedPreviousElement = parentElement.cloneNode(true);
    tempInput.value = parentElement.querySelector("span.sidebar-item-title").textContent || "";
    tempInput.setAttribute("autofocus", true);
    tempInput.addEventListener("click", (e) => e.stopPropagation());
    tempInput.addEventListener("input", (e) => {
        tempInput.value = e.target.value;
    });
    const actionsContainer = document.createElement("div");
    actionsContainer.classList.add("actions-container");
    actionsContainer.appendChild(saveIcon);
    actionsContainer.appendChild(cancelIcon);

    parentElement.innerHTML = ""
    parentElement.appendChild(tempInput);
    parentElement.appendChild(actionsContainer);

}

const handleEdit = (e) => {
    e.stopPropagation();

    const sidebarItem = e.target.parentElement.parentElement;
    const inputValue = sidebarItem.querySelector("input").value;
    const chatID = sidebarItem.getAttribute("id")

    if (chats[chatID].name !== inputValue) {
        saveToLocalStorage({ selectedChatID: chatID, type: "chat-title", value: inputValue })
        rerenderSidebarItem(e, inputValue)
    } else {
        rerenderSidebarItem(e)
    }

    isInputOpen = false;
}

const deleteChat = (e) => {
    e.stopPropagation();
    const element = e.target.parentElement.parentElement;
    const elementID = element.getAttribute("id")

    if (confirm(`Are you sure you want to delete this chat ${chats[elementID].name}?`)) {
        const filteredChats = Object.entries(chats).filter(([id, chat]) => id !== elementID);
        const chatsAsObject = Object.fromEntries(filteredChats);

        localStorage.setItem("chats", JSON.stringify(chatsAsObject));
        chats = chatsAsObject;

        if (selectedChat === elementID) {
            setSelectedChat(null)
            render()
        }
        element.remove();
        renderSidebar({ edited: true })
    }
}

const renderSidebar = ({ selectedChatLS = null, edited = false }) => {
    if (selectedChat !== selectedChatLS || selectedChatLS === null || edited) {
        while (sidebar.childElementCount > 1) {
            sidebar.removeChild(sidebar.lastElementChild)
        }

        if (chats) {
            Object.entries(sortChatsByDates(chats)).forEach(([category, chats]) => {
                if (chats.length) {
                    const span = document.createElement("span");
                    span.setAttribute("id", category.replaceAll(" ", "-"));
                    span.classList.add("sidebar-category")
                    span.textContent = category;
                    sidebar.appendChild(span);

                    chats.sort(sortByDates).forEach(chat => {
                        const [id, { name }] = Object.entries(chat)[0];
                        createNewChat({ id, name, category, before: false, selectedID: selectedChatLS });
                    })
                }
            });
        }
        if (selectedChat) {
            const selected = document.getElementById(selectedChat)
            if (selected) {
                selected.classList.add('selected')
                chatContainer.innerHTML = '';
                render(selectedChat)
            }
        }
    }
}

const rerenderSidebarItem = (e, newValue) => {
    e ? e.stopPropagation() : "";

    if (clonedPreviousElement) {
        const oldSidebarItem = document.querySelector("#" + clonedPreviousElement.getAttribute("id"));
        if (newValue) {
            clonedPreviousElement.querySelector(".sidebar-item-title").textContent = newValue;
        }
        clonedPreviousElement.addEventListener("click", (e) => handleSelectingChat(e.target))
        const editBtn = clonedPreviousElement.querySelector("div.actions-container span.edit-btn");
        const deleteBtn = clonedPreviousElement.querySelector("div.actions-container span.delete-btn");
        editBtn.addEventListener("click", (e) => editChatName(e));
        deleteBtn.addEventListener("click", (e) => deleteChat(e));

        const parentElement = oldSidebarItem.parentElement;
        parentElement.replaceChild(clonedPreviousElement, oldSidebarItem);
        renderSidebar({ edited: true })

        clonedPreviousElement = null;
    }
}

const removeInputs = () => {
    const divsExceptOne = document.querySelectorAll(`.sidebar-item:not(#${clonedPreviousElement?.getAttribute("id")}):not(#new-chat)`);
    divsExceptOne.length ? divsExceptOne?.forEach(() => rerenderSidebarItem()) : ""
}

const clearClassSelected = () => {
    document.querySelectorAll('.selected').forEach(element => element.classList.remove('selected'));
}

const initializeDropdownData = () => {
    const dropdownMenu = document.querySelector("#dropdown-menu")
    const smDropdownMenu = document.querySelector("#sm-dropdown-menu")
    for (let index in MODELS) {
        const span = document.createElement("span");
        span.setAttribute("id", MODELS[index].id)
        span.classList.add("dropdown-menu-item");
        span.textContent = MODELS[index].model;
        const clonedSpan = span.cloneNode(true)
        span.addEventListener("click", handleSelectDropdownMenuItem)
        clonedSpan.addEventListener("click", handleSelectDropdownMenuItem)
        dropdownMenu.appendChild(span)
        smDropdownMenu.appendChild(clonedSpan)
    }
}

const handleSelectingChat = (sidebarItem) => {
    if (sidebarItem?.nodeName === "DIV") {
        const id = sidebarItem.getAttribute("id");
        if (id === "sm-close-sidebar" || sidebarItem.classList.contains("sidebar-header")) return;

        clearClassSelected();


        if (id !== "new-chat") {
            sidebarItem.classList.add("selected");
        }
        setSelectedChat(id);

        render(id);
        if (isSidebarOpen && !isFirstSidebarInit) {
            closeSidebar();
        } else {
            isFirstSidebarInit = false;
        }
    } else {
        setSelectedChat(null);
    }
}

const setSelectedChat = (id) => {
    if (id && chats[id]) {
        selectedChat = id;
        localStorage.setItem("selected-chat", JSON.stringify(id));
    } else {
        selectedChat = null;
        localStorage.setItem("selected-chat", null);
    }
}

const closeSidebar = () => {
    isSidebarOpen = false;
    sidebarWrapper.style.display = "none";
    sidebarToggler.children[0].innerHTML = "chevron_right"
}

const openSidebar = () => {
    isSidebarOpen = true;
    sidebarWrapper.style.display = "block";
    sidebarToggler.children[0].innerHTML = "chevron_left";
}

const sortChatsByDates = (chats) => {
    const sortedChats = {
        "Today": [],
        "Yesterday": [],
        "Past Week": [],
        "Past Month": [],
        "Past 3 Months": [],
        "Past Year": []
    }

    let chatRecords = Object.entries(chats);

    for (let chat of chatRecords) {
        const chatDate = new Date(chat[1].edited_at ?? chat[1].created_at).getTime()
        const dateCategory = categorizedDate(chatDate);

        if (sortedChats.hasOwnProperty(dateCategory)) {
            sortedChats[dateCategory].push(Object.fromEntries([chat]));
        }
    }
    return sortedChats;
}

chatInput.addEventListener("input", (e) => {
    // Adjust the height of the input field dynamically based on its content
    if (e.target.value.trim() === "") {
        chatInput.style.height = isSmallDevice ? "45px" : "55px";
    } else {
        chatInput.style.height = `${initialInputHeight}px`;
        chatInput.style.height = `${e.target.scrollHeight}px`;
    }
});

chatInput.addEventListener("keydown", (e) => {
    // If the Enter key is pressed without Shift and the window width is larger 
    // than 800 pixels, handle the outgoing chat
    if (e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();
        handleOutgoingChat();
    }
});

sendButton.addEventListener("click", handleOutgoingChat);

sidebarWrapper.addEventListener("click", (e) => {
    e.stopPropagation();
});

sidebarToggler.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const direction = sidebarToggler.children[0].innerHTML.includes("left");

    if (direction) {
        closeSidebar();
    } else {
        openSidebar();
    }
});

menuButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    openSidebar();
});

sidebar.addEventListener('click', function (e) {
    let target = e.target;
    // If the clicked element is not the one needed, then climb up to the needed one. 
    while (target !== this) {
        if (target.nodeName === "DIV") {
            handleSelectingChat(target);
            return;
        }
        target = target.parentNode;
    }
});

body.addEventListener('click', (e) => {
    if (isDragging) {
        return;
    }
    if (isDropdownOpen) {
        isDropdownOpen = false;
        dropdownMenu.classList.add("hide");
    }
    if (isSidebarOpen) {
        closeSidebar();
    }
    if (isInputOpen) {
        removeInputs();
    }
});


body.addEventListener("dragover", (e) => {
    e.preventDefault();

    isDragging = true;
    dragZone.style.display = "flex"
})

body.addEventListener("drop", (e) => {
    e.preventDefault();

    isDragging = false;
    dragZone.style.display = "none"
})

dropZone.addEventListener("dragenter", e => {
    e.preventDefault();

    dropZone.children[0].innerHTML = "Release To Upload"
})
dropZone.addEventListener("dragleave", e => {
    e.preventDefault();

    dropZone.children[0].innerHTML = "Drag & Drop to Upload File"
})

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();

    isDragging = false;
    dragZone.style.display = "none"

    file = e.dataTransfer.files[0];
    showFile()
})

fileUpload.addEventListener("change", e => {
    file = e.target.files[0]
    showFile();
})

const showFile = () => {
    if (!file) return;

    let fileType = file.type;
    let validExtensions = ["image/jpeg", "image/jpg", "image/png"];
    if (validExtensions.includes(fileType) && imageList.length < 10) {
        imageInputContainer.style.display = "flex";
        let fileReader = new FileReader();
        fileReader.onload = () => {
            let fileURL = fileReader.result;
            imageList.push({ type: "image_url", image_url: { url: fileURL, detail: "high" } })

            let imageWrapper = document.createElement("div");
            let img = document.createElement("img");
            let removeBtn = document.createElement("button");

            imageWrapper.classList.add("image-wrapper")
            removeBtn.classList.add("remove-image-buttons");
            img.src = fileURL;
            removeBtn.innerHTML = "X"
            removeBtn.onclick = removeImage;

            imageWrapper.appendChild(img)
            imageWrapper.appendChild(removeBtn)

            imageInputContainer.appendChild(imageWrapper)
        }
        fileReader.readAsDataURL(file);
    } else {
        alert("puu puu not valid file type")
    }
}

const removeImage = (e) => {
    imageList = imageList.filter(img => img.image_url.url !== e.target.previousSibling.src)
    e.target.parentElement.remove();

    if (imageList.length === 0) {
        imageInputContainer.style.display = "none";
    }
}

const dropdownOpen = (e) => {
    e.stopPropagation()
    isDropdownOpen = true;
    dropdownMenu.classList.toggle("hide")
}

dropdown.addEventListener("click", dropdownOpen);
smDropdown.addEventListener("click", dropdownOpen);

const onResize = () => {
    dropdownMenu = window.innerWidth > 600 ?
        document.querySelector("#dropdown-menu") :
        document.querySelector("#sm-dropdown-menu");
}

window.addEventListener("resize", onResize)

document.addEventListener("DOMContentLoaded", () => {
    onResize()
    loadDataFromLocalstorage();
    initializeDropdownData()
});

const initialInputHeight = chatInput.scrollHeight;
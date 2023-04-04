function renderList(list) {
    const template = document.getElementById("li_template");
    const elements = new Set();

    for (const { url, title } of list) {
        const element = template.content.firstElementChild.cloneNode(true);

        element.querySelector(".title").textContent = title;
        element.querySelector(".pathname").textContent = url;
        element.querySelector("a").addEventListener("click", async () => {
            const activeTab = await getActiveTabURL();
            chrome.tabs.sendMessage(activeTab.id, {
                type: "ADD",
                value: { url, title },
            });
        });

        elements.add(element);
    }

    document.querySelector("ul").append(...elements);
}

const getActiveTabURL = async () => {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });
    return tabs[0];
}

async function getPlaylist() {
    const data = await chrome.storage.local.get(["playlist"])
    return data.playlist ? data.playlist : []
}

const play_list = document.getElementById("play_list")

const list = await getPlaylist()
renderList(list)
play_list.addEventListener("click", async () => {
    const activeTab = await getActiveTabURL();
    chrome.tabs.sendMessage(activeTab.id, {
        type: "ADD_ALL",
        value: list,
    });
});
function checkAddition(old) {
    const list = document.querySelectorAll(" div.w2g-menu-tab.w2g-playlists.w2g-active > div.w2g-items.w2g-list-items.w2g-scroll-vertical > div")
    return list.length > old
}

const searchField = document.querySelector("#search-bar-input")
const searchBtn = document.querySelector("#search-bar-form > div > button")
searchField.addEventListener("change", () => addSaveBtn(5))


async function getPlaylist() {
    const data = await chrome.storage.local.get(["playlist"])
    return data.playlist ? data.playlist : []
}

const saveSong = async () => {
    const title = document.querySelector("div.leading-tight.mod-player.sm\\:text-base.text-xs.w2g-search-title").innerText
    const url = searchField.value
    saveSongToPlaylist({ title, url })
}

async function saveSongToPlaylist(song) {
    const { selected } = await chrome.storage.local.get(["selected"])
    const oldStorage = await getPlaylists()
    oldStorage[selected].push(song)
    await chrome.storage.local.set({ "playlists": oldStorage })
}
async function getPlaylists() {
    const { playlists } = await chrome.storage.local.get(["playlists"])
    return playlists
}
chrome.runtime.onMessage.addListener(async (obj, sender, response) => {
    const { type, value } = obj
    if (type === 'ADD') {
        searchField.value = value.url
        // Dispatch the event on the input element
        searchField.dispatchEvent(new Event("change"));
        searchBtn.click()
        addToW2GPlaylist(5)
    } else if (type === "ADD_ALL") {
        for (const { url, title } of value) {
            searchField.value = url
            // Dispatch the event on the input element
            searchField.dispatchEvent(new Event("change"));
            searchBtn.click()
            await addToW2GPlaylist(5)

        }
    }

})

async function addToW2GPlaylist(n) {
    const b = document.querySelector("button.hidden.mod_pl_interaction.mod-pl.px-2.py-1.sm\\:\\!inline-flex.text-sm.w2g-button")
    if (b) b.click()
    else if (n > 0) await delay(() => addToW2GPlaylist(n - 1), 2000)
}

async function addSaveBtn(n) {
    const buttonContainer = document.querySelector("#w2g-search-results > div.sl-1.space-y-2.w2g-search-list > div > div.w2g-search-content > div > div.w2g-search-actions")
    if (buttonContainer) {
        const b = document.createElement("button")
        b.innerText = "save"
        b.classList.add("hidden", "mod-chat", "mr-2", "px-2", "py-1", "sm:!inline-flex", "text-sm", "w2g-button")
        b.addEventListener('click', saveSong)
        buttonContainer.appendChild(b)
    } else if (n > 0) await delay(() => addSaveBtn(n - 1), 2000)
}

function delay(cb, ms) {
    return new Promise(resolve => setTimeout(async () => { await cb(); resolve() }, ms));
}

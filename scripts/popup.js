document.addEventListener('DOMContentLoaded', async function () {
    // Get UI elements
    const playlistSelect = document.getElementById('playlistSelect');
    const playButton = document.getElementById('playButton');
    const deletePLButton = document.getElementById('deletePLButton');
    const songList = document.getElementById('songList');
    const createPlaylistButton = document.getElementById('createPlaylistButton');

    let playlists = await getPlaylistNames();


    // Add event listeners
    playButton.addEventListener("click", playPlaylist);
    deletePLButton.addEventListener("click", deleteSelectedPlaylist);
    createPlaylistButton.addEventListener("click", createPlaylist)
    playlistSelect.addEventListener("change", onPlaylistSelectChange)

    renderPlaylistNames()

    async function deleteSelectedPlaylist() {
        const selectedPlaylistName = playlistSelect.value;
        if (!selectedPlaylistName) {
            alert('No playlist selected');
            return;
        }
        await deletePlaylist(selectedPlaylistName);
        playlists = playlists.filter(i => i !== playlistSelect.value)
        await selectPlaylist(playlists[0] || "")
        await renderPlaylistNames();
    }

    async function onPlaylistSelectChange() {
        const selectedPlaylistName = playlistSelect.value;
        await selectPlaylist(selectedPlaylistName)
        renderList(selectedPlaylistName)
    }

    // Populate playlist select element
    async function renderPlaylistNames() {
        playlistSelect.innerHTML = ""
        const { selected } = await chrome.storage.local.get(["selected"])

        playlists.forEach(playlist => {
            const option = document.createElement('option');
            option.value = playlist;
            option.text = playlist;
            if (selected === playlist)
                option.selected = true
            playlistSelect.appendChild(option);
        });
        await renderList(selected)
    }

    // play a playlist
    async function playPlaylist() {
        const selectedPlaylistName = playlistSelect.value;
        if (selectedPlaylistName === '') {
            alert('No playlist selected');
        } else {
            const selectedPlaylist = await getPlaylistSongs(selectedPlaylistName);
            console.log(`Playing playlist: ${selectedPlaylistName}`);
            console.log(`Songs: ${selectedPlaylist.join(', ')}`);
            const activeTab = await getActiveTabURL();
            chrome.tabs.sendMessage(activeTab.id, {
                type: "ADD_ALL",
                value: selectedPlaylist,
            });
        }
    }

    // render song list
    async function renderList(playlistName) {
        songList.innerHTML = ""
        const list = await getPlaylistSongs(playlistName)
        if (!list) return;
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
            element.querySelector("#deleteSong").addEventListener("click", async () => {
                const newList = list.filter(i => i.url !== url)
                await savePlaylist(playlistName, newList)
                await renderList(playlistName)
            });
            elements.add(element);
        }
        songList.append(...elements);
    }

    // create new playlist
    async function createPlaylist() {
        const newPlaylistInput = document.getElementById('newPlaylistInput');
        const playlistName = newPlaylistInput.value;
        if (playlistName.trim() === '') {
            alert('Playlist name cannot be empty');
        } else {
            playlists.push(playlistName);
            await savePlaylist(playlistName)
            const option = document.createElement('option');
            option.value = playlistName;
            option.textContent = playlistName;
            playlistSelect.appendChild(option);
            newPlaylistInput.value = '';
            console.log(`Playlist '${playlistName}' created`);
        }
    }
})

const getActiveTabURL = async () => {
    const tabs = await chrome.tabs.query({
        currentWindow: true,
        active: true
    });
    return tabs[0];
}
const getPlaylists = async () => {
    const { playlists = {} } = await chrome.storage.local.get(["playlists"]);
    return playlists;
};

const savePlaylist = async (name, value = []) => {
    const oldPlaylists = await getPlaylists();
    const newPlaylists = { ...oldPlaylists, [name]: value };
    await chrome.storage.local.set({ playlists: newPlaylists });
    console.log(`Playlist '${name}' saved: ${JSON.stringify(value)}`);
};

const getPlaylistSongs = async (name) => {
    const playlists = await getPlaylists();
    return playlists[name] || [];
};

const getPlaylistNames = async () => {
    const playlists = await getPlaylists();
    return Object.keys(playlists);
};

const deletePlaylist = async (name) => {
    const oldPlaylists = await getPlaylists();
    delete oldPlaylists[name];
    await chrome.storage.local.set({ playlists: oldPlaylists });
    console.log(`Playlist '${name}' deleted`);
};

const selectPlaylist = async (playlistName) => {
    await chrome.storage.local.set({ "selected": playlistName })
}
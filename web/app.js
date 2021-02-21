var win;

var userAgent = navigator.userAgent.toLowerCase();
if (userAgent.indexOf(" electron/") > -1) {
    const { ipcRenderer } = require("electron");
    const { ipcMain } = require("electron");
    const remote = require("electron").remote;
    win = remote.getCurrentWindow();

    document.getElementById("max-button").style.display = "";
    document.getElementById("restore-button").style.display = "none";

    document.getElementById("window-controls").style.display = "";

    document.getElementById('min-button').addEventListener("click", event => {
        win.minimize();
    });

    document.getElementById('max-button').addEventListener("click", event => {
        win.maximize();
        document.getElementById("restore-button").style.display = "";
        document.getElementById("max-button").style.display = "none";
    });

    document.getElementById('restore-button').addEventListener("click", event => {
        win.unmaximize();
        document.getElementById("restore-button").style.display = "none";
        document.getElementById("max-button").style.display = "";
    });

    document.getElementById('close-button').addEventListener("click", event => {
        win.close();
    });
}


refresh();
checkQueue();
setLoop();
if (checkPresence() == "true") {
    setPresence("pause");
}
document.getElementById("loaded").style.display = "none";
document.getElementById("progress").innerHTML = "No song is loaded.";

window.addEventListener("click", function(e) {
    if (menuVisible == true) {toggleMenu("hide");}
});

window.addEventListener("contextmenu", function(e) {
    if (
        e.target.classList.contains("sectBlob") ||
        e.target.parentElement !== null && e.target.parentElement.classList.contains("sectBlob") ||
        e.target.classList.contains("chip") ||
        e.target.parentElement !== null && e.target.parentElement.classList.contains("chip")
    ) {
        e.preventDefault();
        if (
            e.target.parentElement.classList.contains("sectBlob") ||
            e.target.parentElement.classList.contains("chip")
        ) { var sId = e.target.parentElement.id;}
        else { var sId = e.target.id; }
        console.log(e.target)
        document.querySelector(".menu").setAttribute("id", sId + "::::context");
        var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
        const origin = {
            left: e.pageX,
            top: e.pageY - scrollTop
        };
        setPosition(origin);
        return false;
    }
});

document.getElementById("actualPlayer").addEventListener("loadedmetadata", function() {
    document.getElementById("pb").max = document.getElementById("actualPlayer").duration;
    document.getElementById("pb").value = 0;
    getLyrics();
    document.getElementById("loading").style.display = "none";
    document.getElementById("loaded").style.display = "";
});

document.getElementById("actualPlayer").addEventListener("timeupdate", function() {
    document.getElementById("pb").value = document.getElementById("actualPlayer").currentTime;
});

document.getElementById("actualPlayer").addEventListener("pause", function() {
    document.getElementById("togglePlayback").innerHTML = "play_arrow";
    setPresence("pause");
});

document.getElementById("actualPlayer").addEventListener("play", function () {
    document.getElementById("togglePlayback").innerHTML = "pause";
    setPresence("play");
});

document.getElementById("actualPlayer").addEventListener("ended", function () {
    if (localStorage.getItem("queue") && localStorage.getItem("queuePosition")) {
        var q = JSON.parse(localStorage.getItem("queue"));
        var pos = parseInt(localStorage.getItem("queuePosition"));
        var nPos = (pos + 1).toString();
        var nPosP = pos + 1;
        if (q[nPosP]) {
            if (!localStorage.getItem("loopMode") || localStorage.getItem("loopMode") !== "2") {
                setQueuePosition(nPos, true);
            } else {
                setQueuePosition(parseInt(pos), true);
            }
        } else {
            if (localStorage.getItem("loopMode") && localStorage.getItem("loopMode") == "1") {
                setQueuePosition(0, true);
            } else {
                // end of queue
            }
        }
    } else {
        if (localStorage.getItem("loopMode") && localStorage.getItem("loopMode") !== "0") {
            document.getElementById("actualPlayer").play();
            document.getElementById("loading").style.display = "none";
            document.getElementById("loaded").style.display = "";
        } else {
            // if loop is off, do nothing after track ends
        }
    }
})

document.getElementById("actualPlayer").addEventListener("error", function(error) {
    document.getElementById("loading").style.display = "";
    document.getElementById("loaded").style.display = "none";
    document.getElementById("progress").innerHTML = "Error retrieving song. Retrying...";
    var artist = document.getElementById("artistName").innerHTML;
    var track = document.getElementById("trackName").innerHTML;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/get/track/stream?artist=" + artist + "&track=" + track)
    xhr.send();
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        if (!json.err) {
            document.getElementById("actualPlayer").src = json[0].url;
            if (localStorage.getItem("queue")) {
                var q = JSON.parse(localStorage.getItem("queue"));
                var pos = parseInt(localStorage.getItem("queuePosition"));
                q[pos].url = json[0].url;
                q = JSON.stringify(q);
                localStorage.setItem("queue", q);
            }
            document.getElementById("progress").innerHTML = "Loading stream data...";
            document.getElementById("actualPlayer").play();
        } else {
            document.getElementById("progress").innerHTML = "Could not get song.";
            if (localStorage.getItem("queue")) {
                goToNext();
                removeFromQueue(parseInt(localStorage.getItem("queuePosition")));
            }
        }
    }
});

document.getElementById("pb").addEventListener("input", function() {
    document.getElementById("actualPlayer").currentTime = document.getElementById("pb").value;
});

let menuVisible = false;

function toggleMenu(command) {
    document.querySelector(".menu").style.display = command === "show" ? "block" : "none";
    menuVisible = !menuVisible;
}

function setPosition({top, left}) {
    document.querySelector(".menu").style.left = `${left}px`;
    document.querySelector(".menu").style.top = `${top}px`;
    toggleMenu("show");
}

function hideLyrics() {
    setTimeout(function () {
        document.getElementById("lyricsLink").href = "javascript:showLyrics();";
        document.getElementById("lyrics").style.display = "none";
        let el = document.getElementById('settings');
        el.classList.remove("blur-on");
        el = document.getElementById('home');
        el.classList.remove("blur-on");
        el = document.getElementById('about');
        el.classList.remove("blur-on");
        el = document.getElementById('search');
        el.classList.remove("blur-on");
        el = document.getElementById('artist');
        el.classList.remove("blur-on");
        el = document.getElementById('album');
        el.classList.remove("blur-on");
    }, 10)
}
function showLyrics() {
    setTimeout(function () {
        document.getElementById("lyricsLink").href = "javascript:hideLyrics();";
        document.getElementById("lyrics").style.display = "";
        let el = document.getElementById('settings');
        el.classList.add("blur-on");
        el = document.getElementById('home');
        el.classList.add("blur-on");
        el = document.getElementById('about');
        el.classList.add("blur-on");
        el = document.getElementById('search');
        el.classList.add("blur-on");
        el = document.getElementById('artist');
        el.classList.add("blur-on");
        el = document.getElementById('album');
        el.classList.add("blur-on");
    }, 10)
}

function refresh() {
    document.getElementById("main").scrollTop = 0;
    setTimeout(function () {
        document.getElementById("lyricsLink").href = "#lyrics";
        let el = document.getElementById('settings');
        el.classList.remove("blur-on");
        el = document.getElementById('home');
        el.classList.remove("blur-on");
        el = document.getElementById('about');
        el.classList.remove("blur-on");
        el = document.getElementById('search');
        el.classList.remove("blur-on");
        el = document.getElementById('artist');
        el.classList.remove("blur-on");
        el = document.getElementById('album');
        el.classList.remove("blur-on");

        if (window.location.hash) {


            if (window.location.hash == "#") {
                document.getElementById("settings").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("home").style.display = "";
                document.getElementById("search").style.display = "none";
                document.getElementById("queue").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "none";
                document.getElementById("album").style.display = "none";
                dumpIntoSection("/api/get/trending", "sect1");
            } else if (window.location.hash == "#settings") {
                document.getElementById("settings").style.display = "";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("queue").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "none";
                document.getElementById("album").style.display = "none";
                getSettings();
            } else if (window.location.hash == "#about") {
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("about").style.display = "";
                document.getElementById("queue").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "none";
                document.getElementById("album").style.display = "none";
            } else if (window.location.hash == "#search") {
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("queue").style.display = "none";
                document.getElementById("artist").style.display = "none";
                document.getElementById("album").style.display = "none";
                document.getElementById("q").focus();
            } else if (window.location.hash == "#queue") {
                document.getElementById("queue").style.display = "";
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "none";
                document.getElementById("album").style.display = "none";
                queuePage();
            } else if (window.location.hash == "#lyrics") {
                document.getElementById("lyrics").style.display = "";
                document.getElementById("lyricsLink").href = "javascript:hideLyrics();";

                //BLUR CODE
                let el = document.getElementById('settings');
                el.classList.add("blur-on");
                el = document.getElementById('home');
                el.classList.add("blur-on");
                el = document.getElementById('about');
                el.classList.add("blur-on");
                el = document.getElementById('search');
                el.classList.add("blur-on");
                el = document.getElementById('artist');
                el.classList.add("blur-on");
                el = document.getElementById('album');
                el.classList.add("blur-on");
                //BLUR OVER
            } else if (window.location.hash.split("#").slice(1)[0] == "artist") {
                document.getElementById("queue").style.display = "none";
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "";
                document.getElementById("album").style.display = "none";
                getArtist();
            } else if (window.location.hash.split("#").slice(1)[0] == "album") {
                document.getElementById("queue").style.display = "none";
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "none";
                document.getElementById("album").style.display = "";
                getAlbum();
            } else {
                document.getElementById("settings").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("home").style.display = "";
                document.getElementById("queue").style.display = "none";
                document.getElementById("artist").style.display = "none";
                document.getElementById("album").style.display = "none";
                dumpIntoSection("/api/get/trending", "sect1");
            }
        } else {
            document.getElementById("settings").style.display = "none";
            document.getElementById("about").style.display = "none";
            document.getElementById("search").style.display = "none";
            document.getElementById("home").style.display = "";
            document.getElementById("queue").style.display = "none";
            document.getElementById("lyrics").style.display = "none";
            document.getElementById("artist").style.display = "none";
            document.getElementById("album").style.display = "none";
            dumpIntoSection("/api/get/trending", "sect1");
        }
    }, 10)
}

function dumpIntoSection(location, id) {
    document.getElementById(id+"Load").style.display = "";
    document.getElementById(id).style.display = "none";
    document.getElementById(id).innerHTML = "";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", location);
    xhr.send();
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        if (json.source == "deezer") {
            document.getElementById(id+"Load").style.display = "none";
            document.getElementById(id).style.display = "";
            for (var c in json.data.data) {
                if (json.data.data[c].type == "track") {
                    var div = document.createElement("DIV");
                    div.classList.add("sectBlob");
                    div.id = json.data.data[c].id;
                    div.onclick = function () {getStream(this.id)}
                    var cover = document.createElement("IMG");
                    cover.src = json.data.data[c].album.cover_big;
                    cover.title = "Cover of " + json.data.data[c].album.title + " by " + json.data.data[c].artist.name;
                    cover.alt = "Cover of " + json.data.data[c].album.title + " by " + json.data.data[c].artist.name;
                    cover.onerror = function () {this.src = "icon.png";}
                    div.appendChild(cover);
                    var title = document.createElement("H3");
                    if (json.data.data[c].title_short.length <= 40) {
                        title.innerHTML = json.data.data[c].title_short;
                    } else {
                        title.innerHTML = json.data.data[c].title_short.substring(0,40).trim()+"...";
                    }
                    title.title = json.data.data[c].title_short
                    div.appendChild(title);
                    var author = document.createElement("H4");
                    author.innerHTML = json.data.data[c].artist.name;
                    author.title = json.data.data[c].artist.name;
                    div.appendChild(author);
                    document.getElementById(id).appendChild(div);
                } else if (json.data.data[c].type == "album") {
                    var lnk = document.createElement("A");
                    lnk.href = "#album#" + json.data.data[c].id
                    var div = document.createElement("DIV");
                    div.classList.add("sectBlob");
                    var cover = document.createElement("IMG");
                    cover.src = json.data.data[c].cover_big;
                    div.appendChild(cover);
                    var title = document.createElement("H3");
                    if (json.data.data[c].title.length <= 40) {
                        title.innerHTML = json.data.data[c].title;
                    } else {
                        title.innerHTML = json.data.data[c].title.substring(0,40).trim()+"...";
                    }
                    title.title = json.data.data[c].title_short
                    div.appendChild(title);
                    var fans = document.createElement("H4");
                    fans.innerHTML = json.data.data[c].fans.toLocaleString() + " fans";
                    div.appendChild(fans);
                    lnk.append(div);
                    document.getElementById(id).appendChild(lnk);
                }
            }
        } else if (json.source == "lastfm") {
            document.getElementById(id+"Load").style.display = "none";
            document.getElementById(id).style.display = "";
            for (var c in json.data.result) {
                if (json.data.result[c].type == "track") {
                    var div = document.createElement("DIV");
                    div.classList.add("sectBlob");
                    div.id = json.data.result[c].name + ":::" + json.data.result[c].artistName;
                    div.onclick = function () {getStream(this.id)}
                    var cover = document.createElement("IMG");
                    if (json.data.result[c].images) {cover.src = json.data.result[c].images[json.data.result[c].images.length - 1];}
                    else {cover.src = "icon.png";}
                    cover.onerror = function () {this.src = "icon.png";}
                    div.appendChild(cover);
                    var title = document.createElement("H3");
                    if (json.data.result[c].name.length <= 40) {
                        title.innerHTML = json.data.result[c].name;
                    } else {
                        title.innerHTML = json.data.result[c].name.substring(0,40).trim()+"...";
                    }
                    title.title = json.data.result[c].name;
                    div.appendChild(title);
                    var author = document.createElement("H4");
                    author.innerHTML = json.data.result[c].artistName;
                    author.title = json.data.result[c].artistName;
                    div.appendChild(author);
                    document.getElementById(id).appendChild(div);
                } else if (json.data.result[c].type == "album") {
                    var lnk = document.createElement("A");
                    lnk.href = "#album#" + json.data.result[c].name + ":::" + json.data.result[c].artistName;
                    var div = document.createElement("DIV");
                    div.classList.add("sectBlob");
                    var cover = document.createElement("IMG");
                    if (json.data.result[c].images) {cover.src = json.data.result[c].images[json.data.result[c].images.length - 1];}
                    else {cover.src = "icon.png";}
                    cover.onerror = function () {this.src = "icon.png";}
                    div.appendChild(cover);
                    var title = document.createElement("H3");
                    if (json.data.result[c].name.length <= 40) {
                        title.innerHTML = json.data.result[c].name;
                    } else {
                        title.innerHTML = json.data.result[c].name.substring(0,40).trim() + "...";
                    }
                    title.title = json.data.result[c].name
                    div.appendChild(title);
                    var fans = document.createElement("H4");
                    fans.innerHTML = json.data.result[c].listeners.toLocaleString() + " listeners on Lastfm";
                    div.appendChild(fans);
                    lnk.append(div);
                    document.getElementById(id).appendChild(lnk);
                }
            }
        } else if (json.source == "youtube") {
            document.getElementById(id+"Load").style.display = "none";
            document.getElementById(id).style.display = "";
            if (json.data.id) {
                for (var c in json.data.items) {
                    // var lnk = document.createElement("A");
                    // lnk.href = "#track#" + json.data.items[c].id
                    var div = document.createElement("DIV");
                    div.classList.add("sectBlob");
                    div.id = json.data.items[c].id;
                    div.onclick = function () {getStream(this.id)}
                    var cover = document.createElement("IMG");
                    if (json.data.items[c].bestThumbnail) {cover.src = json.data.items[c].bestThumbnail.url;}
                    else {cover.src = "icon.png";}
                    cover.onerror = function () {this.src = "icon.png";}
                    div.appendChild(cover);
                    var title = document.createElement("H3");
                    if (json.data.items[c].title.length <= 40) {
                        title.innerHTML = json.data.items[c].title;
                    } else {
                        title.innerHTML = json.data.items[c].title.substring(0,40).trim()+"...";
                    }
                    title.title = json.data.items[c].title;
                    div.appendChild(title);
                    var author = document.createElement("H4");
                    author.innerHTML = json.data.items[c].author.name;
                    author.title = json.data.items[c].author.name;
                    div.appendChild(author);
                    //lnk.append(div);
                    document.getElementById(id).appendChild(div);
                }
            } else{
                for (var c in json.data.items) {
                    var lnk = document.createElement("A");
                    lnk.href = "#album#" + json.data.items[c].playlistId
                    var div = document.createElement("DIV");
                    div.classList.add("sectBlob");
                    div.id = json.data.items[c].playlistId;
                    div.onclick = function () {getStream(this.id)}
                    var cover = document.createElement("IMG");
                    if (json.data.items[c].playlistThumbnail) {cover.src = json.data.items[c].playlistThumbnail;}
                    else {cover.src = "icon.png";}
                    cover.onerror = function () {this.src = "icon.png";}
                    div.appendChild(cover);
                    var title = document.createElement("H3");
                    if (json.data.items[c].title.length <= 40) {
                        title.innerHTML = json.data.items[c].title;
                    } else {
                        title.innerHTML = json.data.items[c].title.substring(0,40).trim()+"...";
                    }
                    title.title = json.data.items[c].title;
                    div.appendChild(title);
                    var author = document.createElement("H4");
                    author.innerHTML = json.data.items[c].author;
                    author.title = json.data.items[c].author;
                    div.appendChild(author);
                    lnk.append(div);
                    document.getElementById(id).appendChild(lnk);
                }
            }
        }
    }
}

function getStream(id) {
    makePlayerVisible();
    document.getElementById("actualPlayer").pause();
    document.getElementById("loaded").style.display = "none";
    document.getElementById("loading").style.display = "";
    document.getElementById("progress").innerHTML = "Loading metadata...";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/get/track?id=" + id);
    xhr.send();
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        if (json.source == "deezer") {
            document.getElementById("cover").src = json.data.album.cover_xl;
            document.getElementById("player").setAttribute("playing-id", json.data.id);
            document.getElementById("trackLink").href = "#album#" + json.data.album.id + "#track#" + json.data.id;
            document.getElementById("trackName").innerHTML = json.data.title;
            document.getElementById("artistLink").href = "#artist#" + json.data.artist.id;
            document.getElementById("artistName").innerHTML = json.data.artist.name;
            document.getElementById("progress").innerHTML = "Getting stream URL...";
            if (localStorage.getItem("queue")) {
                var q = JSON.parse(localStorage.getItem("queue"));
                var m = [
                    {
                        "cover":json.data.album.cover_xl,
                        "artist": {
                            "link": "#artist#" + json.data.artist.id,
                            "name": json.data.artist.name,
                        },
                        "track": {
                            "name": json.data.title,
                            "link": "#album#" + json.data.album.id + "#track#" + json.data.id,
                            "id": json.data.id
                        }
                    }
                ]
                q.push(m);
                localStorage.setItem("queuePosition", q.length - 1);
                localStorage.setItem("queue", JSON.stringify(q));
            }
            xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artist.name) + "&track=" + encodeURIComponent(json.data.title));
            xhr.send();
            xhr.onload = function() {
                document.getElementById("progress").innerHTML = "Loading stream data...";
                var json = JSON.parse(xhr.responseText);
                document.getElementById("actualPlayer").src = json[0].url;
                document.getElementById("loaded").style.display = "";
                document.getElementById("loading").style.display = "none";
                document.getElementById("actualPlayer").play();
            }
        } else if (json.source == "lastfm") {
            if (json.data.images) {var cover = json.data.images[json.data.images.length - 1];} else {var cover = "icon.png"}
            document.getElementById("cover").src = cover;
            document.getElementById("artistLink").href = "#artist#" + json.data.artistName;
            document.getElementById("artistName").innerHTML = json.data.artistName;
            document.getElementById("trackLink").href = "#album#" + json.data.albumName + ":::" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName;
            document.getElementById("trackName").innerHTML = json.data.name;
            document.getElementById("progress").innerHTML = "Getting stream URL...";
            if (localStorage.getItem("queue")) {
                var q = JSON.parse(localStorage.getItem("queue"));
                var m = [
                    {
                        "cover":cover,
                        "artist": {
                            "link": "#artist#" + json.data.artistName,
                            "name": json.data.artistName,
                        },
                        "track": {
                            "name": json.data.name,
                            "link": "#album#" + json.data.albumName + ":::" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName,
                            "id": json.data.name + "_" + json.data.artistName
                        }
                    }
                ]
                q.push(m);
                localStorage.setItem("queuePosition", q.length - 1);
                localStorage.setItem("queue", JSON.stringify(q));
            }
            xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artistName) + "&track=" + encodeURIComponent(json.data.name));
            xhr.send();
            xhr.onload = function() {
                document.getElementById("progress").innerHTML = "Loading stream data...";
                var json = JSON.parse(xhr.responseText);
                document.getElementById("actualPlayer").src = json[0].url;
                if (localStorage.getItem("queue")) {
                    var q = JSON.parse(localStorage.getItem("queue"));
                    q[q.length - 1].url = json[0].url;
                    localStorage.setItem("queue", JSON.stringify(q));
                }
                document.getElementById("loaded").style.display = "";
                document.getElementById("loading").style.display = "none";
                document.getElementById("actualPlayer").play();
            }
        } else if (json.source == "youtube") {
            if (json.data.videoDetails.thumbnails) {var cover = json.data.videoDetails.thumbnails[json.data.videoDetails.thumbnails.length - 1].url;} else {var cover = "icon.png"}
            document.getElementById("cover").src = cover;
            document.getElementById("artistLink").href = "#artist#" + json.data.videoDetails.externalChannelId;
            document.getElementById("artistName").innerHTML = json.data.videoDetails.ownerChannelName;
            document.getElementById("trackLink").href = "#track#" + json.data.videoDetails.videoId + "_" + json.data.videoDetails.externalChannelId;
            document.getElementById("trackName").innerHTML = json.data.videoDetails.title;
            document.getElementById("progress").innerHTML = "Getting stream URL...";
            if (localStorage.getItem("queue")) {
                var q = JSON.parse(localStorage.getItem("queue"));
                var m = [
                    {
                        "cover":cover,
                        "artist": {
                            "link": "#artist#" + json.data.videoDetails.externalChannelId,
                            "name": json.data.videoDetails.ownerChannelName,
                        },
                        "track": {
                            "name": json.data.videoDetails.title,
                            "link": "#track#" + json.data.videoDetails.videoId + "_" + json.data.videoDetails.externalChannelId,
                            "id": json.data.videoDetails.videoId + "_" + json.data.videoDetails.externalChannelId
                        }
                    }
                ]
                q.push(m);
                localStorage.setItem("queuePosition", q.length - 1);
                localStorage.setItem("queue", JSON.stringify(q));
            }
            xhr.open("GET", "/api/get/track/stream?track=" + encodeURIComponent(json.data.videoDetails.videoId));
            xhr.send();
            xhr.onload = function() {
                document.getElementById("progress").innerHTML = "Loading stream data...";
                var json = JSON.parse(xhr.responseText);
                document.getElementById("actualPlayer").src = json[0].url;
                if (localStorage.getItem("queue")) {
                    var q = JSON.parse(localStorage.getItem("queue"));
                    q[q.length - 1].url = json[0].url;
                    localStorage.setItem("queue", JSON.stringify(q));
                }
                document.getElementById("loaded").style.display = "";
                document.getElementById("loading").style.display = "none";
                document.getElementById("actualPlayer").play();
            }
        }
    }
}

function makePlayerVisible() {
    if (document.getElementById("player").visible == "1") {return;}
    else {
        var elements = document.getElementsByClassName('hoverPage');
        for (var i in elements) {
            if (elements.hasOwnProperty(i)) {
                elements[i].setAttribute("player", "shown");
            }
        }
        document.getElementById("main").style.height = 'calc(calc(100% - 245px) - 30px)';
        document.getElementById("player").style = "margin-bottom:0;";
        document.getElementById("player").visible = "1";
        document.getElementById("showPlayer").style.display = "none";
        document.getElementById("hidePlayer").style.display = "";
    }
}

function hidePlayer() {
    var elements = document.getElementsByClassName('hoverPage');
    for (var i in elements) {
        if (elements.hasOwnProperty(i)) {
            elements[i].setAttribute("player", "hidden");
        }
    }
    if (document.getElementById("player").visible == "0") {return;}
    else {
        document.getElementById("main").style.height = 'calc(calc(100% - 45px) - 30px';
        document.getElementById("player").style = "margin-bottom:-200px;";
        document.getElementById("player").visible = "0";
        document.getElementById("showPlayer").style.display = "";
        document.getElementById("hidePlayer").style.display = "none";
    }
}

function togglePlayback() {
    if (document.getElementById("actualPlayer").paused) {
        document.getElementById("actualPlayer").play();
        document.getElementById("togglePlayback").innerHTML = "pause";
    } else {
        document.getElementById("actualPlayer").pause();
        document.getElementById("togglePlayback").innerHTML = "play_arrow";
    }
}

function getSettings() {
    document.getElementById("sLoading").style.display = "";
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/config");
    xhr.send();
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        if (json.lastFmKey) {document.getElementById("lfmKey").value = json.lastFmKey;}
        if (json.dataSource) {document.getElementById("dataSrc").value = json.dataSource;}
        if (json.discordRpc) {document.getElementById("discordRpc").value = json.discordRpc;}
        if (json.discordRpcId) {document.getElementById("discordRpcId").value = json.discordRpcId;}
        document.getElementById("sLoading").style.display = "none";
        document.getElementById("sContents").style.display = "";
    }
}

function saveSettings() {
    var url = "/api/editConfig?lastFmKey=" + document.getElementById("lfmKey").value + "&dataSource=" + document.getElementById("dataSrc").value + "&discordRpc=" + document.getElementById("discordRpc").value + "&discordRpcId=" + document.getElementById("discordRpcId").value;
    window.open(url, "_self");
}

function search() {
    var oq = document.getElementById("q").value;
    setTimeout(function() {
        if (oq !== document.getElementById("q").value) {return;}
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/search?q=" + document.getElementById("q").value);
        xhr.send();
        xhr.onload = function () {
            var json = JSON.parse(xhr.responseText);
            document.getElementById("results").innerHTML = "";
            if (!json.results && json.err) {document.getElementById("results").innerHTML = "<span style='margin-left:1.5%;'>Error retreiving results. <i>" + json.err.message + "</i></span>"; return;}
            if (json.source == "deezer") {
                for (var c in json.results.data) {
                    if (json.results.data[c].type == "track") {
                        var div = document.createElement("DIV");
                        div.classList.add("sectBlob");
                        div.id = json.results.data[c].id;
                        div.onclick = function () {getStream(this.id)}
                        var cover = document.createElement("IMG");
                        cover.src = json.results.data[c].album.cover_big;
                        cover.title = "Cover of " + json.results.data[c].album.title + " by " + json.results.data[c].artist.name;
                        cover.alt = "Cover of " + json.results.data[c].album.title + " by " + json.results.data[c].artist.name;
                        cover.onerror = function () {this.src = "icon.png";}
                        div.appendChild(cover);
                        var title = document.createElement("H3");
                        if (json.results.data[c].title_short.length <= 40) {
                            title.innerHTML = json.results.data[c].title_short;
                        } else {
                            title.innerHTML = json.results.data[c].title_short.substring(0,40).trim() + "...";
                        }
                        title.title = json.results.data[c].title_short
                        div.appendChild(title);
                        var author = document.createElement("H4");
                        author.innerHTML = json.results.data[c].artist.name;
                        author.title = json.results.data[c].artist.name;
                        div.appendChild(author);
                        var type = document.createElement("H3");
                        var typeIcon = document.createElement("SPAN");
                        typeIcon.classList.add("material-icons");
                        typeIcon.innerHTML = "audiotrack";
                        type.appendChild(typeIcon);
                        type.innerHTML = type.innerHTML + " Track";
                        div.appendChild(type);
                        document.getElementById("results").appendChild(div);
                    } else {
                        console.log(json.results.data[c]);
                    }
                }
            } else if (json.source == "lastfm") {
                for (var c in json.results.result.tracks) {
                    var div = document.createElement("DIV");
                    div.classList.add("sectBlob");
                    div.id = json.results.result.tracks[c].name + ":::" + json.results.result.tracks[c].artistName;
                    div.onclick = function () {getStream(this.id)}
                    var cover = document.createElement("IMG");
                    cover.src = json.results.result.tracks[c].images[json.results.result.tracks[c].images.length - 1];
                    cover.onerror = function () {this.src = "icon.png";}
                    cover.title = "Cover of " + json.results.result.tracks[c].name + " by " + json.results.result.tracks[c].artistName;
                    cover.alt = "Cover of " + json.results.result.tracks[c].name + " by " + json.results.result.tracks[c].artistName;
                    div.appendChild(cover);
                    var title = document.createElement("H3");
                    if(json.results.result.tracks[c].name.length <= 40) {
                      title.innerHTML = json.results.result.tracks[c].name;
                    }else{
                      title.innerHTML = json.results.result.tracks[c].name.substring(0,40).trim()+"...";
                    }
                    title.title = json.results.result.tracks[c].name
                    div.appendChild(title);
                    var author = document.createElement("H4");
                    author.innerHTML = json.results.result.tracks[c].artistName;
                    author.title = json.results.result.tracks[c].artistName;
                    div.appendChild(author);
                    var type = document.createElement("H3");
                    var typeIcon = document.createElement("SPAN");
                    typeIcon.classList.add("material-icons");
                    typeIcon.innerHTML = "audiotrack";
                    type.appendChild(typeIcon);
                    type.innerHTML = type.innerHTML + " Track";
                    div.appendChild(type);
                    document.getElementById("results").appendChild(div);
                }
            } else if (json.source == "youtube") {
                for (var c in json.results.items) {
                    if (json.results.items[c].type == "video") {
                        var div = document.createElement("DIV");
                        div.classList.add("sectBlob");
                        div.id = json.results.items[c].id;
                        div.onclick = function () {getStream(this.id)}
                        var cover = document.createElement("IMG");
                        cover.src = json.results.items[c].bestThumbnail.url;
                        cover.onerror = function () {this.src = "icon.png";}
                        cover.title = "Cover of " + json.results.items[c].title + " by " + json.results.items[c].author.name;
                        cover.alt = "Cover of " + json.results.items[c].title + " by " + json.results.items[c].author.name;
                        div.appendChild(cover);
                        var title = document.createElement("H3");
                        if(json.results.items[c].title.length <= 30) {
                          title.innerHTML = json.results.items[c].title;
                        }else{
                          title.innerHTML = json.results.items[c].title.substring(0,30).trim()+"...";
                        }
                        title.title = json.results.items[c].title
                        div.appendChild(title);
                        var author = document.createElement("H4");
                        author.innerHTML = json.results.items[c].author.name;
                        author.title = json.results.items[c].author.name;
                        div.appendChild(author);
                        var type = document.createElement("H3");
                        var typeIcon = document.createElement("SPAN");
                        typeIcon.classList.add("material-icons");
                        typeIcon.innerHTML = "audiotrack";
                        type.appendChild(typeIcon);
                        type.innerHTML = type.innerHTML + " Track";
                        div.appendChild(type);
                        document.getElementById("results").appendChild(div);
                    }
                }
            }
        }
    }, 500)
}

function addToQueue(id) {
    var id = id.split("::::")[0];
    showQC();
    if (!localStorage.getItem("queue")) {
        makePlayerVisible();
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/get/track?id=" + id);
        xhr.send();
        xhr.onload = function () {
            var json = JSON.parse(xhr.responseText);
            if (json.source == "deezer") {
                if (!document.getElementById("player").getAttribute("playing-id")) {
                    document.getElementById("cover").src = json.data.album.cover_xl;
                    document.getElementById("trackLink").href = "#album#" + json.data.album.id + "#track#" + json.data.id;
                    document.getElementById("trackName").innerHTML = json.data.title;
                    document.getElementById("artistLink").href = "#artist#" + json.data.artist.id;
                    document.getElementById("artistName").innerHTML = json.data.artist.name;
                    document.getElementById("progress").innerHTML = "Creating queue file...";
                    localStorage.setItem("queuePosition", "0");
                    var q = JSON.stringify(
                        [
                            {
                                "cover":json.data.album.cover_xl,
                                "artist": {
                                    "link": "#artist#" + json.data.artist.id,
                                    "name": json.data.artist.name,
                                },
                                "track": {
                                    "name": json.data.title,
                                    "link": "#album#" + json.data.album.id + "#track#" + json.data.id,
                                    "id": json.data.id
                                }
                            }
                        ]
                    );
                    localStorage.setItem("queue", q);
                    document.getElementById("progress").innerHTML = "Getting stream URL...";
                    xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artist.name) + "&track=" + encodeURIComponent(json.data.title));
                    xhr.send();
                    xhr.onload = function() {
                        document.getElementById("progress").innerHTML = "Loading stream data...";
                        var json = JSON.parse(xhr.responseText);
                        document.getElementById("actualPlayer").src = json[0].url;
                        var q = JSON.parse(localStorage.getItem("queue"));
                        q[0].url = json[0].url;
                        localStorage.setItem("queue", JSON.stringify(q));
                        document.getElementById("loaded").style.display = "";
                        document.getElementById("loading").style.display = "none";
                    }
                } else {
                    var q = [
                        {
                            "cover":document.getElementById("cover").src,
                            "artist": {
                                "link": document.getElementById("artistLink").href,
                                "name": document.getElementById("artistName").innerHTML,
                            },
                            "url": document.getElementById("actualPlayer").src,
                            "track": {
                                "name": document.getElementById("trackName").innerHTML,
                                "link": document.getElementById("trackLink").href,
                                "id": document.getElementById("player").getAttribute("playing-id")
                            }
                        }
                    ]
                    localStorage.setItem("queuePosition", "0");
                    var n = {
                        "cover":json.data.album.cover_xl,
                        "artist": {
                            "link": "#artist#" + json.data.artist.id,
                            "name": json.data.artist.name,
                        },
                        "track": {
                            "name": json.data.title,
                            "link": "#album#" + json.data.album.id + "#track#" + json.data.id,
                            "id": json.data.id
                        }
                    }
                    q.push(n);
                    var q = JSON.stringify(q);
                    localStorage.setItem("queue", q);
                    xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artist.name) + "&track=" + encodeURIComponent(json.data.title));
                    xhr.send();
                    xhr.onload = function() {
                        var json2 = JSON.parse(xhr.responseText);
                        var q = JSON.parse(localStorage.getItem("queue"));
                        q[q.length - 1].url = json2[0].url;
                        var q = JSON.stringify(q);
                        localStorage.setItem("queue", q);
                    }
                }
            } else if (json.source == "lastfm") {
                if (!document.getElementById("player").getAttribute("playing-id")) {
                    if (json.data.images) {var cover = json.data.images[json.data.images.length - 1];} else {var cover = "icon.png"}
                    document.getElementById("cover").src = cover;
                    document.getElementById("artistLink").href = "#artist#" + json.data.artistName;
                    document.getElementById("artistName").innerHTML = json.data.artistName;
                    document.getElementById("trackLink").href = "#album#" + json.data.albumName + ":::" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName;
                    document.getElementById("trackName").innerHTML = json.data.name;
                    var j = [
                        {
                            "cover":cover,
                            "artist": {
                                "link": "#artist#" + json.data.artistName,
                                "name": json.data.artistName,
                            },
                            "track": {
                                "name": json.data.name,
                                "link": "#album#" + json.data.albumName + ":::" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName,
                                "id": json.data.name + "_" + json.data.artistName
                            }
                        }
                    ]
                    localStorage.setItem("queue", JSON.stringify(j));
                    document.getElementById("progress").innerHTML = "Getting stream URL...";
                    xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artistName) + "&track=" + encodeURIComponent(json.data.name));
                    xhr.send();
                    xhr.onload = function() {
                        document.getElementById("progress").innerHTML = "Loading stream data...";
                        var json = JSON.parse(xhr.responseText);
                        document.getElementById("actualPlayer").src = json[0].url;
                        j[0].url = json[0].url;
                        localStorage.setItem("queue", JSON.stringify(j));
                        document.getElementById("loaded").style.display = "";
                        document.getElementById("loading").style.display = "none";
                        document.getElementById("actualPlayer").play();
                    }
                } else {
                    var q = JSON.parse(localStorage.getItem("queue"));
                    var j = [
                        {
                            "cover":json.data.images[json.data.images.length - 1],
                            "artist": {
                                "link": "#artist#" + json.data.artistName,
                                "name": json.data.artistName,
                            },
                            "track": {
                                "name": json.data.name,
                                "link": "#album#" + json.data.albumName + ":::" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName,
                                "id": json.data.name + "_" + json.data.artistName
                            }
                        }
                    ];
                    q.push(n);
                    var q = JSON.stringify(q);
                    localStorage.setItem("queue", q);
                    xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artist.name) + "&track=" + encodeURIComponent(json.data.title));
                    xhr.send();
                    xhr.onload = function() {
                        var json2 = JSON.parse(xhr.responseText);
                        var q = JSON.parse(q);
                        q[q.length - 1].url = json2[0].url;
                        var q = JSON.stringify(q);
                        localStorage.setItem("queue", q);
                    }
                }
            } else if (json.source == "youtube") {
                if (!document.getElementById("player").getAttribute("playing-id")) {
                    if (json.data.videoDetails.thumbnails) {var cover = json.data.videoDetails.thumbnails[json.data.videoDetails.thumbnails - 1].url;} else {var cover = "icon.png"}
                    document.getElementById("cover").src = cover;
                    document.getElementById("artistLink").href = "#artist#" + json.data.videoDetails.externalChannelId;
                    document.getElementById("artistName").innerHTML = json.data.videoDetails.ownerChannelName;
                    document.getElementById("trackLink").href = "#track#" + json.data.videoDetails.videoId + "_" + json.data.videoDetails.externalChannelId;
                    document.getElementById("trackName").innerHTML = json.data.videoDetails.title;
                    var j = [
                        {
                            "cover":cover,
                            "artist": {
                                "link": "#artist#" + json.data.videoDetails.externalChannelId,
                                "name": json.data.videoDetails.ownerChannelName,
                            },
                            "track": {
                                "name": json.data.videoDetails.title,
                                "link": "#track#" + json.data.videoDetails.videoId + "_" + json.data.videoDetails.externalChannelId,
                                "id": json.data.videoDetails.videoId + "_" + json.data.videoDetails.externalChannelId
                            }
                        }
                    ]
                    localStorage.setItem("queue", JSON.stringify(j));
                    document.getElementById("progress").innerHTML = "Getting stream URL...";
                    xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artistName) + "&track=" + encodeURIComponent(json.data.name));
                    xhr.send();
                    xhr.onload = function() {
                        document.getElementById("progress").innerHTML = "Loading stream data...";
                        var json = JSON.parse(xhr.responseText);
                        document.getElementById("actualPlayer").src = json[0].url;
                        j[0].url = json[0].url;
                        localStorage.setItem("queue", JSON.stringify(j));
                        document.getElementById("loaded").style.display = "";
                        document.getElementById("loading").style.display = "none";
                        document.getElementById("actualPlayer").play();
                    }
                } else {
                    var q = JSON.parse(localStorage.getItem("queue"));
                    var j = [
                        {
                            "cover":cover,
                            "artist": {
                                "link": "#artist#" + json.data.videoDetails.externalChannelId,
                                "name": json.data.videoDetails.ownerChannelName,
                            },
                            "track": {
                                "name": json.data.videoDetails.title,
                                "link": "#track#" + json.data.videoDetails.videoId + "_" + json.data.videoDetails.externalChannelId,
                                "id": json.data.videoDetails.videoId + "_" + json.data.videoDetails.externalChannelId
                            }
                        }
                    ]
                    q.push(n);
                    var q = JSON.stringify(q);
                    localStorage.setItem("queue", q);
                    xhr.open("GET", "/api/get/track/stream?track=" + encodeURIComponent(json.data.videoDetails.videoId));
                    xhr.send();
                    xhr.onload = function() {
                        var json2 = JSON.parse(xhr.responseText);
                        var q = JSON.parse(q);
                        q[q.length - 1].url = json2[0].url;
                        var q = JSON.stringify(q);
                        localStorage.setItem("queue", q);
                    }
                }
                // HAHAHAH
            }
        }
    } else {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/get/track?id=" + id);
        xhr.send();
        xhr.onload = function () {
            var json = JSON.parse(xhr.responseText);
            if (json.source == "deezer") {
                var q = JSON.parse(localStorage.getItem("queue"));
                var ni = {
                    "cover":json.data.album.cover_xl,
                    "artist": {
                        "link": "#artist#" + json.data.artist.id,
                        "name": json.data.artist.name,
                    },
                    "track": {
                        "name": json.data.title,
                        "link": "#album#" + json.data.album.id + "#track#" + json.data.id,
                        "id": json.data.id
                    }
                }
                q.push(ni);
                localStorage.setItem("queue", JSON.stringify(q));
                xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artist.name) + "&track=" + encodeURIComponent(json.data.title));
                xhr.send();
                xhr.onload = function() {
                    var j2 = JSON.parse(xhr.responseText);
                    q[q.length - 1].url = j2[0].url;
                    localStorage.setItem("queue", JSON.stringify(q));
                }
            } else if (json.source == "lastfm") {
                var q = JSON.parse(localStorage.getItem("queue"));
                var ni = {
                    "cover":json.data.images[json.data.images.length - 1],
                    "artist": {
                        "link": "#artist#" + json.data.artistName,
                        "name": json.data.artistName,
                    },
                    "track": {
                        "name": json.data.name,
                        "link": "#album#" + json.data.albumName + ":::" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName,
                        "id": json.data.name + "_" + json.data.artistName
                    }
                };
                q.push(ni);
                localStorage.setItem("queue", JSON.stringify(q));
                xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artistName) + "&track=" + encodeURIComponent(json.data.name));
                xhr.send();
                xhr.onload = function() {
                    var j2 = JSON.parse(xhr.responseText);
                    q[q.length - 1].url = j2[0].url;
                    localStorage.setItem("queue", JSON.stringify(q));
                }
            } else if (json.source == "youtube") {
                var q = JSON.parse(localStorage.getItem("queue"));
                var ni = {
                    "cover":json.data.videoDetails.thumbnails[json.data.videoDetails.thumbnails-1].url,
                    "artist": {
                        "link": "#artist#" + json.data.artist.id,
                        "name": json.data.artist.name,
                    },
                    "track": {
                        "name": json.data.title,
                        "link": "#album#" + json.data.album.id + "#track#" + json.data.id,
                        "id": json.data.id
                    }
                }
                q.push(ni);
                localStorage.setItem("queue", JSON.stringify(q));
                xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artist.name) + "&track=" + encodeURIComponent(json.data.title));
                xhr.send();
                xhr.onload = function() {
                    var j2 = JSON.parse(xhr.responseText);
                    q[q.length - 1].url = j2[0].url;
                    localStorage.setItem("queue", JSON.stringify(q));
                }
            }
        }
    }
}

function showQC() {
    var b = [
        "queueLink",
        "previousBtn",
        "nextBtn"
    ];
    for (var c in b) {
        document.getElementById(b[c]).style.display = "inline-block";
    }
    document.getElementById("loading").style.display = "none";
    document.getElementById("loaded").style.display = "";
}

function hideQC() {
    var b = [
        "queueLink",
        "previousBtn",
        "nextBtn"
    ];
    for (var c in b) {
        document.getElementById(b[c]).style.display = "none";
    }
}

function checkQueue() {
    if (localStorage.getItem("queue")) {
        if (!localStorage.getItem("queuePosition")) { localStorage.setItem("queuePosition", "0"); }
        var pos = parseInt(localStorage.getItem("queuePosition"));
        var q = JSON.parse(localStorage.getItem("queue"));
        if (q[pos]) {
            document.getElementById("cover").src = q[pos].cover;
            if (q[pos].track == undefined) {clearQueue(); return;}
            document.getElementById("trackLink").href = q[pos].track.link;
            document.getElementById("trackName").innerHTML = q[pos].track.name;
            document.getElementById("artistLink").href = q[pos].artist.link;
            document.getElementById("artistName").innerHTML = q[pos].artist.name;
            document.getElementById("player").setAttribute("playing-id", q[pos].track.id);
            if (q[pos].url) {
                document.getElementById("actualPlayer").src = q[pos].url;
                makePlayerVisible();
                showQC();
            } else {
                makePlayerVisible();
                document.getElementById("loaded").style.display = "none";
                document.getElementById("loading").style.display = "";
                document.getElementById("progress").innerHTML = "Getting stream URL..."
                var xhr = new XMLHttpRequest();
                xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(json.data.artist.name) + "&track=" + encodeURIComponent(json.data.title));
                xhr.send();
                xhr.onload = function() {
                    document.getElementById("progress").innerHTML = "Loading stream data...";
                    var json = JSON.parse(xhr.responseText);
                    document.getElementById("actualPlayer").src = json[0].url;
                    var q = JSON.parse(localStorage.getItem("queue"));
                    q[0].url = json[0].url;
                    localStorage.setItem("queue", JSON.stringify(q));
                    showQC();
                }
            }
        }
    }
}

function queuePage() {
    var q = JSON.parse(localStorage.getItem("queue"));
    document.getElementById("queueListing").innerHTML = "";
    for (var pos in q) {
        var div = document.createElement("DIV");
        div.id = "pos" + pos;
        div.onclick = function() { setQueuePosition(this.id.toString().substring(3), true); }
        div.classList.add("chip");
        var cover = document.createElement("IMG");
        cover.src = q[pos].cover;
        div.appendChild(cover);
        var tl = document.createElement("A");
        tl.onclick = function() {return false;}
        tl.href = q[pos].track.link;
        var tn = document.createElement("H2");
        tn.innerHTML = q[pos].track.name;
        tl.appendChild(tn);
        div.appendChild(tl);
        var al = document.createElement("A");
        al.href = q[pos].artist.link;
        al.onclick = function() {return false;}
        var an = document.createElement("H3");
        an.innerHTML = q[pos].artist.name;
        al.appendChild(an);
        div.appendChild(al);
        document.getElementById("queueListing").appendChild(div);
    }
}

function setQueuePosition(place, playChoice) {
    var q = JSON.parse(localStorage.getItem("queue"));
    var pos = parseInt(place);
    if (q[pos]) {
        if (q[pos][0]) {}
        document.getElementById("cover").src = q[pos].cover;
        document.getElementById("trackLink").href = q[pos].track.link;
        document.getElementById("trackName").innerHTML = q[pos].track.name;
        document.getElementById("artistLink").href = q[pos].artist.link;
        document.getElementById("artistName").innerHTML = q[pos].artist.name;
        document.getElementById("player").setAttribute("playing-id", q[pos].track.id);
        if (q[pos].url) {
            document.getElementById("actualPlayer").src = q[pos].url;
            makePlayerVisible();
            showQC();
            localStorage.setItem("queuePosition", pos.toString());
            if (playChoice == true) {document.getElementById("actualPlayer").play();}
        } else {
            document.getElementById("loading").style.display = "";
            document.getElementById("loaded").style.display = "none";
            document.getElementById("progress").innerHTML = "Getting stream URL...";
            var xhr = new XMLHttpRequest();
            xhr.open("GET", "/api/get/track/stream?artist=" + encodeURIComponent(q[pos].artist.name) + "&track=" + encodeURIComponent(q[pos].track.name));
            xhr.send();
            xhr.onload = function() {
                document.getElementById("progress").innerHTML = "Loading stream data...";
                var json = JSON.parse(xhr.responseText);
                if (json.err) {
                    document.getElementById("progress").innerHTML = "We could not find a valid source for this.<br>We will skip to the next track in 5 seconds...";
                    setTimeout(function () {removeFromQueue(localStorage.getItem("queuePosition"));}, 5000)
                    return;
                }
                document.getElementById("actualPlayer").src = json[0].url;
                q[pos].url = json[0].url;
                var qs = JSON.stringify(q);
                localStorage.setItem("queue", qs);
                localStorage.setItem("queuePosition", pos.toString());
                if (playChoice == true) {document.getElementById("actualPlayer").play();}
                document.getElementById("loading").style.display = "none";
                document.getElementById("loaded").style.display = "";
            }
        }
    }
}

function clearQueue() {
    localStorage.removeItem("queue");
    localStorage.removeItem("queuePosition");
    if (window.location.hash == "#queue") {window.open("#", "_self")}
}

function goToPrev() {
    var q = JSON.parse(localStorage.getItem("queue"));
    var pos = parseInt(localStorage.getItem("queuePosition"));
    var pPos = pos - 1;
    if (q[pPos]) {
        setQueuePosition(pPos, true);
    } else {
        document.getElementById("actualPlayer").currentTime = 0;
    }
}

function goToNext() {
    var q = JSON.parse(localStorage.getItem("queue"));
    var pos = parseInt(localStorage.getItem("queuePosition"));
    var nPos = pos + 1;
    if (q[nPos]) {
        setQueuePosition(nPos, true);
    } else if (localStorage.getItem("loopMode") && localStorage.getItem("loopMode") == "1") {
        setQueuePosition(0, true);
    } else if (localStorage.getItem("loopMode") && localStorage.getItem("loopMode") == "2") {
        setQueuePosition(pos, true);
    }
}

function removeFromQueue(pos) {
    var q = JSON.parse(localStorage.getItem("queue"));
    var nq = [];
    for (var c in q) {if (c !== pos) {nq.push(q[c]);}}
    localStorage.setItem("queue", JSON.stringify(nq));
    var n = parseInt(localStorage.getItem("queuePosition"));
    if (n == pos) {
        if (nq[pos - 1]) {
            setQueuePosition((pos - 1));
        } else if (nq[pos + 1]) {
            setQueuePosition((pos + 1));
        } else {
            document.getElementById("trackName").innerHTML = "Nothing is playing.";
            document.getElementById("artistName").innerHTML = "Blazebury Music";
            document.getElementById("cover").src = "icon.png";
        }
    } else if (n > pos) {
        var nn = (n - 1).toString();
        localStorage.setItem("queuePosition", nn);
    } else if (n < pos) {
        var nn = (n + 1).toString();
        localStorage.setItem("queuePosition", nn);
    }
}


function toggleLoop() {
    // 0 = loop off
    // 1 = loop queue
    // 2 = loop single
    if (!localStorage.getItem("loopMode") || localStorage.getItem("loopMode") == "0") {
        // go to 1
        localStorage.setItem("loopMode", "1");
        document.getElementById("loopBtn").innerHTML = "repeat_on";
    } else if (localStorage.getItem("loopMode") == "1") {
        // go to 2
        localStorage.setItem("loopMode", "2");
        document.getElementById("loopBtn").innerHTML = "repeat_one_on";
    } else if (localStorage.getItem("loopMode") == "2") {
        // go to 0
        localStorage.setItem("loopMode", "0");
        document.getElementById("loopBtn").innerHTML = "repeat";
    }
}

function setLoop() {
    if (!localStorage.getItem("loopMode") || localStorage.getItem("loopMode") == "0") {
        document.getElementById("loopBtn").innerHTML = "repeat";
    } else if (localStorage.getItem("loopMode") == "1") {
        document.getElementById("loopBtn").innerHTML = "repeat_on";
    } else if (localStorage.getItem("loopMode") == "2") {
        document.getElementById("loopBtn").innerHTML = "repeat_one_on";
    }
}

function checkPresence() {
    if (!sessionStorage.getItem("drpc")) {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/config");
        xhr.send();
        xhr.onload = function () {
            var json = JSON.parse(xhr.responseText);
            if (json.discordRpc == "true") {
                sessionStorage.setItem("drpc", "true");
                return "true"
            } else {
                sessionStorage.setItem("drpc", "false");
                return "false";
            }
        }
    } else {
        return sessionStorage.getItem("drpc");
    }
}

function setPresence(act) {
    if (checkPresence() == "true") {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/setPresence?title=" + document.getElementById("trackName").innerHTML + "&artist=" + document.getElementById("artistName").innerHTML + "&act=" + act);
        xhr.send();
        xhr.onload = function() {
            var json = JSON.parse(xhr.responseText);
            if (json.success == true) {return true;}
            else {return false;}
        }
    } else {
        return null;
    }
}

function getLyrics() {
    document.getElementById("lyricsPage").innerHTML = "Loading...";
    var artist = document.getElementById("artistName").innerHTML;
    var track = document.getElementById("trackName").innerHTML;
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "/api/get/lyrics?artist=" + artist + "&title=" + track);
    xhr.send();
    xhr.onload = function () {
        var resp = xhr.responseText;
        document.getElementById("lyricsPage").innerHTML = resp.replace(/\n/g, "<br />");
    }
}

function getArtist() {
    document.getElementById("artistPage").style.display = "none";
    document.getElementById("artistLoad").style.display = "";
    var xhr = new XMLHttpRequest();
    var id = window.location.hash.split("#").slice(1)[1]
    xhr.open("GET", "/api/get/artist?id=" + id);
    xhr.send();
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        document.getElementById("artistLoad").style.display = "none";
        document.getElementById("artistPage").style.display = "";
        if (json.source == "deezer") {
            document.getElementById("artistCover").src = json.data.picture_xl;
            document.getElementById("artName").innerHTML = json.data.name;
            document.getElementById("albumCount").innerHTML = json.data.nb_album;
            document.getElementById("artFollowerCount").innerHTML = json.data.nb_fan.toLocaleString();
            document.getElementById("artNumCat1").innerHTML = "followers";
            document.getElementById("artNumSrc1").innerHTML = "Deezer";
            dumpIntoSection("/api/get/artist/albums?id=" + id, "artAlbums");
        } else if (json.source == "lastfm") {
            document.getElementById("artistCover").src = json.data.images[json.data.images.length - 1];
            document.getElementById("artName").innerHTML = json.data.name;
            document.getElementById("artBio").innerHTML = json.data.summary;
            document.getElementById("artFollowerCount").innerHTML = json.data.listeners.toLocaleString();
            document.getElementById("artNumCat1").innerHTML = "listeners";
            document.getElementById("artNumSrc1").innerHTML = "Last.fm";
            document.getElementById("artAlbCountContainer").style.display = "none";
            dumpIntoSection("/api/get/artist/albums?id=" + id, "artAlbums");
        } else if (json.source == "youtube") {
            // nothing coded yet
            document.getElementById("artistCover").src = json.data.info.authorThumbnails[json.data.info.authorThumbnails.length-1].url;
            document.getElementById("artName").innerHTML = json.data.info.author;
            document.getElementById("albumCount").innerHTML = json.data.playlists.items.length.toLocaleString();
            document.getElementById("albumUnit").innerHTML = "playlists";
            document.getElementById("albumSectionUnit").innerHTML = "Playlists";
            document.getElementById("artFollowerCount").innerHTML = json.data.info.subscriberCount.toLocaleString();
            document.getElementById("artNumCat1").innerHTML = "subscribers";
            document.getElementById("artNumSrc1").innerHTML = "YouTube";
            //document.getElementById("albumsContainer").style.display = "none"
            dumpIntoSection("/api/get/artist/albums?id=" + json.data.info.authorId, "artAlbums");
        }
    }
}

function getAlbum() {
    document.getElementById("albumPage").style.display = "none";
    document.getElementById("albumLoad").style.display = "";
    document.getElementById("tracklist").innerHTML = "";
    var xhr = new XMLHttpRequest();
    var id = window.location.hash.split("#").slice(1)[1]
    xhr.open("GET", "/api/get/album?id=" + id);
    xhr.send();
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        document.getElementById("albumLoad").style.display = "none";
        document.getElementById("albumPage").style.display = "";
        if (json.source == "deezer") {
            document.getElementById("albumCover").src = json.data.cover_big;
            document.getElementById("albName").innerHTML = json.data.title;
            document.getElementById("albArtist").innerHTML = json.data.artist.name;
            document.getElementById("albArtLink").href = "#artist#" + json.data.artist.id;
            document.getElementById("albFollowerCount").innerHTML = json.data.fans.toLocaleString();
            document.getElementById("albNumCat1").innerHTML = "followers";
            document.getElementById("albNumSrc1").innerHTML = "Deezer";
            document.getElementById("trackCount").innerHTML = json.data.tracks.data.length.toLocaleString();
            document.getElementById("tracklist").innerHTML = "";
            if (!json.data.tracks || !json.data.tracks.data || !json.data.tracks.data[0]) {
                document.getElementById("tracklist").style.display = "none";
                document.getElementById("tracklistErr").style.display = "";
            } else {
                document.getElementById("tracklist").style.display = "";
                document.getElementById("tracklistErr").style.display = "none";
                for (var c in json.data.tracks.data) {
                    var div = document.createElement("DIV");
                    div.classList.add("chip");
                    div.id = json.data.tracks.data[c].id;
                    div.onclick = function () { getStream(this.id); }
                    var tn = document.createElement("H2");
                    tn.innerHTML = json.data.tracks.data[c].title;
                    div.appendChild(tn);
                    document.getElementById("tracklist").appendChild(div);
                }
            }
        } else if (json.source == "lastfm") {
            document.getElementById("albumCover").src = json.data.images[json.data.images.length - 1];
            document.getElementById("albName").innerHTML = json.data.name;
            document.getElementById("albArtist").innerHTML = json.data.artistName;
            document.getElementById("albArtLink").href = "#artist#" + json.data.artistName;
            document.getElementById("albFollowerCount").innerHTML = json.data.listeners.toLocaleString();
            document.getElementById("albNumCat1").innerHTML = "listeners";
            document.getElementById("albNumSrc1").innerHTML = "Last.fm";
            document.getElementById("trackCount").innerHTML = json.data.tracks.length.toLocaleString();
            if (!json.data.tracks || !json.data.tracks[0]) {
                document.getElementById("tracklist").style.display = "none";
                document.getElementById("tracklistErr").style.display = "";
            } else {
                document.getElementById("tracklist").style.display = "";
                document.getElementById("tracklistErr").style.display = "none";
                for (var c in json.data.tracks) {
                    var div = document.createElement("DIV");
                    div.classList.add("chip");
                    div.id = json.data.tracks[c].name + ":::" + json.data.tracks[c].artistName;
                    div.onclick = function () { getStream(this.id); }
                    var tn = document.createElement("H2");
                    tn.innerHTML = json.data.tracks[c].name;
                    div.appendChild(tn);
                    document.getElementById("tracklist").appendChild(div);
                }
            }
        } else if (json.source == "youtube") {
            document.getElementById("albumCover").src = json.data.bestThumbnail.url;
            document.getElementById("albName").innerHTML = json.data.title;
            if (json.data.author) {
              document.getElementById("albArtist").innerHTML = json.data.author.name;
              document.getElementById("albArtLink").href = "#artist#" + json.data.author.channelID;
            }else{
              document.getElementById("albArtist").innerHTML = json.data.items[0].author.name;
              document.getElementById("albArtLink").href = "#artist#" + json.data.items[0].author.channelID;
            }
            document.getElementById("albFollowerCount").innerHTML = json.data.views.toLocaleString();
            document.getElementById("albNumCat1").innerHTML = "views";
            document.getElementById("albNumSrc1").innerHTML = "YouTube";
            document.getElementById("trackCount").innerHTML = json.data.items.length.toLocaleString();
            document.getElementById("tracklist").innerHTML = "";
            if (!json.data.items || !json.data.items[0]) {
                document.getElementById("tracklist").style.display = "none";
                document.getElementById("tracklistErr").style.display = "";
            } else {
                document.getElementById("tracklist").style.display = "";
                document.getElementById("tracklistErr").style.display = "none";
                for (var c in json.data.items) {
                    var div = document.createElement("DIV");
                    div.classList.add("chip");
                    div.id = json.data.items[c].id;
                    div.onclick = function () { getStream(this.id); }
                    var tn = document.createElement("H2");
                    tn.innerHTML = json.data.items[c].title;
                    div.appendChild(tn);
                    document.getElementById("tracklist").appendChild(div);
                }
            }
        }
    }
}

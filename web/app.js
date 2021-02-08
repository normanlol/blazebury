refresh();
checkQueue();
if (checkPresence() == "true") {
    setPresence("pause");
}
document.getElementById("loaded").style.display = "none";
document.getElementById("progress").innerHTML = "No song is loaded.";

window.addEventListener("click", function() {
    if(menuVisible == true) {toggleMenu("hide");}
});

window.addEventListener("contextmenu", function(e) {
    if (e.target.classList.contains("sectBlob") || e.target.parentElement !== null && e.target.parentElement.classList.contains("sectBlob")) {
        e.preventDefault();
        if (e.target.parentElement.classList.contains("sectBlob")) { var sId = e.target.parentElement.id;}
        else { var sId = e.target.id; }
        document.querySelector(".menu").setAttribute("id", sId + "_context");
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
            setQueuePosition(nPos, true);
        } else {
            return;
        }
    }
})

document.getElementById("actualPlayer").addEventListener("error", function(error) {
    document.getElementById("loading").style.display = "";
    document.getElementById("loaded").style.display = "none";

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

function refresh() {
    setTimeout(function () {
        if (window.location.hash) {
            if (window.location.hash == "#") {
                document.getElementById("settings").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("home").style.display = "";
                document.getElementById("search").style.display = "none";
                document.getElementById("queue").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "none";
                dumpIntoSection("/api/get/trending", "sect1");
            } else if (window.location.hash == "#settings") {
                document.getElementById("settings").style.display = "";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("queue").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "none";
                getSettings();
            } else if (window.location.hash == "#about") {
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("about").style.display = "";
                document.getElementById("queue").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "none";
                document.getElementById("nodeVers").innerHTML = process.versions.node;
                document.getElementById("chromeVers").innerHTML = process.versions.chrome;
                document.getElementById("electronVers").innerHTML = process.versions.electron;
            } else if (window.location.hash == "#search") {
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("queue").style.display = "none";
                document.getElementById("artist").style.display = "none";
                document.getElementById("q").focus();
            } else if (window.location.hash == "#queue") {
                document.getElementById("queue").style.display = "";
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "none";
                queuePage();
            } else if (window.location.hash == "#lyrics") {
                document.getElementById("queue").style.display = "none";
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("lyrics").style.display = "";
                document.getElementById("artist").style.display = "none";
            } else if (window.location.hash.split("#").slice(1)[0] == "artist") {
                document.getElementById("queue").style.display = "none";
                document.getElementById("settings").style.display = "none";
                document.getElementById("home").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("artist").style.display = "";
                getArtist();
            } else {
                document.getElementById("settings").style.display = "none";
                document.getElementById("about").style.display = "none";
                document.getElementById("search").style.display = "none";
                document.getElementById("lyrics").style.display = "none";
                document.getElementById("home").style.display = "";
                document.getElementById("queue").style.display = "none";
                document.getElementById("artist").style.display = "none";
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
                var div = document.createElement("DIV");
                div.classList.add("sectBlob");
                div.id = json.data.data[c].id;
                div.onclick = function () {getStream(this.id)}
                var cover = document.createElement("IMG");
                cover.src = json.data.data[c].album.cover_big;
                cover.title = "Cover of " + json.data.data[c].album.title + " by " + json.data.data[c].artist.name;
                cover.alt = "Cover of " + json.data.data[c].album.title + " by " + json.data.data[c].artist.name;
                div.appendChild(cover);
                var title = document.createElement("H3");
                title.innerHTML = json.data.data[c].title_short;
                div.appendChild(title);
                var author = document.createElement("H4");
                author.innerHTML = json.data.data[c].artist.name;
                div.appendChild(author);
                document.getElementById(id).appendChild(div);  
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
            document.getElementById("trackLink").href = "#album#" + json.data.albumName + ":" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName;
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
                            "link": "#album#" + json.data.albumName + ":" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName,
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
        }
    }
}

function makePlayerVisible() {
    if (document.getElementById("player").visible == "1") {return;} 
    else {
        document.getElementById("player").style = "margin-bottom:0;";
        document.getElementById("player").visible = "1";
        document.getElementById("showPlayer").style.display = "none";
        document.getElementById("hidePlayer").style.display = "";
    }
}

function hidePlayer() {
    if (document.getElementById("player").visible == "0") {return;} 
    else {
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
        document.getElementById("sLoading").style.display = "none";
        document.getElementById("sContents").style.display = "";
    }
}

function saveSettings() {
    var url = "/api/editConfig?lastFmKey=" + document.getElementById("lfmKey").value + "&dataSource=" + document.getElementById("dataSrc").value + "&discordRpc=" + document.getElementById("discordRpc").value + "&discordRpcId=" + document.getElementById("discordRpcId").value;
    window.open(url, "_self");
}

function search() {
    setTimeout(function() {
        var xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/search?q=" + document.getElementById("q").value);
        xhr.send();
        xhr.onload = function () {
            var json = JSON.parse(xhr.responseText);
            document.getElementById("results").innerHTML = "";
            if (!json.results && json.err) {document.getElementById("results").innerHTML = "Error retreiving results. <i>" + json.err.message + "</i>"; return;}
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
                        div.appendChild(cover);
                        var title = document.createElement("H3");
                        title.innerHTML = json.results.data[c].title_short;
                        div.appendChild(title);
                        var author = document.createElement("H4");
                        author.innerHTML = json.results.data[c].artist.name;
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
                    div.id = json.results.result.tracks[c].name + ":" + json.results.result.tracks[c].artistName;
                    div.onclick = function () {getStream(this.id)}
                    var cover = document.createElement("IMG");
                    cover.src = json.results.result.tracks[c].images[json.results.result.tracks[c].images.length - 1];
                    cover.onerror = function () {this.src = "icon.png";}
                    cover.title = "Cover of " + json.results.result.tracks[c].name + " by " + json.results.result.tracks[c].artistName;
                    cover.alt = "Cover of " + json.results.result.tracks[c].name + " by " + json.results.result.tracks[c].artistName;
                    div.appendChild(cover);
                    var title = document.createElement("H3");
                    title.innerHTML = json.results.result.tracks[c].name;
                    div.appendChild(title);
                    var author = document.createElement("H4");
                    author.innerHTML = json.results.result.tracks[c].artistName;
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
    }, 10)
}

function addToQueue(id) {
    var id = id.split("_")[0];
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
                        var q = JSON.parse(q);
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
                    document.getElementById("trackLink").href = "#album#" + json.data.albumName + ":" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName;
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
                                "link": "#album#" + json.data.albumName + ":" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName,
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
                                "link": "#album#" + json.data.albumName + ":" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName,
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
            } else {
                var q = JSON.parse(localStorage.getItem("queue"));
                var ni = {
                    "cover":json.data.images[json.data.images.length - 1],
                    "artist": {
                        "link": "#artist#" + json.data.artistName,
                        "name": json.data.artistName,
                    },
                    "track": {
                        "name": json.data.name,
                        "link": "#album#" + json.data.albumName + ":" + json.data.artistName + "#track#" + json.data.name + "_" + json.data.artistName,
                        "id": json.data.name + "_" + json.data.artistName
                    }
                };
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
                document.getElementById("loading").style.display = "none";
                document.getElementById("loaded").style.display = "";
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
                    document.getElementById("loaded").style.display = "";
                    document.getElementById("loading").style.display = "none";
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
    }
}

function goToNext() {
    var q = JSON.parse(localStorage.getItem("queue"));
    var pos = parseInt(localStorage.getItem("queuePosition"));
    var nPos = pos + 1;
    if (q[nPos]) {
        setQueuePosition(nPos, true);
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
    var xhr = new XMLHttpRequest();
    var id = window.location.hash.split("#").slice(1)[1]
    xhr.open("GET", "/api/get/artist?id=" + id);
    xhr.send();
    xhr.onload = function () {
        var json = JSON.parse(xhr.responseText);
        if (json.source == "deezer") {
            // tba
        } else if (json.source == "lastfm") {
            document.getElementById("artistCover").src = json.data.images[json.data.images.length - 1];
            document.getElementById("artName").innerHTML = json.data.name;
            document.getElementById("artBio").innerHTML = json.data.summary;
        }
    }
}
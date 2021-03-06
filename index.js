console.log("Blazebury is starting...");
console.log("Version 0.2.0");
require('dotenv').config()
const { app, BrowserWindow } = require('electron');
const http = require("http");
const url = require("url");
const fs = require("fs");
if (!fs.existsSync("config.json")) {
    fs.writeFileSync("config.json", JSON.stringify({
        "lastFmKey": "",
        "dataSource": 1,
        "discordRpc": "true",
        "discordRpcId": "807855379388170271"
    }));
}
const config = JSON.parse(fs.readFileSync("config.json"));
if (config.lastFmKey == "") {
    if (process.env.lastFmKey != undefined) {
        var lfmKey = process.env.lastFmKey;
    } else {
        var lfmKey = "--only-replace-if-you-have-a-key--"
    }
} else {
    var lfmKey = config.lastFmKey;
}
config.dataSource = parseInt(config.dataSource);
const LastFM = require("last-fm");
const lastfm = new LastFM(lfmKey, { userAgent: "BlazeburyMusic/0.2.0", minArtistListeners: 50, minTrackListeners: 100 });
const DeezerPublicApi = require('deezer-public-api');
const deezer = new DeezerPublicApi();
const ytsr = require("ytsr");
const ytdl = require("ytdl-core");
const ytpl = require("ytpl");
const ytch = require("yt-channel-info");
const scdl = require("soundcloud-downloader");
const scKey = require("soundcloud-key-fetch");
const scSearcher = require("sc-searcher");
const scSearch = new scSearcher();
const drpc = require("discord-rich-presence")(config.discordRpcId);
const ftl = require("findthelyrics");

app.whenReady().then(bootup);

app.on("window-all-closed", function() {
    app.quit();
});

app.on("activate", function() {
    if (BrowserWindow.getAllWindows().length == 0) {
        bootup();
    }
})

async function bootup() {
    const w = new BrowserWindow({
        background:"#282828",
        icon:"assets/icon.png",
        title:"Blazebury Music",
        width:1100,
        height:900,
        minWidth:515,
        frame:false,
        webPreferences: {
            nativeWindowOpen:true,
            contextIsolation:false,
            nodeIntegration:true,
            enableRemoteModule:true
        }
    });
    w.setBackgroundColor("#000000");
    w.loadFile("preload/index.html");
    var k = await scKey.fetchKey();
    var r = await scKey.testKey(k);
    if (r == true) { scSearch.init(k); }
    http.createServer(renderServer).listen(808);
    w.loadURL("http://localhost:808");
}


async function renderServer(request, res) {
    var u = url.parse(request.url, true);
    var path = u.pathname;
    if (path.substr(0,4) == "/api") {
        var path = path.split("/").slice(1);
        switch(path[1]) {
            case "search":
                if (u.query.q) {
                    if (config.dataSource == 1) {
                        deezer.search(u.query.q).then(function(data) {
                            var j = JSON.stringify({
                                "results": data,
                                "source": "deezer"
                            });
                            res.writeHead(200, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        }).catch(function(err) {
                            var j = JSON.stringify({
                                "err": {
                                    "code": err.code,
                                    "message": err.message
                                }
                            });
                            res.writeHead(500, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        })
                    } else if (config.dataSource == 2) {
                        lastfm.search({q: u.query.q, limit:100}, function(err, data) {
                            if (err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            } else {
                                var j = JSON.stringify({
                                    "results": data,
                                    "source": "lastfm"
                                });
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }
                        })
                    } else if (config.dataSource == 3) {
                        ytsr(u.query.q+' "music"').then(function(data) {
                            var j = JSON.stringify({
                                "results": data,
                                "source": "youtube"
                            });
                            res.writeHead(200, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        }).catch(function(err) {
                            var j = JSON.stringify({
                                "err": {
                                "code": err.code,
                                "message": err.message
                            }
                            });
                            res.writeHead(500, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        })
                    }
                } else {
                    var j = JSON.stringify({
                        "err": {
                            "code": "reqsNotMet",
                            "message": "A query is required for this endpoint."
                        }
                    });
                    res.writeHead(500, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type":"application/json"
                    })
                    res.end(j);
                }
            return;

            case "get":
                if (path[2] == "track" && !path[3]) {
                    if (config.dataSource == 1) {
                        if (u.query.id) {
                            deezer.track(u.query.id).then(function(data) {
                                var j = JSON.stringify({
                                    data,
                                    "source": "deezer"
                                });
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }).catch(function(err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            });
                        } else {
                            var j = JSON.stringify({
                                "err": {
                                    "code": "reqsNotMet",
                                    "message": "A track ID is required for this endpoint."
                                }
                            });
                            res.writeHead(500, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        }
                    } else if (config.dataSource == 2) {
                        if (u.query.id && u.query.id.split(":::").length > 1) {
                            lastfm.trackInfo({artistName: u.query.id.split(":::")[1], name: u.query.id.split(":::")[0]}, function(err, data) {
                                if (data) {
                                    var j = JSON.stringify({
                                        data,
                                        "source": "lastfm"
                                    });
                                    res.writeHead(200, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                } else {
                                    var j = JSON.stringify({
                                        "err": {
                                            "code": err.code,
                                            "message": err.message
                                        }
                                    });
                                    res.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                }
                            })
                        } else {
                            var j = JSON.stringify({
                                "err": {
                                    "code": "reqsNotMet",
                                    "message": "A track name and artist name are required for this endpoint."
                                }
                            });
                            res.writeHead(500, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        }
                    } else if (config.dataSource == 3) {
                        if (u.query.id) {
                            ytdl.getInfo(u.query.id).then(function(data) {
                                var j = JSON.stringify({
                                    data,
                                    "source": "youtube"
                                });
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }).catch(function(err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            });
                        } else {
                            var j = JSON.stringify({
                                "err": {
                                    "code": "reqsNotMet",
                                    "message": "A track ID is required for this endpoint."
                                }
                            });
                            res.writeHead(500, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        }
                    }
                } else if (path[2] == "track" && path[3] == "stream") {
                    if (u.query.track) {
                        if (!u.query.artist && config.dataSource !== 3) {
                            var j = JSON.stringify({
                                "err": {
                                    "code": "reqsNotMet",
                                    "message": "A track name and artist name are required for this endpoint."
                                }
                            });
                            res.writeHead(500, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        }
                        var fq;
                        if (config.dataSource !== 3) {
                            fq = '"' + u.query.track.toLowerCase() + '"';
                            fq = '"' + u.query.artist.toLowerCase() + '"' + fq
                            fq = fq + ' "auto generated"';
        
                            ytsr(fq).then(function(data) {
                                if (data.items[0]) {
                                    if (data.items[0].type == "video") {
                                        if (u.query.track.toLowerCase() == data.items[0].title.toLowerCase()) {
                                            ytdl(data.items[0].url).on("info", function(info) {
                                                for (var c in info.formats) {
                                                    var i = [];
                                                    if (info.formats[c].audioQuality && !info.formats[c].isHLS && !info.formats[c].isDashMPD) {
                                                        var o = info.formats[c];
                                                        i.push(o);
                                                    }
                                                }
                                                if (i.length > 0) {
                                                    var j = JSON.stringify(i);
                                                    res.writeHead(200, {
                                                        "Access-Control-Allow-Origin": "*",
                                                        "Content-Type":"application/json"
                                                    })
                                                    res.end(j);
                                                } else {
                                                    var j = JSON.stringify({
                                                        "err": {
                                                            "code": "noFormats",
                                                            "message": "A valid format could not be found."
                                                        }
                                                    });
                                                    res.writeHead(500, {
                                                        "Access-Control-Allow-Origin": "*",
                                                        "Content-Type":"application/json"
                                                    })
                                                    res.end(j);
                                                }
                                            }).on("error",function(err) {
                                                var j = JSON.stringify({
                                                    "err": {
                                                        "code": err.code,
                                                        "message": err.message
                                                    }
                                                });
                                                res.writeHead(500, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type":"application/json"
                                                })
                                                res.end(j);
                                            });
                                        } else {
                                            if (data.items[1] && data.items[1].type == "video") {
                                                if (u.query.track.toLowerCase() == data.items[0].title.toLowerCase()) {
                                                    ytdl(data.items[0].url).on("info", function(info) {
                                                        for (var c in info.formats) {
                                                            var i = [];
                                                            if (info.formats[c].audioQuality && !info.formats[c].isHLS && !info.formats[c].isDashMPD) {
                                                                var o = info.formats[c];
                                                                i.push(o);
                                                            }
                                                        }
                                                        if (i.length > 0) {
                                                            var j = JSON.stringify(i);
                                                            res.writeHead(200, {
                                                                "Access-Control-Allow-Origin": "*",
                                                                "Content-Type":"application/json"
                                                            })
                                                            res.end(j);
                                                        } else {
                                                            var j = JSON.stringify({
                                                                "err": {
                                                                    "code": "noFormats",
                                                                    "message": "A valid format could not be found."
                                                                }
                                                            });
                                                            res.writeHead(500, {
                                                                "Access-Control-Allow-Origin": "*",
                                                                "Content-Type":"application/json"
                                                            })
                                                            res.end(j);
                                                        }
                                                    }).on("error",function(err) {
                                                        var j = JSON.stringify({
                                                            "err": {
                                                                "code": err.code,
                                                                "message": err.message
                                                            }
                                                        });
                                                        res.writeHead(500, {
                                                            "Access-Control-Allow-Origin": "*",
                                                            "Content-Type":"application/json"
                                                        })
                                                        res.end(j);
                                                    });
                                                } else {
                                                    var j = JSON.stringify({
                                                        "err": {
                                                            "code": "noSources",
                                                            "message": "A valid source could not be found. If you believe this is in error, check the console."
                                                        }
                                                    });
                                                    res.writeHead(500, {
                                                        "Access-Control-Allow-Origin": "*",
                                                        "Content-Type":"application/json"
                                                    })
                                                    res.end(j);
                                                }
                                            } else {
                                                var j = JSON.stringify({
                                                    "err": {
                                                        "code": "noSources",
                                                        "message": "A valid source could not be found. If you believe this is in error, check the console."
                                                    }
                                                });
                                                res.writeHead(500, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type":"application/json"
                                                })
                                                res.end(j);
                                            }
                                        }
                                    } else {
                                        if (data.items[1] && data.items[1].type == "video") {
                                            if (u.query.track.toLowerCase() == data.items[0].title.toLowerCase()) {
                                                ytdl(data.items[0].url).on("info", function(info) {
                                                    for (var c in info.formats) {
                                                        var i = [];
                                                        if (info.formats[c].audioQuality && !info.formats[c].isHLS && !info.formats[c].isDashMPD) {
                                                            var o = info.formats[c];
                                                            i.push(o);
                                                        }
                                                    }
                                                    if (i.length > 0) {
                                                        var j = JSON.stringify(i);
                                                        res.writeHead(200, {
                                                            "Access-Control-Allow-Origin": "*",
                                                            "Content-Type":"application/json"
                                                        })
                                                        res.end(j);
                                                    } else {
                                                        var j = JSON.stringify({
                                                            "err": {
                                                                "code": "noFormats",
                                                                "message": "A valid format could not be found."
                                                            }
                                                        });
                                                        res.writeHead(500, {
                                                            "Access-Control-Allow-Origin": "*",
                                                            "Content-Type":"application/json"
                                                        })
                                                        res.end(j);
                                                    }
                                                }).on("error",function(err) {
                                                    var j = JSON.stringify({
                                                        "err": {
                                                            "code": err.code,
                                                            "message": err.message
                                                        }
                                                    });
                                                    res.writeHead(500, {
                                                        "Access-Control-Allow-Origin": "*",
                                                        "Content-Type":"application/json"
                                                    })
                                                    res.end(j);
                                                });
                                            } else {
                                                var j = JSON.stringify({
                                                    "err": {
                                                        "code": "noSources",
                                                        "message": "A valid source could not be found. If you believe this is in error, check the console."
                                                    }
                                                });
                                                res.writeHead(500, {
                                                    "Access-Control-Allow-Origin": "*",
                                                    "Content-Type":"application/json"
                                                })
                                                res.end(j);
                                            }
                                        }
                                    }
                            } else {
                                    var j = JSON.stringify({
                                        "err": {
                                            "code": "noSources",
                                            "message": "A valid source could not be found. If you believe this is in error, check the console."
                                        }
                                    });
                                    res.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                }
                            }).catch(function(err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            })
                        } else {
                            ytdl(u.query.track).on("info", function(info) {
                                for (var c in info.formats) {
                                    var i = [];
                                    if (info.formats[c].audioQuality && !info.formats[c].isHLS && !info.formats[c].isDashMPD) {
                                        var o = info.formats[c];
                                        i.push(o);
                                    }
                                }
                                if (i.length > 0) {
                                    var j = JSON.stringify(i);
                                    res.writeHead(200, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                } else {
                                    var j = JSON.stringify({
                                        "err": {
                                            "code": "noFormats",
                                            "message": "A valid format could not be found."
                                        }
                                    });
                                    res.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                }
                            }).on("error",function(err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            });
                        }
                    } else {
                        var j = JSON.stringify({
                            "err": {
                                "code": "reqsNotMet",
                                "message": "A track name and artist name are required for this endpoint."
                            }
                        });
                        res.writeHead(500, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type":"application/json"
                        });
                        res.end(j);
                    }
                } else if (path[2] == "trending") {
                    if (config.dataSource == 1) {
                        deezer.chart.tracks(50).then(function(data) {
                            var j = JSON.stringify({
                                data,
                                "source": "deezer"
                            });
                            res.writeHead(200, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        }).catch(function(err) {
                            var j = JSON.stringify({
                                "err": {
                                    "code": err.code,
                                    "message": err.message
                                }
                            });
                            res.writeHead(500, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        });
                    } else if (config.dataSource == 2) {
                        lastfm.chartTopTracks({limit:"50"}, function(err, data) {
                            if (data) {
                                var j = JSON.stringify({
                                    data,
                                    "source": "lastfm"
                                });
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            } else {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }
                        })
                    } else if (config.dataSource == 3) {
                        ytpl('RDCLAK5uy_k5n4srrEB1wgvIjPNTXS9G1ufE9WQxhnA').then((response) => {
                            var j = JSON.stringify({
                                "data": response,
                                "source": "youtube"
                            });
                            res.writeHead(200, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        }).catch((err) => {
                            var j = JSON.stringify({
                                "err": {
                                    "code": err.code,
                                    "message": err.message
                                }
                            });
                            res.writeHead(500, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"application/json"
                            })
                            res.end(j);
                        })
                    }
                } else if (path[2] == "artist" && !path[3]) {
                    if (u.query.id) {
                        if (config.dataSource == 1) {
                            deezer.artist(u.query.id).then(function(data) {
                                var j = JSON.stringify({
                                    data,
                                    "source": "deezer"
                                });
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }).catch(function(err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            });
                        } else if (config.dataSource == 2) {
                            lastfm.artistInfo({ name:u.query.id, autocorrect:1 }, function(err, data) {
                                if (data) {
                                    var j = JSON.stringify({
                                        data,
                                        "source": "lastfm"
                                    });
                                    res.writeHead(200, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                } else {
                                    var j = JSON.stringify({
                                        "err": {
                                            "code": err.code,
                                            "message": err.message
                                        }
                                    });
                                    res.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                }
                            })
                        } else if (config.dataSource == 3) {
                            ytch.getChannelInfo(u.query.id).then(function(channelinfo) {
                                ytch.getChannelPlaylistInfo(u.query.id, 'popular').then(function(response) {
                                    var sortBy = "popular";
                                    if (u.query.sort !== undefined) {
                                        sortBy = u.query.sort;
                                    }
                                    var j = JSON.stringify({
                                        "data": {
                                            "info": channelinfo, 
                                            "playlists": response
                                        },
                                        "source": "youtube"
                                    });
                                    res.writeHead(200, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                }).catch(function (err) {
                                    var j = JSON.stringify({
                                        "err": {
                                            "code": err.code,
                                            "message": err.message
                                        }
                                    });
                                    res.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                })
                            }).catch(function (err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            })
                        }
                    } else {
                        var j = JSON.stringify({
                            "err": {
                                "code": "reqsNotMet",
                                "message": "An arist ID is required for this endpoint."
                            }
                        });
                        res.writeHead(500, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type":"application/json"
                        })
                        res.end(j);
                    }
                } else if (path[2] == "artist" && path[3] == "albums") {
                    if (u.query.id) {
                        if (config.dataSource == 1) {
                            deezer.artist.albums(u.query.id, 100).then(function(data) {
                                var j = JSON.stringify({
                                    "data": data,
                                    "source": "deezer"
                                });
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }).catch(function(err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            });
                        } else if (config.dataSource == 2) {
                            lastfm.artistTopAlbums({ name:u.query.id, autocorrect:1 }, function(err, data) {
                                if (data) {
                                    var j = JSON.stringify({
                                        data,
                                        "source": "lastfm"
                                    });
                                    res.writeHead(200, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                } else {
                                    var j = JSON.stringify({
                                        "err": {
                                            "code": err.code,
                                            "message": err.message
                                        }
                                    });
                                    res.writeHead(500, {
                                        "Access-Control-Allow-Origin": "*",
                                        "Content-Type":"application/json"
                                    })
                                    res.end(j);
                                }
                            })
                        } else if (config.dataSource == 3) {
                            ytch.getChannelPlaylistInfo(u.query.id, "popular").then(function(response) {
                                var j = JSON.stringify({
                                    "data": response,
                                    "source": "youtube"
                                });
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }).catch(function (err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            })
                        }
                    } else {
                        var j = JSON.stringify({
                            "err": {
                                "code": "reqsNotMet",
                                "message": "An arist ID is required for this endpoint."
                            }
                        });
                        res.writeHead(500, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type":"application/json"
                        })
                        res.end(j);
                    }
                } else if (path[2] == "album") {
                    if (u.query.id) {
                        if (config.dataSource == 1) {
                            deezer.album(u.query.id, 100).then(function(data) {
                                var j = JSON.stringify({
                                    "data": data,
                                    "source": "deezer"
                                });
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }).catch(function(err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            });
                        } else if (config.dataSource == 2) {
                            if (u.query.id && u.query.id.split(":::").length > 1) {
                                lastfm.albumInfo({ name:u.query.id.split(":::")[0], artistName: u.query.id.split(":::")[1], autocorrect:1 }, function(err, data) {
                                    if (data) {
                                        var j = JSON.stringify({
                                            data,
                                            "source": "lastfm"
                                        });
                                        res.writeHead(200, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type":"application/json"
                                        })
                                        res.end(j);
                                    } else {
                                        var j = JSON.stringify({
                                            "err": {
                                                "code": err.code,
                                                "message": err.message
                                            }
                                        });
                                        res.writeHead(500, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type":"application/json"
                                        })
                                        res.end(j);
                                    }
                                })
                            } else {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": "reqsNotMet",
                                        "message": "An album ID required for this endpoint."
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }
                        } else if (config.dataSource == 3) {
                            ytpl(u.query.id).then(function (response) {
                                var j = JSON.stringify({
                                    "data": response,
                                    "source": "youtube"
                                });
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            }).catch(function (err) {
                                var j = JSON.stringify({
                                    "err": {
                                        "code": err.code,
                                        "message": err.message
                                    }
                                });
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"application/json"
                                })
                                res.end(j);
                            })
                        }
                    } else {
                        var j = JSON.stringify({
                            "err": {
                                "code": "reqsNotMet",
                                "message": "A track name and artist name are required for this endpoint."
                            }
                        });
                        res.writeHead(500, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type":"application/json"
                        })
                        res.end(j);
                    }
                } else if (path[2] == "lyrics") {
                    if (u.query.artist && u.query.title) {
                        ftl.find(u.query.artist, u.query.title, function(err, resp) {
                            if (!err) {
                                if (resp == "" || resp == null) {
                                    resp = "Could not find lyrics for this track."
                                }
                                res.writeHead(200, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"text/plain"
                                })
        
                                res.end(resp);
                            } else {
                                res.writeHead(500, {
                                    "Access-Control-Allow-Origin": "*",
                                    "Content-Type":"text/plain"
                                })
                                res.end(err.stack);
                            }
                        })
                    } else {
                        var resp = "This endpoint requires an 'artist' and 'title' parameter."
                        res.writeHead(500, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type":"text/plain"
                        })
                        res.end(resp);
                    }
                } else {
                    var j = JSON.stringify({
                        "err": {
                            "code": "noEndpoint",
                            "message": "Invalid 'get' parameter."
                        }
                    });
                    res.writeHead(404, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type":"application/json"
                    })
                    res.end(j);
                }
            return;
                
            case "config": 
                var t = fs.readFileSync("config.json").toString();
                res.writeHead(200, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type":"application/json"
                })
                res.end(t);
            return;

            case "editConfig":
                var j = JSON.parse(fs.readFileSync("config.json"));
                if (u.query.lastFmKey) {j.lastFmKey = u.query.lastFmKey;}
                if (u.query.dataSource) {j.dataSource = u.query.dataSource;}
                if (u.query.discordRpc) {j.discordRpc = u.query.discordRpc;}
                if (u.query.discordRpcId) {j.discordRpcId = u.query.discordRpcId;}
                if (u.query.onClosePref) {j.onClosePref = u.query.onClosePref;}
                fs.writeFileSync("config.json", JSON.stringify(j));
                res.end();
                app.relaunch();
                app.exit();
            return;

            case "setPresence":
                if (config.discordRpc == "true") {
                    var act = u.query.act;
                    var title = u.query.title;
                    var artist = u.query.artist;
                    if (act == "play") {
                        drpc.updatePresence({
                            state: artist,
                            details: title,
                            startTimestamp: Date.now(),
                            largeImageKey: 'blazebury',
                            instance: false
                        })
                        var d = JSON.stringify({
                            "success": true
                        });
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type":"application/json"
                        })
                        res.end(d);
                    } else if (act == "pause" || !act) {
                        drpc.updatePresence({
                            state: artist,
                            details: title + " (Paused)",
                            largeImageKey: 'blazebury',
                            instance: false
                        })
                        var d = JSON.stringify({
                            "success": true
                        });
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type":"application/json"
                        })
                        res.end(d);
                    }
                } else {
                    var j = JSON.stringify({
                        "err": {
                            "code": "notAllowed",
                            "message": "Due to a user's settings, this endpoint is not allowed."
                        }
                    });
                    res.writeHead(403, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type":"application/json"
                    })
                    res.end(j);
                }
            return;

            default:
                var j = JSON.stringify({
                    "err": {
                        "code": "noEndpoint",
                        "message": "No endpoint was found in your request."
                    }
                });
                res.writeHead(404, {
                    "Access-Control-Allow-Origin": "*",
                    "Content-Type":"application/json"
                })
                res.end(j);
            return;
        }
    } else {
        fs.readFile("./web" + path, function(err,resp) {
            if (err) {
                if (err.code == "ENOENT") {
                    fs.readFile("./errors/404.html", function(err,resp){
                        if (err) {
                            res.end(err.code)
                        } else {
                            res.writeHead(404, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type": "text/html"
                            })
                            res.end(resp)
                        }
                    })
                } else if (err.code == "EISDIR") {
                    fs.readFile("./web" + path + "/index.html", function(err,resp) {
                        if (err) {
                            if (err.code == "ENOENT") {
                                fs.readFile("./errors/404.html", function(err,resp){
                                    if (err) {
                                        res.end(err.code)
                                    } else {
                                        res.writeHead(404, {
                                            "Access-Control-Allow-Origin": "*",
                                            "Content-Type": "text/html"
                                        })
                                        res.end(resp)
                                    }
                                })
                            }
                        } else {
                            res.writeHead(200, {
                                "Access-Control-Allow-Origin": "*",
                                "Content-Type":"text/html"
                            })
                            res.end(resp);
                        }
                    })
                } else {
                    console.log(err.code);
                    res.end(err.code);
                }
            } else {
                if (path.includes(".")) {
                    var fileType = path.split(".")[path.split.length-1];
                    if (fileType == "js") {
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type":"application/javascript"
                        })
                        res.end(resp);
                    } else if (fileType == "css") {
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type":"text/css"
                        })
                        res.end(resp);
                    } else {
                        res.writeHead(200, {
                            "Access-Control-Allow-Origin": "*",
                        })
                        res.end(resp)
                    }
                } else {
                    res.writeHead(200, {
                        "Access-Control-Allow-Origin": "*",
                        "Content-Type":"text/html"
                    })
                    res.end(resp);
                }
            }
        })
    }
}

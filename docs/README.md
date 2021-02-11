# documentation
Welcome to the documentation for Blazebury Music.

## table of contents
- [FAQ](#faq)
    - [How does Blazebury work?](#how-does-blazebury-work)
    - [Why does Last.FM scraping not have pictures?](#why-does-last.fm-scraping-not-have-pictures)
- [Compiling](#compiling)

## FAQ
Here are some (probably) frequently asked questions about Blazebury.

### how does blazebury work?
How it works is quite simple. Blazebury gets music details like artist, album, and track metadata from Deezer or LastFM (depending on your settings), and gets streams by getting auto-generated streams from YouTube via a search algorithm.

### why does last.fm scraping not have pictures?
LastFM unfortunately disabled support for certain API endpoints, so certain images will be just a star and we can't do anything about it unless LastFM changes that.

## Compiling
You could use probably any Electron compiler but I personally prefer ``electron-packager`` which can be installed with the command ``npm i -g electron-packager``.

You can compile Blazebury for your system with this easy command:

```electron-packager . --overwrite --icon=./assets/icon.ico```

Then, you copy the ``web`` folder into the generated folder.

Once you do that, Blazebury is ready to go.
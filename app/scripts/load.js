const getAppdata_ = require('appdata-path');
const sha1 = require('sha1-file');
const fs = require('fs');
const { machineIdSync } = require('node-machine-id');
const log = require('electron-log');
const { Client, Authenticator } = require('minecraft-launcher-core');
var os = require('os');

var jrePath;

// const electron = require('electron');
const ipc = electron.ipcRenderer;

const launcher = new Client();
const ServerURL = "https://athena.rip/uploads";

let hwid = machineIdSync();
var launchButton = document.getElementById('sexybtn');
var launchText2 = document.querySelector('#large');
var progressText = document.querySelector('#progress');
var launchText = document.querySelector('#small');
var launchState = 'no_access';
log.transports.file.level = "info";

const remote = require("electron").remote;
const { getAppDataPath_ } = require('appdata-path');

const { spawn } = require('child_process');
const path = require('path');

const download = require('download');
const decompress = require('decompress');

var clienthash = null;

function getAppdata(e) {
    switch (os.platform()) {
        case "win32":
            return getAppdata_(e)
        case "darwin":
            return "~\\" + e
        default:
            return "~\\" + e
    }
}

function getAppDataPath(e) {
    switch (os.platform()) {
        case "win32":
            return getAppdata_(e)
        case "darwin":
            return "~\\" + e
        default:
            return "~\\" + e
    }
}

function setLaunchState(state, err="") {
    if (state === 'no_access') {
        launchText.innerHTML = 'No Access';
        launchButton.src = 'images/launch/no_auth.png';
    } else if (state === 'ready') {
        launchText.innerHTML = '1.8.9';
        launchText2.innerHTML = 'Launch';
        launchButton.src = 'images/launch/ready.png';
    } else if (state === 'authenticating') {
        launchText.innerHTML = 'Authenticating...';
        launchButton.src = 'images/launch/loading.png';
    } else if (state === 'connecting') {
        launchText.innerHTML = 'Connecting...';
        launchButton.src = 'images/launch/loading.png';
        launchText2.innerHTML = 'Launching';
    } else if (state === 'update') {
        launchText.innerHTML = 'Updating...';
        launchButton.src = 'images/launch/loading.png';
    } else if (state === 'jre') {
        launchText.innerHTML = 'Downloading JRE...';
        launchButton.src = 'images/launch/loading.png';
    } else if (state === 'assets') {
        launchText.innerHTML = 'Downloading assets...';
        launchButton.src = 'images/launch/loading.png';
    } else if (state === 'libraries') {
        launchText.innerHTML = 'Downloading libraries...';
        launchButton.src = 'images/launch/loading.png';
    } else if (state === 'natives') {
        launchText.innerHTML = 'Downloading natives...';
        launchButton.src = 'images/launch/loading.png';
    } else if (state === 'firstlaunch') {
        launchText.innerHTML = 'Downloading Client...';
        launchButton.src = 'images/launch/loading.png';
    } else if (state === 'launching') {
        launchText.innerHTML = 'Starting JVM';
        launchButton.src = 'images/launch/loading.png';
    } else if (state === 'banned') {
        document.querySelector('.launch-text').style = "margin-top: -10px;"
        launchText.innerHTML = "You're still <br> banned";
        launchButton.src = 'images/launch/no_auth.png';
    } else if(state === 'error') {
        launchText.innerHTML = err;
        launchText2.innerHTML = 'Error';
    } 
    else {
        launchText.innerHTML = 'Error';
        launchText2.innerHTML = err;
    }

    launchState = state;
}

function launchClient() {
    if (launchState != 'ready') {
        return;
    }

    getClientHash();

    log.info("[AC] Launching...");
    setLaunchState('connecting');

    setTimeout(function () {
        log.info('[AC] Got hash: ' + clienthash)
        handleNatives();
    }, 2000);
}

function handleNatives() {
    if (!fs.existsSync(getAppdata(".athena/natives"))) {
        setLaunchState('natives');

        const nativesZipFile = getAppdata(".athena/natives.zip");
        const nativesWriteStream = fs.createWriteStream(nativesZipFile);

        const nativesDownloadRequest = download('https://athena.rip/uploads/natives.zip');

        nativesDownloadRequest.pipe(nativesWriteStream);
        nativesDownloadRequest.on('response', function (response) {
            const totalBytes = response.headers['content-length'];
            let downloadedBytes = 0;

            response.on('data', function (chunk) {
                downloadedBytes += chunk.length;
                // Calculate the download progress (optional)
                const progress = (downloadedBytes / totalBytes) * 100;

                progressText.innerHTML = parseInt(progress) + '%';

                log.log('Download progress: ' + parseInt(progress) + '%');
            });

            response.on('end', function () {
                log.log('Download completed');
                handleLaunch();
            });
        });
        nativesWriteStream.on('finish', function () {
            log.log('Natives download completed');
            decompress(nativesZipFile, getAppdata(".athena/natives/"))
                .then(function () {
                    log.log('Natives extraction completed');
                    fs.unlinkSync(nativesZipFile); // Delete the zip file
                    handleAssets();
                })
                .catch(function (error) {
                    console.error('Natives extraction failed:', error);
                });
        });
    } else {
        handleAssets();
    }
}

function handleAssets() {
    if (!fs.existsSync(getAppdata(".athena/assets"))) {
        setLaunchState('assets');

        const assetsZipFile = getAppdata(".athena/assets.zip");
        const assetsWriteStream = fs.createWriteStream(assetsZipFile);

        const assetsDownloadRequest = download('https://athena.rip/uploads/assets.zip');

        assetsDownloadRequest.pipe(assetsWriteStream);
        assetsDownloadRequest.on('response', function (response) {
            const totalBytes = response.headers['content-length'];
            let downloadedBytes = 0;

            response.on('data', function (chunk) {
                downloadedBytes += chunk.length;
                // Calculate the download progress (optional)
                const progress = (downloadedBytes / totalBytes) * 100;

                progressText.innerHTML = parseInt(progress) + '%';

                log.log('Download progress: ' + parseInt(progress) + '%');
            });

            response.on('end', function () {
                log.log('Download completed');
                handleLaunch();
            });
        });
        assetsWriteStream.on('finish', function () {
            log.log('Assets download completed');
            decompress(assetsZipFile, getAppdata(".athena/assets/"))
                .then(function () {
                    log.log('Assets extraction completed');
                    fs.unlinkSync(assetsZipFile); // Delete the zip file
                    handleLibraries();
                })
                .catch(function (error) {
                    console.error('Assets extraction failed:', error);
                });
        });
    } else {
        handleLibraries();
    }
}

function handleLibraries() {
    if (!fs.existsSync(getAppdata(".athena/libraries"))) {
        setLaunchState('libraries');

        const librariesZipFile = getAppdata(".athena/libraries.zip");
        const librariesWriteStream = fs.createWriteStream(librariesZipFile);

        const librariesDownloadRequest = download('https://athena.rip/uploads/libraries.zip');

        librariesDownloadRequest.pipe(librariesWriteStream);
        librariesDownloadRequest.on('response', function (response) {
            const totalBytes = response.headers['content-length'];
            let downloadedBytes = 0;

            response.on('data', function (chunk) {
                downloadedBytes += chunk.length;
                // Calculate the download progress (optional)
                const progress = (downloadedBytes / totalBytes) * 100;

                progressText.innerHTML = parseInt(progress) + '%';

                log.log('Download progress: ' + parseInt(progress) + '%');
            });

            response.on('end', function () {
                log.log('Download completed');
                handleLaunch();
            });
        });
        librariesWriteStream.on('finish', function () {
            log.log('Libraries download completed');
            decompress(librariesZipFile, getAppdata(".athena/libraries/"))
                .then(function () {
                    log.log('Libraries extraction completed');
                    fs.unlinkSync(librariesZipFile); // Delete the zip file
                    handleJRE();
                })
                .catch(function (error) {
                    console.error('Libraries extraction failed:', error);
                });
        });
    } else {
        handleJRE();
    }
}

function handleJRE() {
    if (!fs.existsSync(getAppdata(".athena/jre"))) {
        setLaunchState('jre');

        const jreZipFile = getAppdata(".athena/jre.zip");
        const jreWriteStream = fs.createWriteStream(jreZipFile);

        const jreDownloadRequest = download('https://athena.rip/uploads/jre.zip');

        jreDownloadRequest.pipe(jreWriteStream);
        jreDownloadRequest.on('response', function (response) {
            const totalBytes = response.headers['content-length'];
            let downloadedBytes = 0;

            response.on('data', function (chunk) {
                downloadedBytes += chunk.length;
                // Calculate the download progress (optional)
                const progress = (downloadedBytes / totalBytes) * 100;

                progressText.innerHTML = parseInt(progress) + '%';

                log.log('Download progress: ' + parseInt(progress) + '%');
            });

            response.on('end', function () {
                log.log('Download completed');
                handleLaunch();
            });
        });
        jreWriteStream.on('finish', function () {
            log.log('JRE download completed');
            decompress(jreZipFile, getAppdata(".athena/jre/"))
                .then(function () {
                    log.log('JRE extraction completed');
                    fs.unlinkSync(jreZipFile); // Delete the zip file
                    handleClientDownload();
                })
                .catch(function (error) {
                    console.error('JRE extraction failed:', error);
                });
        });
    } else {
        handleClientDownload();
    }
}

function handleClientDownload() {
    if (!fs.existsSync(getAppdata(".athena/Athena.jar"))) {
        setLaunchState('firstlaunch');

        const fileStream = fs.createWriteStream(getAppdata(".athena/Athena.jar"));
        const downloadRequest = download('https://athena.rip/uploads/builds/1.0.0/Athena.jar');

        downloadRequest.pipe(fileStream);
        downloadRequest.on('response', function (response) {
            const totalBytes = response.headers['content-length'];
            let downloadedBytes = 0;

            response.on('data', function (chunk) {
                downloadedBytes += chunk.length;
                // Calculate the download progress (optional)
                const progress = (downloadedBytes / totalBytes) * 100;

                progressText.innerHTML = parseInt(progress) + '%';

                log.log('Download progress: ' + parseInt(progress) + '%');
            });

            response.on('end', function () {
                log.log('Download completed');
                handleLaunch();
            });
        });
    } else if (!(sha1.sync(getAppdata('.athena/Athena.jar')) == clienthash)) {
        setLaunchState('update')
        log.info('[AC] No updates were found during launch. Updating...');

        const fileStream = fs.createWriteStream(getAppdata(".athena/Athena.jar"));
        const downloadRequest = download('https://athena.rip/uploads/builds/1.0.0/Athena.jar');
        
        downloadRequest.pipe(fileStream);
        downloadRequest.on('response', function (response) {
            const totalBytes = response.headers['content-length'];
            let downloadedBytes = 0;

            response.on('data', function (chunk) {
                downloadedBytes += chunk.length;
                // Calculate the download progress (optional)
                const progress = (downloadedBytes / totalBytes) * 100;

                progressText.innerHTML = parseInt(progress) + '%';

                log.log('Download progress: ' + parseInt(progress) + '%');
            });

            response.on('end', function () {
                log.log('Download completed');
                handleLaunch();
            });
        });
    } else {
        handleLaunch();
    }
}

function handleLaunch() {
    var checkedhash = sha1.sync(getAppdata('.athena/Athena.jar'));
    if (checkedhash == clienthash) {
        launchAthena();
        log.info('[AC] Athena is ready! Launching...');
    } else {
        log.info('[AC] Updates found during secondary check! Updating...');
        handleClientDownload();
    }
}

async function getClientHash() {
    const response = await fetch(`${ServerURL}/version.txt`);
    const text = await response.text();

    clienthash = text.replaceAll('\n', '');
}

function getJRE() {
    if(jrePath === "NONE") {
        return getAppdata('.athena\\jre\\bin\\java')
    } else return jrePath + "\\java"
}

function launchAthena() {
    let opts = {
        clientPackage: "Athena.jar",
        root: getAppdata('.athena'),
        javaPath: getJRE(),
        version: {
            number: '1.8',
        },
        memory: {
            max: document.getElementById("settings-memory").value.toString() + 'M',
            min: '1024M'
        }
    };

    let processArguments = [
        '-Xms' + opts.memory.min,
        '-Xmx' + opts.memory.max,
        '-Djava.library.path=' + path.join(opts.root, 'natives'),
        '-cp',
        path.join(opts.root, 'libraries', '*') + ';' + path.join(opts.root, opts.clientPackage),
        'net.minecraft.client.main.Main',
        '--width',
        '854',
        '--height',
        '489',
        '--username',
        'Player69420',
        '--version',
        opts.version.number,
        '--gameDir',
        opts.root,
        '--assetsDir',
        path.join(opts.root, 'assets'),
        '--assetIndex',
        '1.8',
        '--uuid',
        'N/A',
        '--accessToken',
        'aeef7bc935f9420eb6314dea7ad7e1e5',
        '--userType',
        'mojang'
    ];

    setLaunchState('launching');

    progressText.innerHTML = "";

    let processOptions = {
        cwd: opts.root,
        detached: true,
        stdio: ['ignore', fs.openSync(opts.root + 'launcher.log', 'a'), fs.openSync(opts.root + 'launcher.log', 'a')],
        shell: false
    };

    let process = spawn(opts.javaPath, processArguments, processOptions);
    process.unref();

    process.on('close', (code) => {
        setLaunchState('ready');
        ipc.send('show');
    });
}


launchButton.addEventListener('click', launchClient);
launchText.addEventListener('click', launchClient);

// POPULATE BLOG POST AREA //
log.log('[AC] Received meta response');

let url = `${ServerURL}/posts.json`;

fetch(url)
  .then(news => news.json())
  .then((response) => {
    document.querySelector('.blog_title').innerHTML = response.title;
    document.querySelector('.blog_content').innerHTML = response.content;
    document.querySelector('.blog_author').innerHTML = 'Posted by ' + response.author;
    document.querySelector('.blog_author_skin').src = 'https://minotar.net/helm/' + response.author + '/32.png';
  })
  .catch(err => {
    throw err;
  });

log.log("[AC] creating root directories")

var root = getAppdata('.athena');

if (!fs.existsSync(root)) {
    setLaunchState('prep')
    fs.mkdirSync(root);
}
setLaunchState('prep')

let heap = 2048;

log.log("[AC] loading settings")

try {
    let settingsRaw = fs.readFileSync(getAppdata('.athena/settings.json'));
    let settings = JSON.parse(settingsRaw);
    heap = settings.heap;
} catch (ignore) { }

memorySlider = document.querySelector('#settings-memory');
memorySlider.value = heap;

log.log("[AC] loading jre")

var jreloc2 = document.querySelector("#jre-loc")

if (fs.existsSync(getAppDataPath('.athena/settings.json'))) {

    log.log("[AC] loading settings")

    let temp = fs.readFileSync(getAppDataPath('.athena/settings.json'));
    var json_ = JSON.parse(temp);
    
    log.log("[AC] found files")

    var jreloc = json_.jrepath;


    
    log.log("[AC] processing")


        if (!fs.existsSync(jreloc)) {
            
            setLaunchState('error', err='Bad JRE path')
            log.log("[AC] Bad JRE Path: " + jrePath)

            jrePath = "NONE"

        } else {
            log.log("[AC] using JRE: " + jreloc)
        
            jrePath = jreloc;
            jreloc2.value = jrePath;
        }


}



setLaunchState('ready');    
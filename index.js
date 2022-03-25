const fs = require('fs');
const axios = require('axios').default;
const path = require('path');

/**
 * Represents an instagram node object
 */
class Node {
    constructor(node) {
        this.caption = node.caption;
        this.isVideo = node.isVideo;
        this.postedAt = node.postedAt;
        this.src = node.src;
        this.videoUrl = node.videoUrl ? node.videoUrl : null;
        this.date = new Date(node.postedAt * 1000);
        this.sidecarChildren = node.sidecarChildren? node.sidecarChildren : [];
    }
}

/**
 * Singleton class
 * Runs the scraper automatically before terminating
 */
class InstagramScraper {

    static instance = new InstagramScraper();

    constructor() {
        this.outputsFolder = path.resolve(__dirname, 'outputs');
        this.inputsFolder = path.resolve(__dirname, 'inputs');
        this.videosFile = path.resolve(__dirname, 'outputs/videoURLs.txt');
        this.imagesFile = path.resolve(__dirname, 'outputs/imageURLs.txt');
        this.errorLogFile = path.resolve(__dirname, 'outputs/errorlog.txt');

        if (!fs.existsSync(this.inputsFolder)) {
            fs.mkdirSync(this.inputsFolder);
        }

        if (!fs.existsSync(this.outputsFolder)) {
            fs.mkdirSync(this.outputsFolder);
        }

        this.scrape();
    }

    /**
     * Parses JSON for images, videos and posts.
     */
    async scrape() {

        console.log("Operation Started");

        const posts = this.readFiles(this.inputsFolder);

        await this.processPosts(posts);

        console.log("Operation Complete");
    }

    /**
     * Processes a list of instagram edge posts
     * @param {Array<Node>} posts
     */
    async processPosts(posts) {
        for (let i = 0; i < posts.length; i++) {

            let node = posts[i];
            let dateValues = node.date.toString().replace(/\s/g, "-").replace(/:\s*/g, "-").split("-");

            let dateString = "".concat(dateValues[3], "-", dateValues[1], "-", dateValues[2], "-", dateValues[4], dateValues[5]);

            let outputFolder = path.resolve(this.outputsFolder, dateString);

            if (!fs.existsSync(outputFolder)) {
                fs.mkdirSync(outputFolder);
            }

            let outputFile = path.resolve(outputFolder, "post.txt");

            this.log("TIMESTAMP: " + node.date.toString(), outputFile);
            this.log("CAPTION: " + node.caption, outputFile);

            if (node.isVideo) {
                this.log(node.videoUrl, this.videosFile);
                this.log("VIDEO URL: " + node.videoUrl, outputFile);
                try {
                    await this.processURL(node.videoUrl, outputFolder);
                } catch (e) {
                    this.log("\nError Fetching Video\n" + e.stack, this.errorLogFile);
                }
            } else {
                this.log(node.src, this.imagesFile);
                this.log("IMAGE URL: " + node.src, outputFile);

                try {
                    await this.processURL(node.src, outputFolder);
                } catch (e) {
                    this.log("\nError Fetching Image\n" + e.stack, this.errorLogFile);
                }

                for (let child of node.sidecarChildren) {
                    this.log(child.src, this.imagesFile);
                    this.log("IMAGE URL: " + child.src, outputFile);
                    try {
                        await this.processURL(child.src, outputFolder);
                    } catch (e) {
                        this.log("\nError Fetching Image\n" + e.stack, this.errorLogFile);
                    }   
                }
            }

        }
    }

    /**
     * Reads offline instagram posts
     * @param {String} folderPath path to the folder of json objects
     * @returns {Array} The loaded string data
     */
    readFiles(folderPath) {
        const data = [];

        try {
            const fileNames = fs.readdirSync(folderPath);

            fileNames.forEach(fileName => {
                let file = fs.readFileSync(path.resolve(folderPath, fileName));
                let object = JSON.parse(file);
                let node = new Node(object);
                data.push(node);
            })

        } catch (e) {
            this.log(e, this.errorLogFile);
        }

        return data;
    }

    /**
     * Processes an image or video url
     * @param {String} url Absolute URL to file that needs to be downloaded
     * @param {String} folderPath path to where the file should be written
     */
    async processURL(url, folderPath) {

        const fileName = this.getFileName(url);

        if (fileName) {
            const filePath = path.resolve(folderPath, fileName);

            await this.downloadFile(url, filePath);
        }
    }

    /**
     * Parses file name of a url
     * @param {String} url of a file from the internet.
     * @returns {String} parsed url
     */
    getFileName(url) {
        let baseName = path.basename(url);
        let fileName = null;

        if (baseName.includes(".jpg")) {
            fileName = baseName.slice(0, baseName.indexOf(".jpg") + 4);
        } else if (baseName.includes(".mp4")) {
            fileName = baseName.slice(0, baseName.indexOf(".mp4") + 4);
        }

        return fileName;
    }

    /**
     * Downloads the file and writes it to the specified path.
     * @param {String} url 
     * @param {String} path 
     */
    async downloadFile(url, path) {
        try {
            const response = await axios({
                method: "GET",
                url: url,
                responseType: "stream",
            });

            await response.data.pipe(fs.createWriteStream(path));

        } catch (err) {
            this.log(err.stack, this.errorLogFile);
        }
    }

    /**
     * Writes data to files.
     * @param {String} message The data that is logged
     * @param {String} file The path to the output file
     */
    log(message, file) {
        try {
            fs.appendFileSync(file, `\n\n${message}`);
        } catch (err) {
            console.log(err, err.stack);
        }
    }

}

const fs = require('fs');
const axios = require('axios').default;
const path = require('path');

/**
 * Represents an instagram node object
 */
class Node {

    is_video = null;
    video_url = '';
    date = null;
    text = "";
    display_url = "";
    edge_sidecar_to_children = [];

    /**
     * The node object from instagram
     * @param {Object} node 
     */
    constructor(node) {

        this.is_video = node.is_video;

        if (this.is_video) this.video_url = node.video_url;

        if (node.edge_sidecar_to_children) this.edge_sidecar_to_children = node.edge_sidecar_to_children;

        this.display_url = node.display_url;

        if (node.edge_media_to_caption) {
            for (let i = 0; i < node.edge_media_to_caption.edges.length; i++) {
                this.text += "\n" + node.edge_media_to_caption.edges[i].node.text;
            }
        }

        this.date = new Date(node.taken_at_timestamp * 1000);
        

    }
}

/**
 * Singleton class
 * Runs the scraper automatically before terminating
 */
class InstagramScraper {

    static instance = new InstagramScraper();

    constructor() {

        if (process.argv.length < 3) {
            throw new Error("Profile Name Required");
        }

        this.profileURL = `https://www.instagram.com/${process.argv[2]}/?__a=1`;
        this.resultsFolder = path.resolve(__dirname, 'results');
        this.downloadFolder = path.resolve(__dirname, 'results/downloads');
        this.inputFile = path.resolve(__dirname, 'instagram.json');
        this.outputFile = path.resolve(__dirname, 'results/output.txt');
        this.videosFile = path.resolve(__dirname, 'results/videoURLs.txt');
        this.imagesFile = path.resolve(__dirname, 'results/imageURLs.txt');
        this.errorLogFile = path.resolve(__dirname, 'errorlog.txt');

        if (!fs.existsSync(path.resolve(__dirname, 'results'))) {
            fs.mkdirSync(path.resolve(__dirname, 'results'))
        }

        if (!fs.existsSync(this.downloadFolder)) {
            fs.mkdirSync(this.downloadFolder);
        }

        this.scrape();
    }

    /**
     * Parses JSON for images, videos and posts.
     */
    async scrape() {

        // const data = JSON.parse(this.readFile(this.inputFile));
        const data = await this.fetchProfileData(this.profileURL);

        await this.processVideos(data.graphql.user.edge_felix_video_timeline.edges);

        await this.processPosts(data.graphql.user.edge_owner_to_timeline_media.edges);

        console.log("Operation Complete");

    }

    /**
     * Fetches data for isntagram profile
     * @param {String} url to instagram profile
     */
    async fetchProfileData(url) {
        try {
            const response = await axios.get(url);

            return response.data;

        } catch (err) {
            this.log(err.stack, this.errorLogFile);
        }
    }

    /**
     * Processes a list of instagram edge posts
     * @param {Array<Object>} posts 
     */
    async processPosts(posts) {
        for (let i = 0; i < posts.length; i++) {

            let node = new Node(posts[i].node);

            this.log(node.display_url, this.imagesFile);

            this.log("TIMESTAMP: " + node.date, this.outputFile);
            this.log("CAPTION: " + node.text, this.outputFile);
            this.log("IMAGE URL: " + node.display_url, this.outputFile);
            await this.processURL(node.display_url);

            for (let j = 0; j < node.edge_sidecar_to_children.length; j++) {
                let child = new Node(node.edge_sidecar_to_children[j].node);
                this.log("IMAGE URL: " + child.display_url, this.outputFile);
                await this.processURL(child.display_url);
            }

        }
    }

    /**
     * Processes a list of instagram edge videos
     * @param {Array<Object>} videos list of edges which contains nodes of data.
     */
    async processVideos(videos) {
        for (let i = 0; i < videos.length; i++) {
            let node = new Node(videos[i].node);

            this.log(node.video_url, this.videosFile);
            this.log("TIMESTAMP: " + node.date, this.outputFile);
            this.log("CAPTION: " + node.text, this.outputFile);
            this.log("VIDEO URL: " + node.video_url, this.outputFile);

            await this.processURL(node.video_url);
        }
    }

    /**
     * Reads a file
     * @param {String} filePath 
     * @returns {String} The loaded string data
     */
    readFile(filePath) {
        let data = null;

        try {
            data = fs.readFileSync(filePath, 'utf8');
        } catch (e) {
            this.log(e, this.errorLogFile);
        }

        return data;
    }

    /**
     * Processes an image or video url
     * @param {String} url Absolute URL to file that needs to be downloaded
     */
    async processURL(url) {

        const fileName = this.getFileName(url);

        if (fileName) {
            const filePath = path.resolve(this.downloadFolder, fileName);

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

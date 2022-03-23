# Instagram Scraper

## About
Scrapes and downloads a single instagram profile's dates, posts, images and videos to a local folder.

## Requirements
NodeJS
Internet Connection
Internet Browser

## How to use

### Getting the data

In the Google Chrome browser open the url `https://www.instagram.com/<username>/feed/` replacing username with the real username

Press F12 to open chrome developer tools

Press Ctrl + Shift + M to open the device toolbar

In the dimensions drop down menu and select a mobile device that isn't a tablet

Press F5 to refresh the page; this will load the mobile layout for the site

In the Sources tab in the developer tools, click overrides (you might have to click `>>` if it it hidden)

Click `Select folder for overrides` if it shows up

Create or select a folder to place the override files

Click Allow DevTools access to the browser

Click on Page in the sources tab

Right click the file in `top -> www.instagram.com -> static/bundles/metro -> ProfilePageContainer.js`

Click save for overrides

Open the file in your text / code editor (recommended)

Press `Ctrl + f ` to search for the code `var t = this;`

Right after this line input the below code:

    (function(console){
        console.save = function(data, filename){
    
            if(!data) {
                console.error('Console.save: No data')
                return;
            }
    
            if(!filename) filename = 'console.json'
    
            if(typeof data === "object"){
                data = JSON.stringify(data, undefined, 4)
            }
    
            var blob = new Blob([data], {type: 'text/json'}),
                e    = document.createEvent('MouseEvents'),
                a    = document.createElement('a')
    
            a.download = filename
            a.href = window.URL.createObjectURL(blob)
            a.dataset.downloadurl =  ['text/json', a.download, a.href].join(':')
            e.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
            a.dispatchEvent(e)
        }
    })(console)
    console.save(this.props.post);

Save the file

Press F5 to refresh the page

Press allow the downloading of multiple files

Scroll down until all the posts have loaded in the browser

**If a prompt appears asking to specify the download location of the json file manually name the file somethign random and save it**

All the json files will be saved to your downloads folder

***LIFE HACKS***

Close the device toolbar by pressing Ctrl + Shift + M

Enlarge the console window by dragging the left side of the window left until the feeds icon shows up in the screen instead of an image grid

Click and hold the left mouse button near the bottom of the scrollbar and right click without letting go

Now you can let go and if you don't interact with the browser this should scroll indefinitely

***

Create a new folder called inputs

Place all the json files in the inputs folder and place the folder in the project root folder

### Running the program

Run `npm install` command line in the root folder of the project

Run the `npm start` command

The output will be saved to a results folder in the root of this project
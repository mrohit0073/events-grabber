document.addEventListener("DOMContentLoaded", function () {
    // Get the file input element and reset button
    const fileInput = document.querySelector('input[type="file"]');
    const resetButton = document.getElementById("resetBtn");
    const zipForm = document.getElementById("zipForm");
    const resultSection = document.getElementById("result");
    const backBtn = document.getElementById("backBtn");
    const nextBtn = document.getElementById("nextBtn");
    const bannerCheckBoxContainer = document.getElementsByClassName("banner-check-box-container"); // Create a container for bannerCheckBox

    // Declare variables to store width and height
// Global array to store width and height for each ZIP file
const iframeDimensions = [
    { width: "300px", height: "250px" },
    { width: "728px", height: "90px" },
    { width: "300px", height: "600px" },
    { width: "160px", height: "600px" },
    { width: "320px", height: "50px" },
    { width: "300px", height: "50px" },
    { width: "640px", height: "480px" }
    // Add more dimensions as needed
];
    let fallbackFileWhole = "xyz";    
    // Maintain a set to store unique file hashes
    const uniqueFileHashes = new Set();

    // Function to check if a specific file exists in the ZIP package
    const fileExistsInZip = (zip, fileName) => {
        return zip.file(fileName) !== null;
    };

    // Function to get the size of a file in the ZIP package
    const getFileSizeInZip = (zip, fileName) => {
        const file = zip.file(fileName);
        return file ? file._data.uncompressedSize : 0;
    };

    // Function to calculate the hash of a file
    const calculateFileHash = async (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const buffer = event.target.result;
                const dataView = new DataView(buffer);
                const hashBuffer = await crypto.subtle.digest("SHA-256", dataView);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
                resolve(hashHex);
            };
            reader.onerror = (event) => {
                reject(new Error("Error reading file: " + event.target.error));
            };
            reader.readAsArrayBuffer(file);
        });
    };

    // Function to format file sizes in KB with one decimal digit
    const formatFileSizeKB = (sizeInBytes) => {
        const sizeInKB = sizeInBytes / 1024;
        return sizeInKB.toFixed(1); // Format with one decimal digit
    };

    // Function to display file names and sizes in a table
    const displayFileNamesAndSizesWithHighlight = (fileInfos, container) => {
        if (fileInfos.length > 0) {
            // Create a result table
            const table = document.createElement("table");
            const tbody = document.createElement("tbody");

            table.innerHTML = `
                <thead>
                    <tr>
                        <th>File Name</th>
                        <th>File Size (KB)</th>
                    </tr>
                </thead>
            `;

            fileInfos.forEach(function (fileInfo) {
                // Create a table row
                const row = document.createElement("tr");

                // Create a cell for file name
                const nameCell = document.createElement("td");
                nameCell.textContent = fileInfo.name;

                // Check if the file name is "Fallback.jpg" or "Fallback_jpg"
                if (fileInfo.name === "Fallback.jpg" || fileInfo.name === "Fallback_jpg") {
                    const fileSize = fileInfo.size;
                    if (fileSize >= 40 * 1024) {
                        // Highlight the entire row in orange if the file size is >= 40KB
                        row.style.backgroundColor = "orange";
                    }
                }

                row.appendChild(nameCell);

                // Create a cell for file size
                const sizeCell = document.createElement("td");
                sizeCell.textContent = `${formatFileSizeKB(fileInfo.size)} KB`;
                row.appendChild(sizeCell);

                tbody.appendChild(row);
            });

            table.appendChild(tbody);

            // Check and apply styling based on dimensions and fallback files
            const fallbackStyling = checkFallbackFiles(fileInfos);
            if (fallbackStyling === "red") {
                // If dimensions condition not met, highlight the entire table in red
                table.style.backgroundColor = "red";
            }

            // Append the result table to the container
            container.appendChild(table);
        } else {
            container.textContent = "No files found in the ZIP package.";
        }
    };

    // Function to check width, height, and zip file size conditions and apply styling
    const checkAndHighlightDimensions = (width, height, zipSizeKB) => {
        // Check if width, height, and size conditions are not met
        console.log("Width:", width, "Height:", height, "Zip Size:", zipSizeKB);
        if (
            (width === "300px" && height === "250px" && zipSizeKB >= 150) ||
            (width === "300px" && height === "50px" && zipSizeKB >= 50) ||
            (width === "320px" && height === "50px" && zipSizeKB >= 50) ||
            (width === "300px" && height === "600px" && zipSizeKB >= 200) ||
            (width === "160px" && height === "600px" && zipSizeKB >= 200) ||
            (width === "728px" && height === "90px" && zipSizeKB >= 200)
        ) {
            // Dimensions condition not met, highlight dimensions table in red
            return "red";
        }
        return ""; // No special styling
    };

// Function to check fallback variations and apply styling
const checkFallbackFiles = (fileInfos) => {
    const fallbackImageVariations = [
        "fallback_image.jpg",
        "fallback.jpg",
        "Fallback.jpeg",
        "fallback.jpeg",
        "Fallback.jpg",
        "fallback.jpg",
        "Fallback.jpeg",
        "fallback.jpeg",
        "Fallback.jpg",
        "fallback.jpg",
        "Fallback.jpeg",
        "fallback.jpeg",
        "Fallback_Image.jpg",
        "Fallback_Image.jpeg",
        "Fallback_image.jpg",
        "Fallback_image.jpeg"
    ];

    const hasFallback = fileInfos.some(fileInfo => {
        return fallbackImageVariations.includes(fileInfo.name.toLowerCase());
    });

    // Check if any of the fallback variations is missing
    if (!hasFallback) {
        // Change the entire table color to red
        return "red";
    }

    return ""; // No special styling
};


    // Function to show the result section and hide the zipForm
    const showResultSection = () => {
        resultSection.style.display = "block";
        zipForm.style.display = "none";
    };



    // Add event listener to the upload button
    document.getElementById("submitBtn").addEventListener("click", async function () {
        const selectedFiles = fileInput.files;
        if (selectedFiles.length === 0) {
            alert("Please select one or more ZIP files.");
            return;
        }

        // Hide the form
        zipForm.style.display = "none";

        // Show the Back and Next button
        backBtn.style.visibility = "visible";
        backBtn.style.display = "block";
        nextBtn.style.display = "block";

        // Create a function to process each selected file
        const processFile = async (zipFile) => {
            // Calculate the hash of the ZIP file
            const zipFileHash = await calculateFileHash(zipFile);

            // Check if the hash is already in the set (i.e., duplicate file)
            if (uniqueFileHashes.has(zipFileHash)) {
                alert("Duplicate ZIP file detected. Please upload a unique ZIP file.");
                zipForm.style.display = "block";
                return;
            }

            // Add the hash to the set (i.e., mark this file as unique)
            uniqueFileHashes.add(zipFileHash);

            const reader = new FileReader();
            reader.onload = function () {
                const zip = new JSZip();
                zip.loadAsync(reader.result)
                    .then(function (contents) {
                            // Function to create a container for ZIP file results
                            const createZipResultContainer = () => {
                            const zipFileContainer = document.createElement("div");
                            zipFileContainer.className = "zip-file-container";
                            return zipFileContainer;
                            };
                            const zipFileContainer = createZipResultContainer();

                        // Extract file names and sizes
                        const fileInfos = [];

                        contents.forEach(function (relativePath, zipEntry) {
                            fileInfos.push({
                                name: zipEntry.name,
                                size: zipEntry._data.uncompressedSize, // Size in bytes
                            });
                        });

                        // Extract the index.html file from the ZIP package
                        const indexHtml = contents.files["index.html"];
                        if (!indexHtml) {
                            alert("index.html not found in the ZIP package.");
                            return;
                        }

                        // Parse the HTML content to find and extract width and height attributes
                        const htmlContent = indexHtml.async("text");
                        htmlContent.then(function (data) {
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(data, "text/html");

                            // Calculate the size of the ZIP file in KB
                            const zipSizeKB = Math.ceil(zipFile.size / 1024);

                            // Find the <gwd-page> element
                            const gwdPageElement = doc.querySelector('gwd-page');
                            if (gwdPageElement) {
                                const width = gwdPageElement.getAttribute("data-gwd-width");
                                const height = gwdPageElement.getAttribute("data-gwd-height");

                    // Store the width and height in the iframeDimensions array
                    iframeDimensions.push({ width, height });

                                // Get the file name
                                const fileName = zipFile.name;

                                // Create a new container for this set of results
                                const newResultContainer = document.createElement("div");
                                newResultContainer.className = "dimensions";

                                newResultContainer.innerHTML = `File Name: ${fileName}<br>Width: ${width}, Height: ${height}, File Size: ${(zipSizeKB)} KB`;

                                // Check and apply styling based on dimensions and fallback files
                                const dimensionsStyling = checkAndHighlightDimensions(width, height, zipSizeKB);

                                if (dimensionsStyling === "red") {
                                    // If dimensions condition not met, highlight the entire container in red
                                    newResultContainer.style.backgroundColor = "red";
                                }

                                // Append the new results container to the existing results
                                zipFileContainer.appendChild(newResultContainer);

                                // Display file names and sizes with highlighting
                                displayFileNamesAndSizesWithHighlight(fileInfos, zipFileContainer);

                                // Show the result box
                                resultSection.style.display = "block"; // Show the result box
                            } else {
                                zipFileContainer.textContent = "No <gwd-page> element found.";
                            }

                            // Find all <gwd-exit> elements with metric and url attributes
                            const gwdExitElements = doc.querySelectorAll('gwd-exit[metric][url]');
                            if (gwdExitElements.length > 0) {
                                // Create the result table
                                const table = document.createElement("table");
                                const tbody = document.createElement("tbody");

                                table.innerHTML = `
                                    <thead>
                                        <tr>
                                            <th>Metric</th>
                                            <th>URL</th>
                                        </tr>
                                    </thead>
                                `;

                                gwdExitElements.forEach(function (gwdExitElement) {
                                    const metric = gwdExitElement.getAttribute("metric");
                                    const url = gwdExitElement.getAttribute("url");

                                    // Create a table row
                                    const row = document.createElement("tr");

                                    // Create a metric cell
                                    const metricCell = document.createElement("td");
                                    metricCell.textContent = metric;
                                    row.appendChild(metricCell);

                                    // Create a URL cell
                                    const urlCell = document.createElement("td");
                                    urlCell.textContent = url;
                                    urlCell.classList.add("url-cell");
                                    row.appendChild(urlCell);

                                    tbody.appendChild(row);
                                });

                                table.appendChild(tbody);

                                // Append the result table to the container
                                zipFileContainer.appendChild(table);
                            } else {
                                zipFileContainer.textContent = "No <gwd-exit> elements with 'metric' and 'url' attributes found.";
                            }

                            // Append the container for this ZIP file to the result section
                            resultSection.appendChild(zipFileContainer);
                        });
                    })
                    .catch(function (error) {
                        console.error("Error extracting ZIP contents: ", error);
                    });
            };

            reader.readAsArrayBuffer(zipFile);
        };

        // Process each selected file
        for (const file of selectedFiles) {
            processFile(file);
        }
    });

// Define a variable to track if the upload button has been clicked
let uploadButtonClicked = false;

// Declare selectedFolder at a higher scope
let selectedFolder;

// Function to show the bannerCheckBoxContainer and hide the zipForm
const showBannerCheckBoxContainer = () => {
    resultSection.style.display = "none"; // Hide resultSection
    zipForm.style.display = "none";
    console.log(iframeDimensions);


    // Select the existing banner-check-box-container div
    const bannerCheckBoxContainer = document.querySelector('.banner-check-box-container');

    // Ensure the container is empty (remove any previous content)
    bannerCheckBoxContainer.innerHTML = '';

    // Create a container for iframes
    const iframesContainer = document.createElement("div");
    iframesContainer.className = "iframes-container";
    iframesContainer.style.visibility = "hidden";

    // Create a file input for selecting multiple files
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".txt, .zip";
    fileInput.multiple = true;

    // Create an "Upload" button
    const uploadButton = document.createElement("button");
    uploadButton.textContent = "Upload";
    uploadButton.className = "upload-button";

    // Add the file input and "Upload" button to the container
    bannerCheckBoxContainer.appendChild(fileInput);
    bannerCheckBoxContainer.appendChild(uploadButton);

    // Add the iframes container to the bannerCheckBoxContainer
    bannerCheckBoxContainer.appendChild(iframesContainer);

    // Add event listener to the "Upload" button to trigger the file input
    uploadButton.addEventListener("click", async function () {
        const selectedFiles = fileInput.files;
        iframesContainer.style.visibility = "visible";

        if (selectedFiles.length === 0) {
            alert("Please select one or more text files or ZIP files.");
            return;
        }

        // Process each selected file (text file or ZIP file)
        for (const selectedFile of selectedFiles) {
            try {
                if (selectedFile.name.endsWith(".txt")) {
                    // Handle text file containing folder paths
                    const folderPaths = await readTextFile(selectedFile);

                    // Process each folder path and display iframes
                    for (const folderPath of folderPaths) {
                        await displayIframes(folderPath, iframesContainer, iframeDimensions);
                    }
                } else if (selectedFile.name.endsWith(".zip")) {
                    // Handle ZIP file containing folders
                    const folderPaths = await extractFoldersFromZip(selectedFile);

                    // Process each folder path and display iframes
                    for (const folderPath of folderPaths) {
                        await displayIframes(folderPath, iframesContainer);
                    }
                }
            } catch (error) {
                console.error("Error processing file:", error);
            }
        }
    });

    // Show the bannerCheckBoxContainer
    bannerCheckBoxContainer.style.display = "block";

};

// Helper function to display iframes for a folder path with width and height
async function displayIframes(folderPath, iframesContainer, iframeDimensions) {
    // Extract the dimensions from the folder path URL
    const dimensionMatch = folderPath.match(/(\d+)x(\d+)/);

    if (!dimensionMatch) {
        console.error(`Invalid folder path: ${folderPath}`);
        return;
    }

    const width = `${dimensionMatch[1]}px`;
    const height = `${dimensionMatch[2]}px`;

    // Find a matching dimension in the iframeDimensions array
    const matchingDimension = iframeDimensions.find((dimension) => {
        return dimension.width === width && dimension.height === height;
    });

    if (matchingDimension) {
        // If a matching dimension is found, use it
        const matchedWidth = matchingDimension.width;
        const matchedHeight = matchingDimension.height;

        // Create an iframe for index.html
        const indexIframe = document.createElement("iframe");
        indexIframe.className = "index-iframe";

        // Create an iframe for fallback.jpg or fallback_image.jpg
        const fallbackIframe = document.createElement("iframe");
        fallbackIframe.className = "fallback-iframe";

        try {
            // Set the width and height of both iframes
            indexIframe.style.width = matchedWidth;
            indexIframe.style.height = matchedHeight;
            fallbackIframe.style.width = matchedWidth;
            fallbackIframe.style.height = matchedHeight;

            // Helper function to check if a fallback image file exists
            async function checkFallbackImageVariations() {
                const fallbackImageVariations = [
                    "fallback_image.jpg",
                    "fallback.jpg",
                    "Fallback.jpeg",
                    "fallback.jpeg",
                    "Fallback.jpg",
                    "fallback.jpg",
                    "Fallback.jpeg",
                    "fallback.jpeg",
                    "Fallback.jpg",
                    "fallback.jpg",
                    "Fallback.jpeg",
                    "fallback.jpeg",
                    "Fallback_Image.jpg",
                    "Fallback_Image.jpeg",
                    "Fallback_image.jpg",
                    "Fallback_image.jpeg"
                ];

                for (const variation of fallbackImageVariations) {
                    if (await fileExistsInFolder(folderPath, variation)) {
                        return variation;
                    }
                }

                return null; // No fallback image found
            }

            // Determine the fallback image file name based on availability
            const fallbackFileName = await checkFallbackImageVariations();

            if (fallbackFileName) {
                const fallbackFilePath = `${folderPath}/${fallbackFileName}`;
                fallbackFileWhole = fallbackFilePath;

                // Log the fallback image name and path to the console
                console.log("Fallback Image Name:", fallbackFileName);
                console.log("Fallback Image Path:", fallbackFilePath);

                // Load the fallback into the fallback iframe
                fallbackIframe.src = fallbackFilePath;
            }

            // Load index.html into the index iframe
            const indexHtmlPath = `${folderPath}/index.html`;

            // Load index.html into the index iframe
            indexIframe.src = indexHtmlPath;

// Create a container for the iframes and append them
const iframeContainer = document.createElement("div");

// Check if matched width and height are 728px and 90px
if (matchedWidth === "728px" && matchedHeight === "90px") {
    iframeContainer.className = "728iframe";
} else {
    iframeContainer.className = "iframe-container";
}

iframeContainer.appendChild(indexIframe);
iframeContainer.appendChild(fallbackIframe);

            // Append the iframes to the iframes container
            iframesContainer.appendChild(iframeContainer);

            // Display the width and height in the console
            console.log(`Width: ${matchedWidth}, Height: ${matchedHeight}`);
        } catch (error) {
            console.error("Error setting iframe dimensions:", error);
            // Handle the error accordingly
        }
    } else {
        console.error(`No matching dimensions found for ${width}x${height}`);
    }
}



// Helper function to read a text file and extract folder paths
async function readTextFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target.result;
            // Split the content by lines to get folder paths
            const folderPaths = content.split("\n").map((line) => line.trim());
            resolve(folderPaths);
        };
        reader.onerror = (event) => {
            reject(new Error("Error reading file: " + event.target.error));
        };
        reader.readAsText(file);
    });
}

// Helper function to extract folders from a ZIP file
async function extractFoldersFromZip(zipFile) {
    const zip = new JSZip();
    const zipData = await zip.loadAsync(zipFile);
    const folderPaths = [];

    for (const fileName in zipData.files) {
        const file = zipData.files[fileName];
        if (file.dir) {
            // This is a folder entry
            folderPaths.push(file.name);
        }
    }

    return folderPaths;
}

// Function to process folders (folderPaths is an array of folder paths)
function processFolders(folderPaths) {
    for (const folderPath of folderPaths) {
        // Perform processing for each folderPath
        console.log("Processing folder:", folderPath);
        // Add your code to handle each folder here
    }
}

// Helper function to create iframes
function createIframe(className, src) {
    const iframe = document.createElement("iframe");
    iframe.className = className;
    iframe.src = src;
    iframe.classList.add("iframe");
    return iframe;
}

// Event handler for folder selection
function handleFolderSelection(event) {
    const selectedFolder = event.target.files[0]; // Use the selected directory

    if (selectedFolder) {
        // Print the selected folder path in the console
        console.log("Selected Folder Path:", selectedFolder.path);
    } else {
        alert("Please select a folder.");
    }
}

// Helper function to check if a file exists in the folder
function fileExistsInFolder(folderUrl, fileName) {
    // You can implement this function based on your requirements.
    // For now, we assume the file exists.
    return true;
}

// Function to hide the Back button
const hideBackButton = () => {
    backBtn.style.visibility = "hidden";
    backBtn.style.display = "block";
};

// Function to show the Back button
const showBackButton = () => {
    backBtn.style.visibility = "visible";
};

function hideBannerCheckBoxContainers() {
    const bannerCheckBoxContainers = document.getElementsByClassName("banner-check-box-container");

    for (let i = 0; i < bannerCheckBoxContainers.length; i++) {
        bannerCheckBoxContainers[i].style.display = "none";
    }
}

function resetBannerCheckBoxContainers() {
    const bannerCheckBoxContainers = document.getElementsByClassName("banner-check-box-container");

    for (let i = 0; i < bannerCheckBoxContainers.length; i++) {
        const container = bannerCheckBoxContainers[i];
        container.innerHTML = ''; // Clear the content
        container.style.display = 'none'; // Hide the container
    }
}

    // Add event listeners to the reset button
    resetButton.addEventListener("click", function () {
        // Reset the file input to clear the selected file
        fileInput.value = null;

        // Reset the result area
        resultSection.style.display = "none";
        resultSection.innerHTML = "";

        // Reset the result area
        backBtn.style.display = "none";
        nextBtn.style.display = "none";

        // Show the form again
        zipForm.style.display = "block";

        // Clear the unique file hashes set
        uniqueFileHashes.clear();

        resetBannerCheckBoxContainers();
    });

// Add event listener to the next button to show result section or run showBannerCheckBoxContainer
nextBtn.addEventListener("click", function () {
    if (zipForm.style.display === "block") {
        // If on zipForm, show resultSection and hide zipForm
        resultSection.style.display = "block";
        zipForm.style.display = "none";
    } else if (resultSection.style.display === "block") {
        // If on resultSection, run showBannerCheckBoxContainer
        showBannerCheckBoxContainer();

    }

    const selectedFiles = fileInput.files;
    if (resultSection.style.display === "block") {
        showBackButton(); // Hide the Back button when on zipForm with no selected files
    }
});


    // Add event listener to the back button
    // backBtn.addEventListener("click", function () {
        // Hide the result section and show the zipForm
        // resultSection.style.display = "none";
        // zipForm.style.display = "block";
// Add event listener to the back button
backBtn.addEventListener("click", function () {
        console.log("bannerCheckBoxContainer:", bannerCheckBoxContainer);
console.log("resultSection:", resultSection);
    if (bannerCheckBoxContainer[0].style.display === "block") {
        // If on BannerCheckBoxContainer, show resultSection and hide BannerCheckBoxContainer
        resultSection.style.display = "block";
        hideBannerCheckBoxContainers();
    } else if (resultSection.style.display === "block") {
        // If on resultSection, show zipForm and hide resultSection
        zipForm.style.display = "block";
        resultSection.style.display = "none";
    }


    const selectedFiles = fileInput.files;
    if (zipForm.style.display === "block") {
        hideBackButton(); // Hide the Back button when on zipForm with no selected files
    } else {
        showBackButton(); // Show the Back button in other cases
    }
});
});



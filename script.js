document.addEventListener("DOMContentLoaded", function () {
    // Get the file input element and reset button
    const fileInput = document.querySelector('input[type="file"]');
    const resetButton = document.getElementById("resetBtn");

    // Add event listeners to the reset button
    resetButton.addEventListener("click", function () {
        // Clear the file input by creating a new input element and replacing the old one
        const newFileInput = document.createElement("input");
        newFileInput.type = "file";
        newFileInput.name = "zipFile";
        newFileInput.accept = ".zip";

        fileInput.parentNode.replaceChild(newFileInput, fileInput);

        // Reset the result area
        const resultSection = document.getElementById("result");
        resultSection.style.display = "none"; // Hide the result box
        resultSection.textContent = "";
    });

    // Add event listener to the upload button
    document.getElementById("submitBtn").addEventListener("click", function () {
        const zipFile = document.querySelector('input[type="file"]').files[0];
        if (!zipFile) {
            alert("Please select a ZIP file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            const zip = new JSZip();
            zip.loadAsync(reader.result)
                .then(function (contents) {
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
                        const fileSizeKB = Math.ceil(zipFile.size / 1024);

                        // Find the <gwd-page> element
                        const gwdPageElement = doc.querySelector('gwd-page');
                        if (gwdPageElement) {
                            const width = gwdPageElement.getAttribute("data-gwd-width");
                            const height = gwdPageElement.getAttribute("data-gwd-height");

                            // Display width and height at the top of the result section with different CSS styling
                            const resultSection = document.getElementById("result");

                            // Create a new container for this set of results
                            const newResultContainer = document.createElement("div");

                            const dimensionsDiv = document.createElement("div");
                            dimensionsDiv.className = "dimensions";
                            dimensionsDiv.innerHTML = `Width: ${width}, Height: ${height}, File Size: ${fileSizeKB} KB`;

                            newResultContainer.appendChild(dimensionsDiv);

                            // Append the new results container to the existing results
                            resultSection.appendChild(newResultContainer);

                            // Show the result box
                            resultSection.style.display = "block"; // Show the result box
                        } else {
                            document.getElementById("result").textContent = "No <gwd-page> element found.";
                        }

                        // Find all <gwd-exit> elements with metric and url attributes
                        const gwdExitElements = doc.querySelectorAll('gwd-exit[metric][url]');
                        if (gwdExitElements.length > 0) {
                            const newResultContainer = document.createElement("div");

                            // Create the result table (same code as before)
                            const table = document.createElement("table");
                            table.innerHTML = `
                                <thead>
                                    <tr>
                                        <th>Metric</th>
                                        <th>URL</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            `;

                            newResultContainer.appendChild(table);

                            const tbody = table.querySelector("tbody");

                            gwdExitElements.forEach(function (gwdExitElement) {
                                const metric = gwdExitElement.getAttribute("metric");
                                const url = gwdExitElement.getAttribute("url");

                                // Create a table row and cells for metric and URL
                                const row = document.createElement("tr");
                                const metricCell = document.createElement("td");
                                const urlCell = document.createElement("td");

                                metricCell.textContent = metric;
                                urlCell.textContent = url;

                                row.appendChild(metricCell);
                                row.appendChild(urlCell);

                                tbody.appendChild(row);
                            });

                            const resultSection = document.getElementById("result");
                            resultSection.appendChild(newResultContainer);
                        } else {
                            document.getElementById("result").textContent = "No <gwd-exit> elements with 'metric' and 'url' attributes found.";
                        }
                    });
                })
                .catch(function (error) {
                    console.error("Error extracting ZIP contents: ", error);
                });
        };

        reader.readAsArrayBuffer(zipFile);
    });
});

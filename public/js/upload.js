document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const messageDiv = document.getElementById('message');
    const file = fileInput.files[0];
    messageDiv.textContent = 'Uploading...';

    fetch('https://aws-manipulator.netlify.app/.netlify/functions/uploadModel', {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Failed to get pre-signed URL");
        }
        return response.json();
    })
    .then(data => {
        const uploadURL = data.uploadURL;
        if (!uploadURL) {
            throw new Error("No upload URL received.");
        }

        // Step 2: Upload file to S3
        messageDiv.textContent = "Uploading to S3...";
        return fetch(uploadURL, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type }
        });
    })
    .then(uploadResponse => {
        if (!uploadResponse.ok) {
            throw new Error("Upload to S3 failed.");
        }

        // Success message
        messageDiv.textContent = "Upload complete!";
        console.log("File uploaded successfully!");
    })
    .catch(error => {
        messageDiv.textContent = `Error: ${error.message}`;
        console.error("Upload failed:", error);
    });

    

    // fetch('https://aws-manipulator.netlify.app/.netlify/functions/uploadModel', {
    //     method: 'POST',
    //     body: formData
    // })
    // .then(response => response.json())
    // .then(data => {
    //     messageDiv.textContent = data.message;
    // })
    // .catch(error => {
    //     messageDiv.textContent = 'Upload failed. Please try again.';
    //     console.error('Error:', error);
    // });
});

document.getElementById('uploadBgForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Uploading...';

    fetch('https://aws-manipulator.netlify.app/.netlify/functions/uploadBackground', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        messageDiv.textContent = data.message;
    })
    .catch(error => {
        messageDiv.textContent = 'Upload failed. Please try again.';
        console.error('Error:', error);
    });
});
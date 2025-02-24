const token = localStorage.getItem("jwt_token");

window.onload = () => {
    if (!token){
        alert("Need to Log in first!");
        windows.location.href = './index.html'
    }
};


document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const fileInput = document.getElementById('fileInput');
    const messageDiv = document.getElementById('message');
    const file = fileInput.files[0];
    messageDiv.textContent = 'Uploading...';

    console.log(file.name);
    console.log(file.type);


    fetch('https://aws-manipulator.netlify.app/.netlify/functions/uploadModel', {
        method: "POST",
        body: JSON.stringify({ fileName: file.name, fileType: "model/gtlf-binary" }),
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

        messageDiv.textContent = "Uploading...";
        return fetch(uploadURL, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": "model/gtlf-binary" }
        });
    })
    .then(uploadResponse => {
        if (!uploadResponse.ok) {
            throw new Error("Upload to S3 failed.");
        }

        messageDiv.textContent = "Upload complete!";
        console.log("File uploaded successfully!");
    })
    .catch(error => {
        messageDiv.textContent = `Error: ${error.message}`;
        console.error("Upload failed:", error);
    });
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
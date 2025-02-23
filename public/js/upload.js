document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Uploading...';

    fetch('https://aws-manipulator.netlify.app/.netlify/functions/uploadModel', {
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
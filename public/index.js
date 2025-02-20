document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const formData = new FormData(this);
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = 'Uploading...';

    fetch('/upload', {
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
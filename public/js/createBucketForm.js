document.getElementById('createBucketForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const bucketName = document.getElementById('bucketName').value;
    const messageDiv = document.getElementById('statusMessage');
    messageDiv.textContent = 'Creating...';

    const data = {bucketName : bucketName};

    fetch('/createBucket', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        messageDiv.textContent = data.message;
    })
    .catch(error => {
        messageDiv.textContent = 'Fail to create bucket. Please try again.';
        console.error('Error:', error);
    });
});

document.getElementById('back2Index').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = './index.html';
});


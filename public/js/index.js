function fetchBuckets() {
    fetch('https://aws-manipulator.netlify.app/.netlify/functions/getBucketList')
        .then(response => response.json())
        .then(buckets => {
            console.log('Buckets:', buckets);
            displayBuckets(buckets);
        })
        .catch(error => {
            console.error('Error fetching buckets:', error);
        });
}

function displayBuckets(buckets) {
    const bucketListElement = document.getElementById('bucketList');
    bucketListElement.innerHTML = '';
    
    buckets.forEach(bucket => {
        const li = document.createElement('li');
        li.textContent = bucket;
        bucketListElement.appendChild(li);
    });
}

window.onload = () => {
    fetchBuckets();
};

document.getElementById('createBucketButton').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = './createBucketForm.html';
});

document.getElementById('chooseWorkingBucketForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const bucketName = document.getElementById('chooseWorkingBucketInput').value;

    const data = {
        bucketName : bucketName,
        paramName : "MODEL_S3_BUCKET"
    };
    
    fetch('https://aws-manipulator.netlify.app/.netlify/functions/changeWorkingBucketParam', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        messageDiv.textContent = data.message;
    })
    .catch(error => {
        console.error('Error:', error);
        messageDiv.textContent = 'An error occurred while changing the bucket parameter.';
    });

    window.location.href = './upload.html';
});
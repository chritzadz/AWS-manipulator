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

const token = localStorage.getItem("jwt_token");

window.onload = () => {
    if (token){
        fetchBuckets();
    }
    else{
        alert("Need to Log in first!");
        window.location.href = './index.html'
    }
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

    const token = localStorage.getItem("jwt_token");
    if (token){
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
    }
    else{
        alert("You need to log in first!");
    }
});
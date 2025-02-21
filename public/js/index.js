function fetchBuckets() {
    fetch('/getBucketList')
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

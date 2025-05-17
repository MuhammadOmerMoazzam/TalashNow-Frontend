document.getElementById('lostItemForm').addEventListener('submit', function(event) {
    event.preventDefault();
    alert("Lost item reported successfully!");
});

document.getElementById('foundItemForm').addEventListener('submit', function(event) {
    event.preventDefault();
    alert("Found item reported successfully!");
});

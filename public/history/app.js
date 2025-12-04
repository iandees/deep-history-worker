// Scroll to highlight a version column in the table
function scrollToId(id) {
    var el = document.getElementById(id);
    if (el) {
        el.scrollIntoView({behavior: "smooth", block: "center"});
    }
}

// If the page loads with a URL that has a hash that begins with 'version', scroll to that version
window.onload = function() {
    if (window.location.hash.startsWith('#version')) {
        scrollToId(window.location.hash.substring(1));
    }
};

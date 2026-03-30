// Get modal elements
const modal = document.getElementById("commentModal");
const openBtn = document.getElementById("openModal");
const closeBtn = document.getElementById("closeModal");

// Comment form elements
const newComment = document.getElementById("newComment");
const submitBtn = document.getElementById("submitComment");
const comments = document.querySelector(".comments");

// Open modal
openBtn.onclick = () => {
  modal.style.display = "block";
};

// Close modal when clicking the X
closeBtn.onclick = () => {
  modal.style.display = "none";
};

// Close modal when clicking outside
window.onclick = (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// Add a new comment
submitBtn.onclick = () => {
  if (newComment.value.trim() !== "") {
    const p = document.createElement("p");
    p.innerHTML = `<strong>You:</strong> ${newComment.value}`;
    comments.appendChild(p);
    newComment.value = ""; // clear textarea
  }
};

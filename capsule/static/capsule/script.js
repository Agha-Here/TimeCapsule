// Early device detection
function isMobileDevice() {
    return window.innerWidth <= 768;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg') });

function updateCanvasSize() {
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);
    renderer.setSize(window.innerWidth, height);
    camera.aspect = window.innerWidth / height;
    camera.updateProjectionMatrix();
}

updateCanvasSize();
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for better performance

// Different settings for mobile and desktop
const settings = {
    desktop: {
        starCount: 2000,
        starSize: 1.5,
        spaceSize: 1300,
        cameraPosition: 600,
        rotationSpeed: 0.0004
    },
    mobile: {  // Changed from 'isMobileDevice' to 'mobile'
        starCount: 2000,    // Increased star count
        starSize: 0.8,      // Smaller stars
        spaceSize: 800,     // Smaller space for denser field
        cameraPosition: 600, // Closer camera
        rotationSpeed: 0.0003
    }
};

// Get current settings based on device
const currentSettings = isMobileDevice() ? settings.mobile : settings.desktop;

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ 
    color: 0xffffff,
    size: currentSettings.starSize,
    sizeAttenuation: true, // This makes stars look better at different distances
    transparent: true,
    opacity: 0.8  // Slightly transparent stars
});


const starVertices = [];
for (let i = 0; i < currentSettings.starCount; i++) {
    const x = (Math.random() - 0.5) * currentSettings.spaceSize;
    const y = (Math.random() - 0.5) * currentSettings.spaceSize;
    const z = (Math.random() - 0.5) * currentSettings.spaceSize;
    starVertices.push(x, y, z);
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

camera.position.z = currentSettings.cameraPosition;

function animate() {
    requestAnimationFrame(animate);
    stars.rotation.x += currentSettings.rotationSpeed;
    stars.rotation.y += currentSettings.rotationSpeed;
    renderer.render(scene, camera);
}
animate();

// Handle resize properly
window.addEventListener('resize', () => {
    updateCanvasSize();
    // Update settings if device type changes
    const newSettings = isMobileDevice() ? settings.mobile : settings.desktop;
    starMaterial.size = newSettings.starSize;
    camera.position.z = newSettings.cameraPosition;
});

let isSubmitting = false;
let currentUpload = null;
let currentProgressContainer = null;

// Function to check if capsule is locked
function isLocked(unlockDate) {
    const today = new Date();
    const unlock = new Date(unlockDate);
    return today < unlock;
}

// Function to handle media button clicks
function handleMediaButtonClick(e) {
    e.stopPropagation();
    const url = e.currentTarget.dataset.url;
    const card = e.target.closest('.capsule-card');
    const unlockDate = card.dataset.unlockDate;
    
    if (isLocked(unlockDate)) {
        e.preventDefault();
        alert(`This capsule is locked until ${new Date(unlockDate).toLocaleDateString()}`);
        return;
    }
    
    if (url) {
        showMediaPreview(url);
    }
}

function showMediaPreview(url) {
    const mediaModal = document.querySelector('.media-preview-modal');
    const mediaContainer = mediaModal.querySelector('.media-container');
    mediaContainer.innerHTML = '';

    // Determine file type
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
    const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
    
    if (isImage) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Media Preview';
        mediaContainer.appendChild(img);
    } else if (isVideo) {
        const video = document.createElement('video');
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        mediaContainer.appendChild(video);
    } else {
        // For other file types (PDFs, docs, etc)
        const downloadBtn = document.createElement('a');
        downloadBtn.href = url;
        downloadBtn.className = 'download-btn';
        downloadBtn.download = ''; // This will use the original filename
        downloadBtn.innerHTML = `
            <i class="fas fa-download"></i>
            Download File
        `;
        mediaContainer.appendChild(downloadBtn);
    }

    // Show modal with animation
    mediaModal.style.display = 'flex';
    document.body.classList.add('modal-open');

     // Function to stop video and close modal
     const closeMediaModal = () => {
        const video = mediaContainer.querySelector('video');
        if (video) {
            video.pause();  // Pause the video
            video.currentTime = 0;  // Reset video to beginning
            video.src = '';  // Clear the source
        }
        mediaModal.style.display = 'none';
        document.body.classList.remove('modal-open');
    };

    // Close button handler
    const closeBtn = mediaModal.querySelector('.media-close');
    closeBtn.onclick = closeMediaModal;

    // Close on outside click
    mediaModal.onclick = (e) => {
        if (e.target === mediaModal) {
            closeMediaModal();
        }
    };

      // Close on ESC key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mediaModal.style.display === 'flex') {
            closeMediaModal();
        }
    });
}

function validateFileSize(input) {
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    const warningElement = input.parentElement.querySelector('.file-size-warning');
    const submitButton = document.querySelector('.capsule-form .cta-button');
    
    if (input.files.length > 0) {
        const fileSize = input.files[0].size;
        
        if (fileSize > maxSize) {
            warningElement.style.display = 'block';
            warningElement.textContent = `File size (${(fileSize / 1048576).toFixed(2)}MB) exceeds 100MB limit`;
            submitButton.disabled = true;
            input.value = ''; // Clear the input
        } else {
            warningElement.style.display = 'none';
            submitButton.disabled = false;
        }
    }
}

// Function to handle card clicks
function handleCardClick(e) {
    console.log('Card clicked'); // Debug log
    
    if (e.target.closest('.view-media-btn')) {
        return; // Let the media button handler handle it
    }

    const card = e.currentTarget;
    const modal = document.querySelector('.capsule-modal');
    const unlockDate = card.dataset.unlockDate;
    
    // Get the capsule ID from the like button's data attribute
    const cardCapsuleId = card.querySelector('.like-button').dataset.capsuleId;

    // Set up share button click handler
    const shareBtn = modal.querySelector('.share-btn');
    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent modal from closing
        handleShare(capsuleId);
    });
    
     // Update like button and count
     const cardLikeButton = card.querySelector('.like-button');
     const modalLikeButton = modal.querySelector('.modal-like-btn');
     const cardLikeCount = card.querySelector('.like-count');
     
    modalLikeButton.dataset.capsuleId = cardCapsuleId;
     modalLikeButton.classList.toggle('liked', cardLikeButton.classList.contains('liked'));
     modal.querySelector('.like-count').textContent = cardLikeCount.textContent;
     
    if (!modal) {
        console.error('Modal element not found');
        return;
    }

    // Get card data
    const title = card.querySelector('.capsule-anonymous').textContent;
    const capsuleId = card.querySelector('.capsule-id').textContent; 
    const unlock = card.querySelector('.capsule-date').textContent;
    const created = card.querySelector('.capsule-created').textContent;
    const message = card.querySelector('.capsule-message').dataset.fullMessage;
    const isCardLocked = isLocked(unlockDate);

    // Set modal content
    modal.querySelector('.modal-anonymous').textContent = title;
    modal.querySelector('.capsule-id').textContent = capsuleId;
    modal.querySelector('.modal-unlock').textContent = unlock;
    modal.querySelector('.modal-created').textContent = created;
    modal.querySelector('.modal-message').textContent = message;

    // Handle media content
    const modalMedia = modal.querySelector('.modal-media');
    modalMedia.innerHTML = '';
    const mediaBtn = card.querySelector('.view-media-btn');
    
    if (mediaBtn) {
        const newButton = document.createElement('button');
        newButton.className = 'view-media-btn';
        newButton.dataset.url = mediaBtn.dataset.url;
        newButton.innerHTML = `<i class="fas fa-eye"></i> View Attachment`;
        
        // Update this part to use showMediaPreview instead of window.open
        newButton.addEventListener('click', function(e) {
            e.stopPropagation();
            const url = this.dataset.url;
            const unlockDate = card.dataset.unlockDate;
            
            if (isLocked(unlockDate)) {
                e.preventDefault();
                alert(`This capsule is locked until ${new Date(unlockDate).toLocaleDateString()}`);
                return;
            }
            
            if (url) {
                showMediaPreview(url); // Use showMediaPreview instead of window.open
            }
        });
        
        modalMedia.appendChild(newButton);
    }

    // Handle locked state
    const modalContent = modal.querySelector('.modal-content');
    const existingLockOverlay = modalContent.querySelector('.modal-lock-overlay');
    
    if (existingLockOverlay) {
        existingLockOverlay.remove();
    }

    if (isCardLocked) {
        modalContent.classList.add('locked');
        const lockOverlay = document.createElement('div');
        lockOverlay.className = 'modal-lock-overlay';
        lockOverlay.innerHTML = `
            <i class="fas fa-lock"></i>
            <span>This capsule is locked until</span>
            <span class="unlock-date">${new Date(unlockDate).toLocaleDateString()}</span>
        `;
        modalContent.appendChild(lockOverlay);
    } else {
        modalContent.classList.remove('locked');
    }

    // Show modal with animation
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    requestAnimationFrame(() => {
        modal.classList.add('active');
    });
}

// Function to check if capsule is locked
function isLocked(unlockDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Parse unlock date correctly
    const unlock = new Date(unlockDate);
    unlock.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Fix the comparison logic:
    // Return true if today is BEFORE unlock date (meaning it's still locked)
    return today < unlock;
}

// Function to format date for comparison
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];  // Returns YYYY-MM-DD format
}

// Function to attach event listeners to capsule cards
function attachCardListeners() {
    const cards = document.querySelectorAll('.capsule-card');
    cards.forEach(card => {
        // Remove existing listeners to prevent duplicates
        card.removeEventListener('click', handleCardClick);
        
        // Add new card click listener
        card.addEventListener('click', handleCardClick);
        
        // Add media button listeners
        const mediaBtn = card.querySelector('.view-media-btn');
        if (mediaBtn) {
            mediaBtn.removeEventListener('click', handleMediaButtonClick);
            mediaBtn.addEventListener('click', handleMediaButtonClick);
        }

        // Check if card should be locked
        const unlockDate = card.dataset.unlockDate;
        const createdDate = card.querySelector('.capsule-created').textContent;
        
        // Check both conditions: unlock date reached OR created date equals unlock date
        if (!isLocked(unlockDate) || formatDate(unlockDate) === formatDate(createdDate)) {
            // Capsule is unlocked
            const content = card.querySelector('.capsule-content');
            content.classList.remove('locked');
            
            // Remove existing lock overlay if it exists
            const existingOverlay = card.querySelector('.capsule-lock-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }
        } else {
            // Capsule is locked
            const content = card.querySelector('.capsule-content');
            content.classList.add('locked');
            
            // Add lock overlay
            const lockOverlay = document.createElement('div');
            lockOverlay.className = 'capsule-lock-overlay locked';
            lockOverlay.innerHTML = `
                <i class="fas fa-lock"></i>
                <p>This capsule is locked until</p>
                <p class="unlock-date">${formatDate(unlockDate)}</p>
            `;
            card.appendChild(lockOverlay);
        }
    });
}

// Function to update public capsules
async function updatePublicCapsules() {
    try {
        const response = await fetch('/create/');
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newCapsules = doc.querySelector('.public-capsules-container');
        
        if (newCapsules) {
            const currentCapsules = document.querySelector('.public-capsules-container');
            currentCapsules.innerHTML = newCapsules.innerHTML;
            attachCardListeners();
        }
    } catch (error) {
        console.error('Error updating capsules:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // GSAP Animations
    gsap.from('.title', { opacity: 0, y: -50, duration: 1.5, delay: 0.5 });
    gsap.from('.subtitle', { opacity: 0, y: 50, duration: 1.5, delay: 1 });

    // Home page button handler
    if (document.getElementById('create-capsule-btn')) {
        gsap.from('.cta-button', { opacity: 0, y: 50, duration: 1.5, delay: 1.5 });
        document.getElementById('create-capsule-btn').addEventListener('click', () => {
            gsap.to('.cta-button', {
                scale: 1.1,
                duration: 0.2,
                onComplete: () => window.location.href = '/create/'
            });
        });
    }


    document.querySelectorAll('.like-button').forEach(button => {
        if (button.dataset.liked === 'True') {
            button.classList.add('liked');
        }
        
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(button);
        });
    });

    // Form handling
    if (document.querySelector('.capsule-form')) {
        const form = document.querySelector('.capsule-form');
        const dateInput = document.querySelector('input[type="date"]');
        const successModal = document.querySelector('.success-modal');
        const modalTitleInput = document.querySelector('#modal-title');
        const titleFeedback = successModal.querySelector('.title-feedback');
        const launchButton = document.querySelector('#launch-capsule');

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.min = today;

        // Title input handler
        let titleCheckTimeout;
        modalTitleInput.addEventListener('input', function() {
            clearTimeout(titleCheckTimeout);
            
            let title = this.value.trim().replace(/[^a-zA-Z0-9_]/g, '');
            this.value = title;
            
            if (!title) {
                titleFeedback.textContent = '';
                titleFeedback.className = 'title-feedback';
                launchButton.disabled = true;
                launchButton.classList.remove('ready');
                return;
            }

            titleCheckTimeout = setTimeout(async () => {
                try {
                    const response = await fetch(`/check-title/?title=${encodeURIComponent(title)}`);
                    const data = await response.json();

                    if (title.length < 3) {
                        titleFeedback.textContent = 'Title must be at least 3 characters long';
                        titleFeedback.className = 'title-feedback invalid';
                        launchButton.disabled = true;
                        launchButton.classList.remove('ready');
                    } else if (title.length > 30) {
                        titleFeedback.textContent = 'Title must be less than 30 characters';
                        titleFeedback.className = 'title-feedback invalid';
                        launchButton.disabled = true;
                        launchButton.classList.remove('ready');
                    } else {
                        titleFeedback.textContent = data.message;
                        titleFeedback.className = `title-feedback ${data.is_taken ? 'invalid' : 'valid'}`;
                        launchButton.disabled = data.is_taken;
                        if (!data.is_taken) {
                            launchButton.classList.add('ready');
                        } else {
                            launchButton.classList.remove('ready');
                        }
                    }
                } catch (error) {
                    console.error('Error:', error);
                    titleFeedback.textContent = 'Error checking title availability';
                    titleFeedback.className = 'title-feedback error';
                    launchButton.disabled = true;
                    launchButton.classList.remove('ready');
                }
            }, 300);
        });

        // Form submission handler
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            window.tempFormData = new FormData(this);
            
            const fileInput = document.getElementById('upload');
            const maxSize = 100 * 1024 * 1024; // 100MB in bytes
            
            if (fileInput.files.length > 0) {
                const fileSize = fileInput.files[0].size;
                if (fileSize > maxSize) {
                    e.preventDefault();
                    alert('File size cannot exceed 100MB');
                    return;
                }
            }

            const unlockDate = new Date(dateInput.value).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            successModal.querySelector('.unlock-date').textContent = unlockDate;
            successModal.querySelector('.unlock-date-text').style.display = 'none';
            successModal.querySelector('.modal-subtitle').style.display = 'block';
            modalTitleInput.style.display = 'block';
            launchButton.style.display = 'block';
            titleFeedback.style.display = 'block';
            
            successModal.classList.add('show');
            successModal.style.display = 'flex';
            modalTitleInput.focus();
        });

        // Launch button handler
        document.getElementById('launch-capsule').addEventListener('click', async function() {
            if (isSubmitting) return;
        
            const button = this;
            const successModal = document.querySelector('.success-modal');
            const modalContent = successModal.querySelector('.success-content');
        
            try {
                isSubmitting = true;
                button.disabled = true;
                button.textContent = 'Launching...';
        
                const formData = window.tempFormData;
                if (!formData) {
                    throw new Error('No form data available');
                }
        
                formData.append('title', document.getElementById('modal-title').value.trim());
                
                const file = formData.get('upload');
                
                if (file && file.size > 0) {
                    // Create progress container
                    const progressContainer = document.createElement('div');
                    progressContainer.className = 'upload-progress-container';
                    progressContainer.innerHTML = `
                        <div class="upload-status">Preparing to upload...</div>
                        <div class="file-info">${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</div>
                        <div class="progress-bar">
                            <div class="progress-fill"></div>
                        </div>
                    `;
                    modalContent.appendChild(progressContainer);
        
                    // Create XHR for upload tracking
                    const xhr = new XMLHttpRequest();
        
                    // Track upload progress
                    xhr.upload.onprogress = (event) => {
                        if (event.lengthComputable) {
                            const percent = (event.loaded / event.total) * 100;
                            const progressBar = progressContainer.querySelector('.progress-fill');
                            const statusText = progressContainer.querySelector('.upload-status');
                            progressBar.style.width = `${percent}%`;
                            statusText.textContent = `Uploading... ${Math.round(percent)}%`;
                        }
                    };
        
                    // Create upload promise
                    const uploadPromise = new Promise((resolve, reject) => {
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                try {
                                    const response = JSON.parse(xhr.response);
                                    resolve(response);
                                } catch (e) {
                                    reject(new Error('Invalid server response'));
                                }
                            } else {
                                reject(new Error(`Upload failed: ${xhr.status}`));
                            }
                        };
                        xhr.onerror = () => reject(new Error('Network error'));
                        
                        xhr.open('POST', '/create/', true);
                        xhr.setRequestHeader('X-CSRFToken', document.querySelector('[name=csrfmiddlewaretoken]').value);
                        xhr.send(formData);
                    });
        
                    const response = await uploadPromise;
                    if (response.success) {
                        progressContainer.querySelector('.upload-status').textContent = 'Upload complete!';
                        progressContainer.querySelector('.progress-fill').style.width = '100%';
                        
                        setTimeout(() => {
                            progressContainer.remove();
                            showSuccessState(successModal);
                            updatePublicCapsules();
                        }, 500);
                    }
        
                } else {
                    // No file upload, just submit normally
                    const response = await fetch('/create/', {
                        method: 'POST',
                        body: formData,
                        headers: {
                            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                        }
                    });
        
                    const data = await response.json();
                    if (!response.ok) {
                        throw new Error(data.error || 'Failed to create capsule');
                    }
        
                    if (data.success) {
                        showSuccessState(successModal);
                        await updatePublicCapsules();
                    }
                }
        
            } catch (error) {
                console.error('Error:', error);
                alert(`Error creating capsule: ${error.message}`);
            } finally {
                isSubmitting = false;
                button.disabled = false;
                button.textContent = 'Launch Capsule';
            }
        });
        
    }

    // Modal close handlers
    const modal = document.querySelector('.capsule-modal');
    const modalClose = modal?.querySelector('.modal-close');
    const successModal = document.querySelector('.success-modal');
    const successModalClose = successModal?.querySelector('.modal-close');

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }, 300);
        });
    }

    if (successModalClose) {
        successModalClose.addEventListener('click', () => {
            successModal.classList.remove('show');
            successModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        });
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.style.display = 'none';
                    document.body.classList.remove('modal-open');
                }, 300);
            }
        });
    }

    // Initialize card listeners
    attachCardListeners();

    // Add this function after your existing functions
    function setupSearch() {
        const searchInput = document.getElementById('capsule-search');
        const capsuleCards = document.querySelectorAll('.capsule-card');
    
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            let hasVisibleCards = false;
    
            capsuleCards.forEach(card => {
                const title = card.dataset.title?.toLowerCase() || '';
                const id = card.dataset.id?.toLowerCase() || '';
                const message = card.dataset.message?.toLowerCase() || '';
    
                if (title.includes(searchTerm) || 
                    id.includes(searchTerm) || 
                    message.includes(searchTerm)) {
                    card.style.display = 'block';
                    hasVisibleCards = true;
                } else {
                    card.style.display = 'none';
                }
            });
    
            // Show/hide no results message
            let noResultsMsg = document.querySelector('.no-results');
            if (!hasVisibleCards) {
                if (!noResultsMsg) {
                    noResultsMsg = document.createElement('p');
                    noResultsMsg.className = 'no-results';
                    noResultsMsg.textContent = 'No capsules found matching your search.';
                    document.querySelector('.public-capsules-container').appendChild(noResultsMsg);
                }
                noResultsMsg.style.display = 'block';
            } else if (noResultsMsg) {
                noResultsMsg.style.display = 'none';
            }
        });
    
        // Clear search when clicking the X button
        searchInput.addEventListener('search', function() {
            if (this.value === '') {
                capsuleCards.forEach(card => card.style.display = 'block');
                const noResultsMsg = document.querySelector('.no-results');
                if (noResultsMsg) noResultsMsg.style.display = 'none';
            }
        });
    }
    setupSearch();
});

// Add reset form function if not already present
function resetForm() {
    const form = document.querySelector('.capsule-form');
    const dateInput = document.querySelector('input[type="date"]');
    const modalTitleInput = document.querySelector('#modal-title');
    const titleFeedback = document.querySelector('.title-feedback');
    const launchButton = document.querySelector('#launch-capsule');
    const today = new Date().toISOString().split('T')[0];

    form.reset();
    dateInput.value = today;
    modalTitleInput.value = '';
    modalTitleInput.style.display = 'block';
    launchButton.style.display = 'block';
    launchButton.disabled = true;
    launchButton.classList.remove('ready');
    titleFeedback.style.display = 'block';
    titleFeedback.textContent = '';
    successModal.querySelector('.modal-title').textContent = 'Almost Done!';
    successModal.querySelector('.modal-subtitle').style.display = 'block';
    successModal.querySelector('.unlock-date-text').style.display = 'none';
    window.tempFormData = null;
}

// Add this helper function if not already present
function showSuccessState(modal) {
    modal.querySelector('.modal-title').textContent = 'Capsule Sealed!';
    document.querySelector('.title-feedback').style.display = 'none';
    document.getElementById('modal-title').style.display = 'none';
    document.getElementById('launch-capsule').style.display = 'none';
    modal.querySelector('.modal-subtitle').style.display = 'none';
    modal.querySelector('.unlock-date-text').style.display = 'block';

    setTimeout(() => {
        modal.classList.remove('show');
        modal.style.display = 'none';
        document.body.classList.remove('modal-open');
        resetForm();
    }, 2000);
}

// Window event listeners
window.addEventListener('resize', updateCanvasSize);
window.addEventListener('scroll', updateCanvasSize);

// Like functionality
function toggleLike(button) {
    const capsuleId = button.dataset.capsuleId;
    
    fetch(`/like/${capsuleId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update all instances of this capsule's like button and count
            const likeButtons = document.querySelectorAll(`.like-button[data-capsule-id="${capsuleId}"]`);
            likeButtons.forEach(btn => {
                btn.classList.toggle('liked', data.is_liked);
                const container = btn.closest('.like-container');
                if (container) {
                    container.querySelector('.like-count').textContent = data.likes;
                }
            });
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to show toast notification
function showToast(message, duration = 2000) {
    // Remove existing toast if any
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    // Create and show new toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove toast after duration
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Share functionality
function handleShare(capsuleId) {
    const numericId = capsuleId.replace(/\D/g, '');
    const baseUrl = document.querySelector('meta[name="base-url"]').content;
    const url = `${baseUrl}/capsule/${numericId}/`;
    
    // Show share modal
    const shareModal = document.querySelector('.share-modal');
    const shareUrl = shareModal.querySelector('#share-url');
    shareUrl.value = url;
    
    // Show the modal
    shareModal.style.display = 'flex';
    
    // Copy button handler with fixed functionality
    const copyBtn = shareModal.querySelector('.copy-btn');
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard!');
        } catch (err) {
            // Fallback for older browsers
            shareUrl.select();
            document.execCommand('copy');
            showToast('Link copied to clipboard!');
        }
    });
    
    // WhatsApp share handler
    const whatsappBtn = shareModal.querySelector('#whatsapp-share');
    whatsappBtn.onclick = () => {
        const text = `Check out this time capsule!`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`;
        window.open(whatsappUrl, '_blank');
    };
    
    // Close button handler
    const closeBtn = shareModal.querySelector('.share-close');
    closeBtn.onclick = () => {
        shareModal.style.display = 'none';
    };
    
    // Click outside to close
    shareModal.onclick = (e) => {
        if (e.target === shareModal) {
            shareModal.style.display = 'none';
        }
    };
}
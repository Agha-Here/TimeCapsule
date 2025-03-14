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
renderer.setPixelRatio(window.devicePixelRatio);

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

const starVertices = [];
for (let i = 0; i < 2000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starVertices.push(x, y, z);
}

starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

camera.position.z = 500;

function animate() {
    requestAnimationFrame(animate);
    stars.rotation.x += 0.0005;
    stars.rotation.y += 0.0005;
    renderer.render(scene, camera);
}
animate();

// ...existing three.js code until animate() remains unchanged...

// Function to check if capsule is locked
function isLocked(unlockDate) {
    const today = new Date();
    const unlock = new Date(unlockDate);
    return today < unlock;
}

// Function to handle media button clicks
function handleMediaButtonClick(e) {
    e.stopPropagation();
    const card = e.target.closest('.capsule-card');
    const unlockDate = card.dataset.unlockDate;
    
    if (isLocked(unlockDate)) {
        e.preventDefault();
        alert(`This capsule is locked until ${new Date(unlockDate).toLocaleDateString()}`);
        return;
    }
    
    const url = e.currentTarget.dataset.url;
    if (url) {
        window.open(url, '_blank');
    }
}

// Function to handle card clicks
function handleCardClick(e) {
    if (e.target.closest('.view-media-btn')) {
        return; // Let the media button handler handle it
    }

    const card = e.currentTarget;
    const modal = document.querySelector('.capsule-modal');
    const unlockDate = card.dataset.unlockDate;
    const anonymous = card.querySelector('.capsule-anonymous').textContent;
    const unlock = card.querySelector('.capsule-date').textContent;
    const created = card.querySelector('.capsule-created').textContent;
    const message = card.querySelector('.capsule-message').dataset.fullMessage;
    const hasMedia = card.querySelector('.capsule-media');
    const isCardLocked = isLocked(unlockDate);

    modal.querySelector('.modal-anonymous').textContent = anonymous;
    modal.querySelector('.modal-unlock').textContent = unlock;
    modal.querySelector('.modal-created').textContent = created;
    modal.querySelector('.modal-message').textContent = message;

    // Handle locked state in modal
    const modalContent = modal.querySelector('.modal-content');

    // First, remove any existing lock overlays
    const existingLockOverlays = modalContent.querySelectorAll('.modal-lock-overlay');
    existingLockOverlays.forEach(overlay => overlay.remove());

    
    if (isCardLocked) {
        modalContent.classList.add('locked');
        const lockOverlay = document.createElement('div');
        lockOverlay.className = 'modal-lock-overlay';
        lockOverlay.innerHTML = `
            <i class="fas fa-lock"></i>
            <p>This capsule is locked until</p>
            <p class="unlock-date">${new Date(unlockDate).toLocaleDateString()}</p>
        `;
        modalContent.appendChild(lockOverlay);
    } else {
        modalContent.classList.remove('locked');
        const existingLockOverlay = modal.querySelector('.modal-lock-overlay');
        if (existingLockOverlay) {
            existingLockOverlay.remove();
        }
    }

    const modalMedia = modal.querySelector('.modal-media');
    modalMedia.innerHTML = '';

    if (hasMedia) {
        const originalButton = hasMedia.querySelector('.view-media-btn');
        if (originalButton) {
            const newButton = originalButton.cloneNode(true);
            newButton.addEventListener('click', handleMediaButtonClick);
            modalMedia.appendChild(newButton);
        }
    }

    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
    setTimeout(() => modal.classList.add('active'), 10);
}

// Function to attach event listeners to capsule cards
function attachCardListeners() {
    const cards = document.querySelectorAll('.capsule-card');
    cards.forEach(card => {
        // Remove existing listeners
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
        if (isLocked(unlockDate)) {
            const content = card.querySelector('.capsule-content');
            content.classList.add('locked');
            
            // Get title and ID from the card
            const titleElement = card.querySelector('.capsule-anonymous');
            const titleText = titleElement ? titleElement.textContent.trim() : 'Anonymous';
            
            // Remove any existing lock overlay
            const existingOverlay = card.querySelector('.capsule-lock-overlay');
            if (existingOverlay) {
                existingOverlay.remove();
            }

            // Add new lock overlay
            const lockOverlay = document.createElement('div');
            lockOverlay.className = 'capsule-lock-overlay locked';
            lockOverlay.innerHTML = `
                <i class="fas fa-lock"></i>
                <p>Capsule "${titleText}" is locked until</p>
                <p class="unlock-date">${new Date(unlockDate).toLocaleDateString()}</p>
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

    // Form handling
    if (document.querySelector('.capsule-form')) {
        const form = document.querySelector('.capsule-form');
        const dateInput = document.querySelector('input[type="date"]');
        const visibilitySlider = document.querySelector('#is-public');
        const passwordGroup = document.querySelector('.password-group');
        const passwordInput = document.querySelector('#password');
        const successModal = document.querySelector('.success-modal');
        const modalTitleInput = document.querySelector('#modal-title');
        const titleFeedback = successModal.querySelector('.title-feedback');
        const launchButton = document.querySelector('#launch-capsule');

        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.min = today;

        // Set initial states
        passwordGroup.style.display = 'none';
        passwordInput.required = false;
        document.querySelector('.slider-label.public').style.color = '#00d2ff';
        document.querySelector('.slider-label.private').style.color = '#a8a8a8';
        launchButton.disabled = true;

        // Visibility slider handler
        visibilitySlider.addEventListener('input', function() {
            const isPrivate = parseInt(this.value) <= 50;
            passwordGroup.style.display = isPrivate ? 'block' : 'none';
            passwordInput.required = isPrivate;
            
            if (!isPrivate) passwordInput.value = '';

            document.querySelector('.slider-label.public').style.color = !isPrivate ? '#00d2ff' : '#a8a8a8';
            document.querySelector('.slider-label.private').style.color = isPrivate ? '#00d2ff' : '#a8a8a8';
        });

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

            const isPrivate = parseInt(visibilitySlider.value) <= 50;
            if (isPrivate && !passwordInput.value.trim()) {
                alert('Please set a password for your private capsule.');
                return;
            }

            // Store form data and show title modal
            window.tempFormData = new FormData(this);
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
        launchButton.addEventListener('click', async function() {
            if (this.disabled) return;

            try {
                const formData = window.tempFormData;
                formData.append('title', modalTitleInput.value.trim());

                const response = await fetch('/create/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                });

                if (response.ok) {
                    // Update modal title and show success message
                    successModal.querySelector('.modal-title').textContent = 'Capsule Sealed!';
                    titleFeedback.style.display = 'none';
                    modalTitleInput.style.display = 'none';
                    launchButton.style.display = 'none';
                    successModal.querySelector('.modal-subtitle').style.display = 'none';
                    successModal.querySelector('.unlock-date-text').style.display = 'block';
                    
                    // Update public capsules
                    await updatePublicCapsules();
                    
                    // Reset after 2 seconds
                    setTimeout(() => {
                        successModal.classList.remove('show');
                        setTimeout(() => {
                            successModal.style.display = 'none';
                            form.reset();
                            dateInput.value = today;
                            visibilitySlider.value = 100;
                            passwordGroup.style.display = 'none';
                            passwordInput.required = false;
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
                        }, 300);
                    }, 2000);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error creating capsule. Please try again.');
            }
        });
    }

    // Card modal close handlers
    const modalClose = document.querySelector('.modal-close');
    const modal = document.querySelector('.capsule-modal');

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.classList.remove('modal-open');
            }, 300);
        });
    }

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
    
    // Initialize public capsule card listeners
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

// Window event listeners
window.addEventListener('resize', updateCanvasSize);
window.addEventListener('scroll', updateCanvasSize);



// Three.js Background Setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg') });

// Canvas size handling
function updateCanvasSize() {
    const height = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);
    renderer.setSize(window.innerWidth, height);
    camera.aspect = window.innerWidth / height;
    camera.updateProjectionMatrix();
}
updateCanvasSize();
renderer.setPixelRatio(window.devicePixelRatio);

// Star field creation
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
            attachCardEventListeners();
        }
    } catch (error) {
        console.error('Error updating capsules:', error);
    }
}

// Function to attach event listeners to capsule cards
function attachCardEventListeners() {
    const capsuleCards = document.querySelectorAll('.capsule-card');
    capsuleCards.forEach(card => {
        card.addEventListener('click', () => openModal(card));
    });
}

// Main Document Ready Event Handler
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
                onComplete: () => {
                    window.location.href = '/create/';
                }
            });
        });
    }

    // Form page initialization
    if (document.querySelector('.capsule-form')) {
        // Initial form animations
        gsap.from('.capsule-form', { opacity: 0, y: 50, duration: 1.5, delay: 1.5, stagger: 0.2 });

        // Set default date to today
        const dateInput = document.querySelector('input[type="date"]');
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.min = today;

        // Title availability check setup
        const titleInput = document.querySelector('input[name="title"]');
        const titleFeedback = document.createElement('div');
        titleFeedback.className = 'title-feedback';
        titleInput.parentNode.appendChild(titleFeedback);
        titleInput.setAttribute('data-valid', 'true');

        let titleCheckTimeout;

        // Title input handler
      
titleInput.addEventListener('input', function() {
  clearTimeout(titleCheckTimeout);
  
  // Remove spaces and special characters, keep only letters, numbers, underscores
  let title = this.value.trim().replace(/[^a-zA-Z0-9_]/g, '');
  
  // Update input value to cleaned version
  this.value = title;
  
  if (!title) {
      titleFeedback.textContent = '';
      titleFeedback.className = 'title-feedback';
      titleInput.setAttribute('data-valid', 'false');
      return;
  }

  titleCheckTimeout = setTimeout(() => {
      fetch(`/check-title/?title=${encodeURIComponent(title)}`)
          .then(response => response.json())
          .then(data => {
              if (title.length < 3) {
                  titleFeedback.textContent = 'Title must be at least 3 characters long';
                  titleFeedback.className = 'title-feedback invalid';
                  titleInput.setAttribute('data-valid', 'false');
              } else if (title.length > 30) {
                  titleFeedback.textContent = 'Title must be less than 30 characters';
                  titleFeedback.className = 'title-feedback invalid';
                  titleInput.setAttribute('data-valid', 'false');
              } else {
                  titleFeedback.textContent = data.message;
                  titleFeedback.className = `title-feedback ${data.is_taken ? 'invalid' : 'valid'}`;
                  titleInput.setAttribute('data-valid', !data.is_taken);
              }
          })
          .catch(error => {
              console.error('Error checking title:', error);
              titleFeedback.textContent = 'Error checking title availability';
              titleFeedback.className = 'title-feedback error';
              titleInput.setAttribute('data-valid', 'true');
          });
  }, 300);
});
        // Visibility toggle and password field setup
        const visibilitySlider = document.querySelector('#is-public');
        const passwordGroup = document.querySelector('.password-group');
        const passwordInput = document.querySelector('#password');

        // Set initial states
        passwordGroup.style.display = 'none';
        passwordInput.required = false;
        document.querySelector('.slider-label.public').style.color = '#00d2ff';
        document.querySelector('.slider-label.private').style.color = '#a8a8a8';

        // Visibility slider handler
        visibilitySlider.addEventListener('input', function() {
            const isPrivate = parseInt(this.value) <= 50;
            passwordGroup.style.display = isPrivate ? 'block' : 'none';
            passwordInput.required = isPrivate;
            
            if (!isPrivate) {
                passwordInput.value = '';
            }

            // Update label colors
            document.querySelector('.slider-label.public').style.color = !isPrivate ? '#00d2ff' : '#a8a8a8';
            document.querySelector('.slider-label.private').style.color = isPrivate ? '#00d2ff' : '#a8a8a8';
        });

        // Form submission handler
        document.querySelector('.capsule-form').addEventListener('submit', async function(e) {
            e.preventDefault();

            const isPrivate = parseInt(visibilitySlider.value) <= 50;
            if (isPrivate && !passwordInput.value.trim()) {
                alert('Please set a password for your private capsule.');
                return;
            }

            // Submit form
            const formData = new FormData(this);
            try {
                const response = await fetch('/create/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                });

                if (response.ok) {
                    // Show success modal
                    const unlockDate = new Date(formData.get('udate')).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    const successModal = document.querySelector('.success-modal');
                    successModal.querySelector('.unlock-date').textContent = unlockDate;
                    
                    successModal.classList.add('show');
                    successModal.style.display = 'flex';
                    
                    // Update public capsules immediately
                    await updatePublicCapsules();
                    
                    // Hide modal after 4 seconds
                    setTimeout(() => {
                        successModal.classList.remove('show');
                        setTimeout(() => {
                            successModal.style.display = 'none';
                            // Reset form
                            e.target.reset();
                            // Reset form states
                            dateInput.value = today;
                            visibilitySlider.value = 100;
                            passwordGroup.style.display = 'none';
                            passwordInput.required = false;
                            document.querySelector('.slider-label.public').style.color = '#00d2ff';
                            document.querySelector('.slider-label.private').style.color = '#a8a8a8';
                            titleInput.setAttribute('data-valid', 'true');
                            titleFeedback.textContent = '';
                            titleFeedback.className = 'title-feedback';
                        }, 300);
                    }, 2000);
                } else {
                    throw new Error('Form submission failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Error creating capsule. Please try again.');
            }
        });
    }

    // Modal functionality
    const modal = document.querySelector('.capsule-modal');
    const modalClose = document.querySelector('.modal-close');

    function openModal(card) {
        const anonymous = card.querySelector('.capsule-anonymous').textContent;
        const unlock = card.querySelector('.capsule-date').textContent;
        const created = card.querySelector('.capsule-created').textContent;
        const message = card.querySelector('.capsule-message').getAttribute('data-full-message');
        const hasMedia = card.querySelector('.capsule-media');

        modal.querySelector('.modal-anonymous').textContent = anonymous;
        modal.querySelector('.modal-unlock').textContent = unlock;
        modal.querySelector('.modal-created').textContent = created;
        modal.querySelector('.modal-message').textContent = message;

        const modalMedia = modal.querySelector('.modal-media');
        modalMedia.innerHTML = '';
        if (hasMedia) {
            modalMedia.innerHTML = hasMedia.innerHTML;
        }

        modal.style.display = 'flex';
        document.body.classList.add('modal-open');
        setTimeout(() => modal.classList.add('active'), 10);
    }

    function closeModal() {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }, 300);
    }

    // Initial attachment of card event listeners
    attachCardEventListeners();

    // Modal event listeners
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal();
        }
    });
});

// Window event listeners
window.addEventListener('resize', updateCanvasSize);
window.addEventListener('scroll', updateCanvasSize);
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
for (let i = 0; i < 2000; i++) { // More stars (1000 → 2000)
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

gsap.from('.title', { opacity: 0, y: -50, duration: 1.5, delay: 0.5 });
gsap.from('.subtitle', { opacity: 0, y: 50, duration: 1.5, delay: 1 });

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
} else if (document.querySelector('.capsule-form')) {
  gsap.from('.capsule-form', { opacity: 0, y: 50, duration: 1.5, delay: 1.5, stagger: 0.2 });
  document.querySelector('.capsule-form').addEventListener('submit', () => {
    gsap.to('.cta-button', { scale: 1.2, duration: 0.3, yoyo: true, repeat: 1 });
  });
}

window.addEventListener('resize', updateCanvasSize);
window.addEventListener('scroll', updateCanvasSize);

// Modal functionality
document.addEventListener('DOMContentLoaded', function() {
  const capsuleCards = document.querySelectorAll('.capsule-card');
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

  capsuleCards.forEach(card => {
    card.addEventListener('click', () => openModal(card));
  });

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
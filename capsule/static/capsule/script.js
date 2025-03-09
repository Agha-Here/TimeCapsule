const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('bg') });

function updateCanvasSize() {
  const height = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  renderer.setSize(window.innerWidth, height);
  camera.aspect = window.innerWidth / height;
  camera.updateProjectionMatrix();
}
updateCanvasSize();
renderer.setPixelRatio(window.devicePixelRatio);

const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({ color: 0xffffff });

const starVertices = [];
for (let i = 0; i < 1000; i++) {
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
# ⏳ TimeCapsule

**A message today. A memory tomorrow. A story forever.**  
TimeCapsule is a full-stack web application that lets users preserve personal messages, images, or videos and schedule them to unlock at a future date — like a digital time machine.

---

## 🚀 Features

- 🔐 **Future Unlocking System** – Users set an unlock date for each capsule; locked capsules remain inaccessible until the time arrives.
- 💌 **Email Notifications** – Automatic email sent upon capsule creation with a direct access link.
- ❤️ **Session-Based Like System** – Users can like capsules (no login required), with a visible heart icon and real-time like count.
- 🔗 **Share Modal** – Includes:
  - URL + Copy Button
  - WhatsApp Share Integration
  - Capsule-Specific QR Code with project logo and download option
- 🗂 **Smart Sorting** – Filter capsules by:
  - Newest First (default)
  - Oldest First
  - Most Liked
  - Recently Unlocked
- 📱 **Responsive UI** – Capsules are displayed on the side (desktop) or bottom (mobile) with smooth animations (GSAP, Three.js).

---

## 🛠️ Tech Stack

| Area            | Technologies Used                                     |
|-----------------|--------------------------------------------------------|
| **Backend**     | Django, Django ORM                                     |
| **Database**    | MySQL (hosted on Clever-Cloud)                         |
| **Frontend**    | HTML, CSS, JavaScript, Three.js, GSAP                  |
| **Media Storage** | Cloudinary                                          |
| **Hosting**     | Render                                                |
| **Email**       | Gmail SMTP                                            |
| **Cron Jobs**   | cron-job.org (for unlocking logic)                     |
| **Tools**       | Git, GitHub, Visual Studio Code                        |

---

## 🎯 Use Cases
Send messages to your future self

Share special memories on a scheduled date

Create emotional time capsules for friends, loved ones, or events

Preserve meaningful media publicly

---

## 🌌 Special Note
This project was submitted to the Stellar Gateway Hackathon, where participants were challenged to build space-inspired creations. While not built exclusively for space, TimeCapsule shares a universal theme: preserving moments across time and distance.


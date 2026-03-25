import { Router } from 'express';

const router = Router();

// In-memory store (persists for server lifetime)
let announcement = {
  text: 'Free Shipping on orders above ₹999 | Use code WELCOME10 for 10% off your first order',
  link: '/shop',
  active: true,
};

// GET /api/announcements — public
router.get('/', (req, res) => {
  res.json(announcement);
});

// PUT /api/announcements — admin only (no auth middleware for simplicity, admin app handles auth)
router.put('/', (req, res) => {
  const { text, link, active } = req.body;
  if (typeof text === 'string') announcement.text = text;
  if (typeof link === 'string' || link === null) announcement.link = link || '';
  if (typeof active === 'boolean') announcement.active = active;
  res.json(announcement);
});

export { router as announcementRoutes };

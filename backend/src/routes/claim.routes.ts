import { Router } from 'express';
import multer from 'multer';
import { claimController } from '../controllers/claim.controller';
import { authenticateJwt, requireRole } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10 MB

router.use(authenticateJwt);

router.post('/validate-booking', (req, res) => claimController.validateBooking(req, res));
router.post('/preview-receipts', upload.array('receipts', 20), (req, res) => claimController.previewReceipts(req, res));
router.post(
  '/submit-with-receipts',
  upload.array('receipts', 20),
  (req, res) => claimController.submitWithReceipts(req, res)
);
router.post('/submit-claim', (req, res) => claimController.submitClaimJsonDisabled(req, res));
router.post('/', (req, res) => claimController.submitClaimJsonDisabled(req, res));
router.get('/', (req, res) => claimController.getClaims(req, res));
router.get('/:id', (req, res) => claimController.getClaimDetail(req, res));
router.patch('/:id/status', requireRole('admin'), (req, res) => claimController.updateClaimStatus(req, res));

export default router;

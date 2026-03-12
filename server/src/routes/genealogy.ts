import { Router } from 'express';
import { logger } from '../utils/logger.js';
import * as genealogyService from '../services/genealogy.js';
import type { GenealogyProvider } from '@family-memories/shared';

const router = Router();

router.get('/services', (_req, res) => {
  try {
    const services = genealogyService.getGenealogyServices();
    res.json({ data: services });
  } catch (err) {
    logger.error({ err }, 'Failed to list genealogy services');
    res.status(500).json({ code: 'LIST_ERROR', message: 'Failed to list services' });
  }
});

router.post('/services/:provider/connect', (req, res) => {
  try {
    const provider = req.params.provider as GenealogyProvider;
    const service = genealogyService.connectService(provider);
    res.json({ data: service });
  } catch (err) {
    logger.error({ err }, 'Failed to connect service');
    res.status(500).json({ code: 'CONNECT_ERROR', message: 'Failed to connect service' });
  }
});

router.post('/services/:provider/disconnect', (req, res) => {
  try {
    const provider = req.params.provider as GenealogyProvider;
    genealogyService.disconnectService(provider);
    res.status(204).end();
  } catch (err) {
    logger.error({ err }, 'Failed to disconnect service');
    res.status(500).json({ code: 'DISCONNECT_ERROR', message: 'Failed to disconnect service' });
  }
});

router.get('/dna/:memberId', (req, res) => {
  try {
    const provider = (req.query.provider as GenealogyProvider) ?? 'ancestry';
    const profile = genealogyService.getDnaProfile(req.params.memberId, provider);
    if (!profile) {
      res.status(404).json({ code: 'NOT_FOUND', message: 'Member not found' });
      return;
    }
    res.json({ data: profile });
  } catch (err) {
    logger.error({ err }, 'Failed to get DNA profile');
    res.status(500).json({ code: 'DNA_ERROR', message: 'Failed to get DNA profile' });
  }
});

router.get('/dna/:memberId/matches', (req, res) => {
  try {
    const matches = genealogyService.getDnaMatches(req.params.memberId);
    res.json({ data: matches });
  } catch (err) {
    logger.error({ err }, 'Failed to get DNA matches');
    res.status(500).json({ code: 'MATCHES_ERROR', message: 'Failed to get DNA matches' });
  }
});

router.get('/export/gedcom', (_req, res) => {
  try {
    const result = genealogyService.generateGedcom();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.send(result.content);
  } catch (err) {
    logger.error({ err }, 'Failed to export GEDCOM');
    res.status(500).json({ code: 'EXPORT_ERROR', message: 'Failed to export GEDCOM' });
  }
});

router.get('/export/gedcom/stats', (_req, res) => {
  try {
    const result = genealogyService.generateGedcom();
    res.json({
      data: {
        filename: result.filename,
        individual_count: result.individual_count,
        family_count: result.family_count,
      },
    });
  } catch (err) {
    logger.error({ err }, 'Failed to get GEDCOM stats');
    res.status(500).json({ code: 'STATS_ERROR', message: 'Failed to get stats' });
  }
});

export default router;

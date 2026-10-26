'use strict';

const crypto = require('crypto');
const express = require('express');
const backendData = require('./data/backend');
const { processVideoFeed } = require('./videos');

const MAX_TEXT_LENGTH = 500;
const MAX_APPOINTMENTS = 1000;
const APPOINTMENT_FIELDS = [
    'title', 'date', 'time', 'platform', 'serviceRef', 'start', 'end', 'status', 'confirmed',
    'firstName', 'lastName', 'contactInfo', 'anonymousId', 'therapistId', 'notes'
];

function createAppointmentStore() {
    const appointments = new Map();
    const resolvedConflicts = new Map();
    return { appointments, resolvedConflicts };
}

function isValidDate(value) {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function sanitizeAppointment(input) {
    const result = {};
    for (const field of APPOINTMENT_FIELDS) {
        if (!(field in input)) continue;
        const value = input[field];
        if (field === 'confirmed') {
            result[field] = Boolean(value);
        } else if (value === null || value === undefined) {
            result[field] = '';
        } else {
            result[field] = String(value).slice(0, MAX_TEXT_LENGTH);
        }
    }
    return result;
}

function validateTimes(appointment) {
    if (!isValidDate(appointment.start) || !isValidDate(appointment.end)) {
        return 'Valid start and end date-times are required.';
    }
    if (new Date(appointment.end) <= new Date(appointment.start)) {
        return 'Appointment end must be after its start.';
    }
    return null;
}

function findOverlaps(store, candidate) {
    const start = new Date(candidate.start);
    const end = new Date(candidate.end);
    return [...store.appointments.values()].filter(existing => {
        if (candidate._id && candidate._id === existing._id) return false;
        return start < new Date(existing.end) && end > new Date(existing.start);
    });
}

function parseRange(query) {
    const { startDate, endDate } = query;
    if (!isValidDate(startDate) || !isValidDate(endDate)) return null;
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);
    if (/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        rangeEnd.setUTCHours(23, 59, 59, 999);
    }
    return { rangeStart, rangeEnd };
}

function inRange(appointment, range) {
    const start = new Date(appointment.start);
    return start >= range.rangeStart && start <= range.rangeEnd;
}

function body(req) {
    return req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : null;
}

function createFunctionsRouter({ store = createAppointmentStore() } = {}) {
    const router = express.Router();
    router.use(express.json({ limit: '32kb' }));

    router.get('/getBooks', (req, res) => {
        res.json({ items: backendData.books });
    });

    router.get('/getNews', (req, res) => {
        res.json({ items: backendData.news });
    });

    router.get('/getInspiration', (req, res) => {
        res.json({ items: backendData.quotes });
    });

    router.get('/getLatestVideosFromFeed', (req, res) => {
        res.json(processVideoFeed(backendData.videoFeed));
    });

    router.get(['/getServices', '/getServiceTypes'], (req, res) => {
        res.json(backendData.services);
    });

    router.get('/getAppointments', (req, res) => {
        res.json([...store.appointments.values()]);
    });

    router.get('/getAppointmentById/:id', (req, res) => {
        const appointment = store.appointments.get(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
        res.json(appointment);
    });

    router.get('/getAppointmentsByDateRange', (req, res) => {
        const range = parseRange(req.query);
        if (!range) {
            return res.status(400).json({ message: 'startDate and endDate are required query parameters.' });
        }
        const { therapistId } = req.query;
        const items = [...store.appointments.values()]
            .filter(appointment => inRange(appointment, range))
            .filter(appointment => !therapistId || appointment.therapistId === therapistId);
        res.json(items);
    });

    router.get('/getConflictsForDateRange', (req, res) => {
        const range = parseRange(req.query);
        if (!range) {
            return res.status(400).json({ message: 'startDate and endDate are required query parameters.' });
        }
        const seen = new Set();
        const conflicts = [];
        const appointments = [...store.appointments.values()].filter(appointment => inRange(appointment, range));
        for (const appointment of appointments) {
            for (const other of findOverlaps(store, appointment)) {
                const id = [appointment._id, other._id].sort().join(':');
                if (seen.has(id) || store.resolvedConflicts.has(id)) continue;
                seen.add(id);
                conflicts.push({
                    id,
                    title: `${appointment.title || 'Untitled'} / ${other.title || 'Untitled'}`,
                    date: appointment.date || appointment.start.slice(0, 10),
                    time: appointment.time || appointment.start.slice(11, 16),
                    reason: 'Overlapping appointment times',
                    appointmentIds: [appointment._id, other._id]
                });
            }
        }
        res.json(conflicts);
    });

    router.post('/proposeAppointment', (req, res) => {
        const input = body(req);
        if (!input) return res.status(400).json({ message: 'A JSON appointment body is required.' });
        const proposed = { ...sanitizeAppointment(input), _id: typeof input._id === 'string' ? input._id : undefined };
        const error = validateTimes(proposed);
        if (error) return res.status(400).json({ message: error });
        const overlaps = findOverlaps(store, proposed);
        if (overlaps.length > 0) {
            return res.status(409).json({
                message: 'Proposed appointment conflicts with existing appointments.',
                proposedAppointment: proposed,
                conflicts: overlaps.map(conflictingAppointment => ({
                    type: 'time_overlap',
                    proposedAppointment: proposed,
                    conflictingAppointment
                }))
            });
        }
        res.json({ message: 'No conflicts detected.' });
    });

    router.post('/createAppointment', (req, res) => {
        const input = body(req);
        if (!input) return res.status(400).json({ message: 'A JSON appointment body is required.' });
        const appointment = sanitizeAppointment(input);
        const error = validateTimes(appointment);
        if (error) return res.status(400).json({ message: error });
        if (!appointment.title) return res.status(400).json({ message: 'Appointment title is required.' });
        if (store.appointments.size >= MAX_APPOINTMENTS) {
            return res.status(507).json({ message: 'Appointment storage limit reached.' });
        }
        const now = new Date().toISOString();
        const created = { status: 'pending', ...appointment, _id: crypto.randomUUID(), _createdDate: now, _updatedDate: now };
        store.appointments.set(created._id, created);
        res.status(201).json(created);
    });

    router.put('/updateAppointment/:id', (req, res) => {
        const input = body(req);
        if (!input) return res.status(400).json({ message: 'A JSON appointment body is required.' });
        const existing = store.appointments.get(req.params.id);
        if (!existing) return res.status(404).json({ message: 'Appointment not found.' });
        const changes = sanitizeAppointment(input.updatedData && typeof input.updatedData === 'object' ? input.updatedData : input);
        const updated = { ...existing, ...changes, _id: existing._id, _updatedDate: new Date().toISOString() };
        const error = validateTimes(updated);
        if (error) return res.status(400).json({ message: error });
        store.appointments.set(updated._id, updated);
        res.json(updated);
    });

    router.put('/updateAppointmentStatus', (req, res) => {
        const input = body(req) || {};
        const { appointmentId, status } = input;
        if (typeof appointmentId !== 'string' || typeof status !== 'string' || !status) {
            return res.status(400).json({ message: 'appointmentId and status are required.' });
        }
        const existing = store.appointments.get(appointmentId);
        if (!existing) return res.status(404).json({ message: 'Appointment not found.' });
        store.appointments.set(appointmentId, { ...existing, status: status.slice(0, 50), _updatedDate: new Date().toISOString() });
        res.json({ success: true, message: 'Appointment status updated.' });
    });

    router.post('/resolveConflict', (req, res) => {
        const input = body(req) || {};
        const { conflictId, resolution } = input;
        if (typeof conflictId !== 'string' || !conflictId || resolution === undefined || resolution === null || resolution === '') {
            return res.status(400).json({ message: 'conflictId and resolution are required.' });
        }
        store.resolvedConflicts.set(conflictId, String(resolution).slice(0, MAX_TEXT_LENGTH));
        res.json({ success: true, message: 'Conflict resolved.' });
    });

    router.delete('/deleteAppointment/:id', (req, res) => {
        if (!store.appointments.delete(req.params.id)) {
            return res.status(404).json({ message: 'Appointment not found.' });
        }
        res.json({ success: true, message: 'Appointment deleted.' });
    });

    router.use((req, res) => {
        res.status(404).json({ message: `Unknown function: ${req.path}` });
    });

    router.use((err, req, res, next) => {
        if (err && err.type === 'entity.parse.failed') {
            return res.status(400).json({ message: 'Malformed JSON body.' });
        }
        if (err && err.type === 'entity.too.large') {
            return res.status(413).json({ message: 'Request body too large.' });
        }
        next(err);
    });

    return router;
}

module.exports = { createFunctionsRouter, createAppointmentStore };

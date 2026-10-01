/**
 * Tau Coding Session & Queue Manager (tau_coding layer)
 * Reference: https://twotimespi.dev/internals/custom-frontend/ and https://twotimespi.dev/guides/sessions/
 * 
 * Provides session lifecycle, prompt queueing ("steer" vs "follow_up"),
 * cancellation, and durable transcript persistence.
 */

import { TauTranscript } from './tauTranscript.js';
import { TauHarness } from './tauHarness.js';
import { createQueueUpdateEvent } from './tauEvents.js';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

export class TauSession {
    constructor({
        sessionId = randomUUID(),
        provider,
        toolRegistry,
        systemPrompt = "",
        model = null,
        storageDir = null
    }) {
        this.sessionId = sessionId;
        this.provider = provider;
        this.toolRegistry = toolRegistry;
        this.systemPrompt = systemPrompt;
        this.transcript = new TauTranscript();
        this.harness = new TauHarness({ provider, toolRegistry, model });
        this.storageDir = storageDir;

        this.isRunning = false;
        this.abortController = null;
        this.queuedPrompts = [];
    }

    /**
     * Executes a prompt and yields provider-neutral events as an async generator.
     * @param {string} promptText - The user prompt
     * @param {Object} options
     * @param {string} options.streamingBehavior - 'direct' | 'steer' | 'follow_up'
     * @param {Object} options.context - Execution context (e.g. user, sellerId)
     */
    async *prompt(promptText, { streamingBehavior = 'direct', context = {} } = {}) {
        if (!promptText || !promptText.trim()) return;

        // Handle concurrency & prompt queueing
        if (this.isRunning) {
            if (streamingBehavior === 'follow_up') {
                this.queuedPrompts.push({ promptText, context });
                yield createQueueUpdateEvent(this.queuedPrompts.map(p => p.promptText));
                return;
            } else if (streamingBehavior === 'steer') {
                // Cancel active turn to immediately take new direction
                this.cancel();
            } else {
                throw new Error("A prompt is already running. Use streamingBehavior='follow_up' to queue.");
            }
        }

        this.isRunning = true;
        this.abortController = new AbortController();

        try {
            // Append user prompt to transcript
            this.transcript.addUserMessage(promptText);

            // Channel for events produced by the harness loop
            const eventQueue = [];
            let resolveNextEvent = null;
            let finished = false;
            let runError = null;

            const emitEvent = (event) => {
                eventQueue.push(event);
                if (resolveNextEvent) {
                    resolveNextEvent();
                    resolveNextEvent = null;
                }
            };

            // Start harness in background
            const harnessPromise = this.harness.run({
                prompt: promptText,
                systemPrompt: this.systemPrompt,
                transcript: this.transcript,
                signal: this.abortController.signal,
                context,
                emitEvent
            }).then(() => {
                finished = true;
                if (resolveNextEvent) resolveNextEvent();
            }).catch((err) => {
                runError = err;
                finished = true;
                if (resolveNextEvent) resolveNextEvent();
            });

            // Stream events as they arrive
            while (!finished || eventQueue.length > 0) {
                if (eventQueue.length === 0) {
                    await new Promise(r => { resolveNextEvent = r; });
                }
                while (eventQueue.length > 0) {
                    yield eventQueue.shift();
                }
            }

            await harnessPromise;
            if (runError) throw runError;

            // Save session to durable storage if configured
            this._persistSession();

            // Process any queued follow-up prompts
            if (this.queuedPrompts.length > 0) {
                const next = this.queuedPrompts.shift();
                yield createQueueUpdateEvent(this.queuedPrompts.map(p => p.promptText));
                yield* this.prompt(next.promptText, {
                    streamingBehavior: 'direct',
                    context: next.context
                });
            }
        } finally {
            this.isRunning = false;
            this.abortController = null;
        }
    }

    /**
     * Cancels the active run gracefully.
     */
    cancel() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    /**
     * Persists transcript to disk if storageDir is provided
     */
    _persistSession() {
        if (!this.storageDir) return;
        try {
            if (!fs.existsSync(this.storageDir)) {
                fs.mkdirSync(this.storageDir, { recursive: true });
            }
            const filePath = path.join(this.storageDir, `${this.sessionId}.json`);
            fs.writeFileSync(filePath, JSON.stringify({
                sessionId: this.sessionId,
                timestamp: Date.now(),
                transcript: this.transcript.toJSON()
            }, null, 2));
        } catch (e) {
            console.warn(`[TauSession] Failed to persist session ${this.sessionId}:`, e.message);
        }
    }

    /**
     * Resumes session from serialized data
     */
    static load(data, { provider, toolRegistry, systemPrompt = "" }) {
        const session = new TauSession({
            sessionId: data.sessionId,
            provider,
            toolRegistry,
            systemPrompt
        });
        if (data.transcript) {
            session.transcript = TauTranscript.fromJSON(data.transcript);
        }
        return session;
    }
}

/**
 * In-memory / persistent SessionManager
 */
export class SessionManager {
    constructor({ provider, toolRegistry, defaultSystemPrompt = "", storageDir = null }) {
        this.provider = provider;
        this.toolRegistry = toolRegistry;
        this.defaultSystemPrompt = defaultSystemPrompt;
        this.storageDir = storageDir;
        this.sessions = new Map();
    }

    getOrCreateSession(sessionId, systemPrompt = this.defaultSystemPrompt) {
        if (!sessionId) sessionId = randomUUID();

        if (this.sessions.has(sessionId)) {
            return this.sessions.get(sessionId);
        }

        const session = new TauSession({
            sessionId,
            provider: this.provider,
            toolRegistry: this.toolRegistry,
            systemPrompt,
            storageDir: this.storageDir
        });

        this.sessions.set(sessionId, session);
        return session;
    }

    removeSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
}

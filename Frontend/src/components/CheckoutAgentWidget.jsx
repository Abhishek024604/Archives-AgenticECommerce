import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { API } from '../api/axios';
import VirtualCursor from './VirtualCursor';

/**
 * Parses assistant message content to cleanly separate conversational text
 * from structured JSON product payloads, avoiding raw syntax rendering.
 */
const parseAssistantMessageContent = (rawContent, messageProducts = [], cache = {}) => {
    if (!rawContent) return { message: '', products: messageProducts || [] };

    let cleaned = rawContent.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    try {
        const parsed = JSON.parse(cleaned);
        if (parsed && (parsed.type === 'product_results' || Array.isArray(parsed.products))) {
            const rawList = parsed.products || [];
            const resolved = rawList.map(item => {
                const id = typeof item === 'string' ? item : (item.id || item._id);
                return cache[id] || (messageProducts || []).find(p => (p._id || p.id) === id) || (typeof item === 'object' ? item : { id, _id: id });
            });
            return {
                message: parsed.message || 'Here are the matching products:',
                products: resolved.length > 0 ? resolved : (messageProducts || [])
            };
        }
    } catch (e) {
        const jsonMatch = rawContent.match(/\{[\s\S]*"type"\s*:\s*"product_results"[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                const textBefore = rawContent.replace(jsonMatch[0], '').trim();
                const rawList = parsed.products || [];
                const resolved = rawList.map(item => {
                    const id = typeof item === 'string' ? item : (item.id || item._id);
                    return cache[id] || (messageProducts || []).find(p => (p._id || p.id) === id) || (typeof item === 'object' ? item : { id, _id: id });
                });
                return {
                    message: parsed.message || textBefore || 'Here are the matching products:',
                    products: resolved.length > 0 ? resolved : (messageProducts || [])
                };
            } catch (err) {}
        }
    }

    return {
        message: rawContent,
        products: messageProducts || []
    };
};

/**
 * Simulates physical cursor navigation and visual click/type events
 * for autonomous visual copilot actions.
 */
const simulateUIAction = async (action, elementSelector, text) => {
    return new Promise((resolve) => {
        let targetElement = null;
        if (elementSelector) {
            targetElement = document.querySelector(elementSelector);
        }

        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            setTimeout(() => {
                const rect = targetElement.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;

                window.dispatchEvent(new CustomEvent('agent-cursor-move', { detail: { x, y } }));
                
                setTimeout(() => {
                    if (action === 'click') {
                        window.dispatchEvent(new CustomEvent('agent-cursor-click'));
                        setTimeout(resolve, 300);
                    } else if (action === 'type') {
                        const safeText = text || '';
                        window.dispatchEvent(new CustomEvent('agent-cursor-type', { detail: { text: safeText } }));
                        setTimeout(resolve, safeText.length * 100 + 400);
                    } else {
                        resolve();
                    }
                }, 800);
            }, 300);
        } else {
            resolve();
        }
    });
};

/**
 * Tool names dictionary with friendly descriptions and icons
 */
const TOOL_METADATA = {
    'search_products': { label: 'Search Catalog', icon: 'search', color: 'text-sky-400' },
    'get_product': { label: 'Inspect Product', icon: 'visibility', color: 'text-indigo-400' },
    'get_cart': { label: 'Check Shopping Bag', icon: 'shopping_bag', color: 'text-amber-400' },
    'ui_add_to_cart': { label: 'Add to Bag', icon: 'add_shopping_cart', color: 'text-emerald-400' },
    'place_order': { label: 'Place Order', icon: 'lock', color: 'text-purple-400' },
    'ui_navigate': { label: 'Navigate Screen', icon: 'near_me', color: 'text-teal-400' },
    'ui_search': { label: 'Type Search Query', icon: 'keyboard', color: 'text-blue-400' },
    'ui_click_product': { label: 'Select Product', icon: 'ads_click', color: 'text-rose-400' },
    'ui_select_size': { label: 'Choose Variant Size', icon: 'straighten', color: 'text-orange-400' },
    'ui_checkout': { label: 'Proceed to Checkout', icon: 'shopping_cart_checkout', color: 'text-yellow-400' }
};

export default function CheckoutAgentWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [activeTool, setActiveTool] = useState(null);
    const [expandedTools, setExpandedTools] = useState({});
    const [expandedThoughts, setExpandedThoughts] = useState({});
    const [currentTurn, setCurrentTurn] = useState(0);
    const [contextCompacted, setContextCompacted] = useState(false);

    const abortControllerRef = useRef(null);
    const messagesEndRef = useRef(null);
    const productCacheRef = useRef({});
    const navigate = useNavigate();
    const location = useLocation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, activeTool, expandedTools, expandedThoughts]);

    const toggleToolExpand = (id) => {
        setExpandedTools(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const toggleThoughtExpand = (id) => {
        setExpandedThoughts(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        setIsLoading(false);
        setActiveTool(null);
    };

    const handleClearHistory = () => {
        handleStop();
        setMessages([]);
        productCacheRef.current = {};
        setContextCompacted(false);
        setCurrentTurn(0);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const promptText = input.trim();
        if (!promptText || isLoading) return;

        const userMessage = { role: 'user', content: promptText, timestamp: Date.now() };
        const updatedMessages = [...messages, userMessage];

        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);
        setActiveTool(null);

        // Append active assistant message with streaming state
        const assistantMsgId = `asst_${Date.now()}`;
        setMessages(prev => [
            ...prev,
            {
                id: assistantMsgId,
                role: 'assistant',
                content: '',
                thinking: '',
                tools: [],
                turns: []
            }
        ]);

        const abortCtrl = new AbortController();
        abortControllerRef.current = abortCtrl;

        try {
            const token = localStorage.getItem('token');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const context = {
                currentPath: location.pathname,
                currentSearch: location.search
            };

            const response = await fetch(`${API.defaults.baseURL}/checkout-agent/chat`, {
                method: 'POST',
                headers,
                credentials: 'include',
                body: JSON.stringify({ messages: updatedMessages, context }),
                signal: abortCtrl.signal
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Failed to fetch from checkout agent: ${response.status} ${errText}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            let assistantContent = '';
            let assistantThinking = '';
            let activeToolsList = [];
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed) continue;

                    if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(trimmed.slice(6));

                            // 1. Text token streaming (Claude Code typewriter effect)
                            if (data.content) {
                                assistantContent += data.content;
                                setMessages(prev => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last && last.role === 'assistant') {
                                        next[next.length - 1] = {
                                            ...last,
                                            content: assistantContent
                                        };
                                    }
                                    return next;
                                });
                            }

                            // 2. Thinking / Reasoning token streaming
                            if (data.thinking) {
                                assistantThinking += data.thinking;
                                setMessages(prev => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last && last.role === 'assistant') {
                                        next[next.length - 1] = {
                                            ...last,
                                            thinking: assistantThinking
                                        };
                                    }
                                    return next;
                                });
                            }

                            // 3. Turn tracking
                            if (data.type === 'turn_start') {
                                setCurrentTurn(data.turnIndex + 1);
                            }

                            // 4. Compaction notification
                            if (data.type === 'compaction' || data.compaction) {
                                setContextCompacted(true);
                            }

                            // 5. Tool execution start (Claude Code Tool Card)
                            if (data.type === 'tool_execution_start' || (data.agentAction && data.actionState === 'running')) {
                                const toolName = data.toolName || data.agentAction;
                                const toolCallId = data.toolCallId || `tc_${Date.now()}`;
                                const args = data.args || {};

                                setActiveTool({
                                    id: toolCallId,
                                    name: toolName,
                                    args,
                                    status: 'running',
                                    startTime: Date.now()
                                });

                                setMessages(prev => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last && last.role === 'assistant') {
                                        const tools = last.tools ? [...last.tools] : [];
                                        const existing = tools.find(t => t.id === toolCallId);
                                        if (!existing) {
                                            tools.push({
                                                id: toolCallId,
                                                name: toolName,
                                                args,
                                                status: 'running',
                                                startTime: Date.now()
                                            });
                                        }
                                        next[next.length - 1] = { ...last, tools };
                                    }
                                    return next;
                                });
                            }

                            // 6. Structured Product Results Event
                            if (data.type === 'product_results' || (data.products && Array.isArray(data.products))) {
                                const incomingProducts = data.products || [];
                                incomingProducts.forEach(p => {
                                    const pid = p._id || p.id;
                                    if (pid) productCacheRef.current[pid] = p;
                                });
                                setMessages(prev => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last && last.role === 'assistant') {
                                        next[next.length - 1] = {
                                            ...last,
                                            products: incomingProducts
                                        };
                                    }
                                    return next;
                                });
                            }

                            // 7. Tool execution end
                            if (data.type === 'tool_execution_end' || data.toolExecuted) {
                                const toolName = data.toolName || data.toolExecuted;
                                const toolCallId = data.toolCallId;
                                const isError = data.status === 'error' || data.isError;
                                const duration = data.durationMs || 150;
                                const result = data.result || '';
                                const args = data.args || {};

                                setActiveTool(null);

                                // Extract products returned by search_products
                                let foundProducts = data.products;
                                if (!foundProducts && data.result && toolName === 'search_products') {
                                    try {
                                        const parsed = JSON.parse(data.result);
                                        if (parsed && Array.isArray(parsed.products)) {
                                            foundProducts = parsed.products;
                                        }
                                    } catch (e) {}
                                }
                                if (foundProducts && Array.isArray(foundProducts)) {
                                    foundProducts.forEach(p => {
                                        const pid = p._id || p.id;
                                        if (pid) productCacheRef.current[pid] = p;
                                    });
                                }

                                setMessages(prev => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last && last.role === 'assistant') {
                                        const tools = last.tools ? [...last.tools] : [];
                                        const idx = toolCallId 
                                            ? tools.findIndex(t => t.id === toolCallId)
                                            : tools.findIndex(t => t.name === toolName && t.status === 'running');

                                        if (idx !== -1) {
                                            tools[idx] = {
                                                ...tools[idx],
                                                status: isError ? 'error' : 'done',
                                                duration,
                                                result,
                                                args: Object.keys(args).length > 0 ? args : tools[idx].args
                                            };
                                        } else {
                                            tools.push({
                                                id: toolCallId || `tc_${Date.now()}`,
                                                name: toolName,
                                                args,
                                                status: isError ? 'error' : 'done',
                                                duration,
                                                result
                                            });
                                        }
                                        next[next.length - 1] = { 
                                            ...last, 
                                            tools,
                                            products: foundProducts || last.products || []
                                        };
                                    }
                                    return next;
                                });

                                // Trigger on-screen visual automation
                                const tool = toolName;
                                if (tool === 'ui_navigate') {
                                    if (args.target) await simulateUIAction('click', `[data-agent-nav="${args.target}"]`);
                                    if (args.target) navigate(args.target);
                                } else if (tool === 'ui_search') {
                                    let searchBox = document.querySelector('[data-agent="search-box"]');
                                    if (!searchBox) await simulateUIAction('click', '[data-agent="search-toggle"]');
                                    await simulateUIAction('type', '[data-agent="search-box"]', args.query);
                                    if (args.category) {
                                        navigate(`/products?category=${args.category}&q=${args.query}`);
                                    } else {
                                        navigate(`/products?q=${args.query}`);
                                    }
                                } else if (tool === 'ui_click_product') {
                                    await simulateUIAction('click', `[data-agent-product="${args.productId}"]`);
                                    if (args.productId) navigate(`/product/${args.productId}`);
                                } else if (tool === 'ui_select_size') {
                                    await simulateUIAction('click', `[data-agent-size="${args.size}"]`);
                                } else if (tool === 'ui_add_to_cart') {
                                    await simulateUIAction('click', '[data-agent="add-to-cart"]');
                                } else if (tool === 'ui_checkout') {
                                    await simulateUIAction('click', '[data-agent-action="proceed-to-checkout"]');
                                    navigate('/checkout');
                                } else if (tool === 'search_products') {
                                    const params = new URLSearchParams();
                                    if (args.category && args.category !== 'all') params.set('category', args.category);
                                    if (args.subCategory) params.set('subCategory', args.subCategory);
                                    if (args.minPrice != null) params.set('minPrice', args.minPrice);
                                    if (args.maxPrice != null) params.set('maxPrice', args.maxPrice);
                                    if (args.q) params.set('q', args.q);
                                    if (args.sortBy) params.set('sortBy', args.sortBy);

                                    const qs = params.toString();
                                    const targetPath = qs ? `/products?${qs}` : '/products';

                                    // Dispatch event to main UI product catalogue
                                    window.dispatchEvent(new CustomEvent('copilot-products-found', {
                                        detail: {
                                            products: foundProducts || [],
                                            filters: args
                                        }
                                    }));

                                    // Navigate main screen to product catalogue
                                    navigate(targetPath, {
                                        state: {
                                            copilotProducts: foundProducts || [],
                                            copilotFilters: args
                                        }
                                    });

                                    // Smoothly scroll down to main catalogue grid
                                    setTimeout(() => {
                                        const grid = document.getElementById('product-catalogue-grid') || document.querySelector('h1');
                                        if (grid) grid.scrollIntoView({ behavior: 'smooth' });
                                    }, 200);
                                } else if (tool === 'get_product' && args.productId) {
                                    navigate(`/product/${args.productId}`);
                                } else if (tool === 'place_order') {
                                    navigate('/orders', { state: { orderPlaced: true } });
                                }
                            }

                            // 7. Final messages sync from server
                            if (data.finalMessages && Array.isArray(data.finalMessages)) {
                                setMessages(prev => {
                                    const next = [...prev];
                                    const last = next[next.length - 1];
                                    if (last && last.role === 'assistant') {
                                        // Keep our rich client-side tool and thinking blocks
                                        last.isCompleted = true;
                                    }
                                    return next;
                                });
                            }

                            if (data.error) {
                                setMessages(prev => [
                                    ...prev,
                                    {
                                        role: 'assistant',
                                        content: `⚠️ Error: ${data.error}`,
                                        isError: true
                                    }
                                ]);
                            }
                        } catch (err) {
                            console.error('Error parsing SSE event:', err);
                        }
                    }
                }
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Checkout Agent chat error:', error);
                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: 'I encountered an error connecting to the store. Please try again.',
                        isError: true
                    }
                ]);
            }
        } finally {
            setIsLoading(false);
            setActiveTool(null);
            abortControllerRef.current = null;
        }
    };

    return (
        <>
            <VirtualCursor />
            {/* Chat Modal Window (Responsive and bounded to stay inside the screen viewport) */}
            {isOpen && (
                <div 
                    role="dialog"
                    aria-label="Archivist Copilot Window"
                    className="fixed bottom-[5.25rem] left-3 sm:left-6 z-[70] w-[calc(100vw-1.5rem)] sm:w-[420px] max-w-[420px] max-h-[calc(100dvh-6.5rem)] h-[min(540px,calc(100dvh-6.5rem))] flex flex-col overflow-hidden rounded-2xl border border-stone-800 bg-stone-950/95 backdrop-blur-xl shadow-2xl text-stone-200 transition-all duration-300 font-sans"
                >
                    {/* 1. Header (Claude Code / Modern Agent Aesthetic) */}
                    <div className="bg-stone-900/90 border-b border-stone-800/80 px-4 py-3 flex items-center justify-between flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-stone-800 border border-stone-700">
                                    <span className="material-symbols-outlined text-[18px] text-amber-400">smart_toy</span>
                                    {isLoading && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                                    )}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-sm tracking-wide text-stone-100">Archivist Copilot</h3>
                                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-stone-300">Tau Harness</span>
                                    </div>
                                    <p className="text-[11px] text-stone-400 font-mono">
                                        {isLoading 
                                            ? (activeTool ? `calling ${activeTool.name}...` : 'streaming response...') 
                                            : 'ready for prompts'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {messages.length > 0 && (
                                    <button 
                                        onClick={handleClearHistory}
                                        title="Clear conversation"
                                        className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                                    </button>
                                )}
                                <button 
                                    onClick={() => setIsOpen(false)}
                                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>

                        {/* 2. Chat Transcript Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-950/60 scrollbar-thin scrollbar-thumb-stone-800">
                            {/* Empty State / Welcome Screen */}
                            {messages.length === 0 && (
                                <div className="flex flex-col items-center justify-center text-center h-full px-4 text-stone-400 space-y-3">
                                    <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center shadow-inner">
                                        <span className="material-symbols-outlined text-2xl text-amber-400/90">auto_awesome</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-stone-200 text-sm">Autonomous Visual Copilot</h4>
                                        <p className="text-xs text-stone-400 mt-1 max-w-[280px]">
                                            Ask me to search luxury items, inspect product sizes, navigate your screen, or complete checkout.
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                                        {['Show trench coats', 'View my bag', 'Women footwear', 'Cashmere sweaters'].map((prompt, i) => (
                                            <button
                                                key={i}
                                                onClick={() => { setInput(prompt); }}
                                                className="text-[11px] font-mono bg-stone-900 border border-stone-800 hover:border-stone-700 hover:text-white px-2.5 py-1 rounded-full text-stone-300 transition-colors"
                                            >
                                                {prompt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Compaction Notice */}
                            {contextCompacted && (
                                <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-amber-300/80 bg-amber-950/30 border border-amber-800/40 rounded-lg py-1 px-3 my-2">
                                    <span className="material-symbols-outlined text-[14px]">compress</span>
                                    <span>Context compacted: earlier turns summarized cleanly</span>
                                </div>
                            )}

                            {/* Message Streams */}
                            {messages.map((msg, index) => {
                                if (msg.role === 'tool') return null;

                                return (
                                    <div key={msg.id || index} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-1.5`}>
                                        {/* USER MESSAGE */}
                                        {msg.role === 'user' && (
                                            <div className="max-w-[85%] bg-stone-800/90 border border-stone-700/80 text-stone-100 rounded-2xl rounded-tr-none px-4 py-2.5 text-sm shadow-md">
                                                {msg.content}
                                            </div>
                                        )}

                                        {/* ASSISTANT MESSAGE */}
                                        {msg.role === 'assistant' && (
                                            <div className="w-full space-y-2">
                                                {/* 1. Collapsible Thinking Block (Claude Code style) */}
                                                {msg.thinking && (
                                                    <div className="border border-stone-800/80 bg-stone-900/60 rounded-xl overflow-hidden text-xs">
                                                        <button 
                                                            onClick={() => toggleThoughtExpand(`thought_${index}`)}
                                                            className="w-full flex items-center justify-between px-3 py-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 transition-colors text-left font-mono text-[11px]"
                                                        >
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="material-symbols-outlined text-[14px] text-purple-400 animate-pulse">psychology</span>
                                                                <span>Thinking Process</span>
                                                            </div>
                                                            <span className="material-symbols-outlined text-[14px]">
                                                                {expandedThoughts[`thought_${index}`] ? 'expand_less' : 'expand_more'}
                                                            </span>
                                                        </button>
                                                        {expandedThoughts[`thought_${index}`] && (
                                                            <div className="p-3 bg-stone-950/50 border-t border-stone-800/60 text-stone-400 text-xs italic font-serif leading-relaxed whitespace-pre-wrap">
                                                                {msg.thinking}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* 2. Tool Execution Cards (Claude Code style) */}
                                                {msg.tools && msg.tools.length > 0 && (
                                                    <div className="space-y-1.5">
                                                        {msg.tools.map((tool) => {
                                                            const meta = TOOL_METADATA[tool.name] || { label: tool.name, icon: 'terminal', color: 'text-stone-400' };
                                                            const isRunning = tool.status === 'running';
                                                            const isError = tool.status === 'error';
                                                            const isExpanded = expandedTools[tool.id];

                                                            return (
                                                                <div 
                                                                    key={tool.id} 
                                                                    className="border border-stone-800 bg-stone-900/80 rounded-xl overflow-hidden text-xs shadow-sm transition-all"
                                                                >
                                                                    <div 
                                                                        onClick={() => toggleToolExpand(tool.id)}
                                                                        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-stone-800/60 transition-colors"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <span className={`material-symbols-outlined text-[16px] ${meta.color}`}>
                                                                                {meta.icon}
                                                                            </span>
                                                                            <span className="font-mono font-medium text-stone-200">
                                                                                {tool.name}
                                                                            </span>
                                                                            {tool.args && Object.keys(tool.args).length > 0 && (
                                                                                <span className="text-[10px] font-mono text-stone-400 truncate max-w-[150px]">
                                                                                    {JSON.stringify(tool.args)}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <div className="flex items-center gap-2">
                                                                            {isRunning ? (
                                                                                <span className="flex items-center gap-1 text-[10px] font-mono text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2 py-0.5 rounded-full">
                                                                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping"></span>
                                                                                    running
                                                                                </span>
                                                                            ) : isError ? (
                                                                                <span className="text-[10px] font-mono text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                                                                                    failed
                                                                                </span>
                                                                            ) : (
                                                                                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                                                                                    <span className="material-symbols-outlined text-[11px]">check</span>
                                                                                    {tool.duration ? `${tool.duration}ms` : 'done'}
                                                                                </span>
                                                                            )}
                                                                            <span className="material-symbols-outlined text-[14px] text-stone-500">
                                                                                {isExpanded ? 'expand_less' : 'expand_more'}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Expanded Tool Input/Output Drawer */}
                                                                    {isExpanded && (
                                                                        <div className="p-3 bg-stone-950/70 border-t border-stone-800 font-mono text-[11px] space-y-2">
                                                                            <div>
                                                                                <div className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">Arguments:</div>
                                                                                <pre className="text-stone-300 bg-stone-900 p-2 rounded border border-stone-800 overflow-x-auto">
                                                                                    {JSON.stringify(tool.args || {}, null, 2)}
                                                                                </pre>
                                                                            </div>
                                                                            {tool.result && (
                                                                                <div>
                                                                                    <div className="text-[10px] uppercase tracking-wider text-stone-400 mb-1">Result:</div>
                                                                                    <pre className="text-emerald-300/90 bg-stone-900 p-2 rounded border border-stone-800 overflow-x-auto max-h-36">
                                                                                        {tool.result}
                                                                                    </pre>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}

                                                {/* 3. Assistant Streaming Content Bubble */}
                                                {(() => {
                                                    const { message, products } = parseAssistantMessageContent(
                                                        msg.content, 
                                                        msg.products, 
                                                        productCacheRef.current
                                                    );
                                                    const hasProducts = products && Array.isArray(products) && products.length > 0;

                                                    return (
                                                        <div className="space-y-2 w-full">
                                                            {message ? (
                                                                <div className="bg-stone-900/90 border border-stone-800 text-stone-100 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-md whitespace-pre-wrap leading-relaxed">
                                                                    {message}
                                                                    {isLoading && index === messages.length - 1 && (
                                                                        <span className="inline-block w-2 h-4 ml-1 bg-amber-400 animate-pulse align-middle"></span>
                                                                    )}

                                                                    {/* Catalogue Navigation Link Badge (Products are rendered on the main UI catalogue) */}
                                                                    {hasProducts && (
                                                                        <div className="pt-2.5 mt-2.5 border-t border-stone-800/80 flex items-center justify-between">
                                                                            <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1.5">
                                                                                <span className="material-symbols-outlined text-[14px] text-amber-400">check_circle</span>
                                                                                <span>{products.length} products on main catalogue</span>
                                                                            </span>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const grid = document.getElementById('product-catalogue-grid') || document.querySelector('h1');
                                                                                    if (grid) grid.scrollIntoView({ behavior: 'smooth' });
                                                                                }}
                                                                                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                                                                            >
                                                                                <span>View catalogue</span>
                                                                                <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (isLoading && index === messages.length - 1 && !hasProducts) ? (
                                                                <div className="bg-stone-900/90 border border-stone-800 text-stone-400 rounded-2xl rounded-tl-none px-4 py-3 text-sm shadow-md flex items-center gap-2">
                                                                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                                                                    <span className="text-xs font-mono">Searching live catalog inventory...</span>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Active Tool Spinner (if tool execution is active but not yet in message) */}
                            {activeTool && (
                                <div className="flex items-center gap-2.5 text-xs text-sky-400 font-mono bg-sky-950/30 border border-sky-800/40 px-3 py-2 rounded-xl animate-pulse">
                                    <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                                    <span>Executing {activeTool.name}...</span>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* 3. Input & Interactive Controls (Claude Code style) */}
                        <div className="p-3 border-t border-stone-800/80 bg-stone-900/90 space-y-2 flex-shrink-0">
                            <form onSubmit={handleSubmit} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isLoading ? "Agent is working... (click Stop to interrupt)" : "Ask Copilot to find items, navigate, or check out..."}
                                    className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-4 py-2.5 text-sm text-stone-100 placeholder-stone-400 focus:outline-none focus:border-amber-400/80 transition-colors"
                                />

                                {isLoading ? (
                                    <button
                                        type="button"
                                        onClick={handleStop}
                                        className="h-10 px-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900 font-mono text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                                        title="Interrupt agent generation"
                                    >
                                        <span className="w-2 h-2 rounded-sm bg-rose-400"></span>
                                        <span>Stop</span>
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={!input.trim()}
                                        className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 font-bold flex items-center justify-center disabled:opacity-40 hover:bg-amber-300 transition-colors shadow-sm"
                                        title="Send message"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
                                    </button>
                                )}
                            </form>

                            {/* Turn Badge / Quick Actions Footer */}
                            <div className="flex items-center justify-between text-[11px] font-mono text-stone-400 pt-0.5 px-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    <span>Stream: Active</span>
                                    {currentTurn > 0 && <span>· Turn {currentTurn}</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button" 
                                        onClick={() => { setInput('View my shopping bag'); }} 
                                        className="hover:text-stone-300 transition-colors"
                                    >
                                        Bag
                                    </button>
                                    <span>·</span>
                                    <button 
                                        type="button" 
                                        onClick={() => { setInput('Proceed to checkout'); }} 
                                        className="hover:text-stone-300 transition-colors"
                                    >
                                        Checkout
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Launcher Button */}
                <div className="fixed bottom-6 left-6 z-[70] flex items-center font-sans">
                    <button
                        type="button"
                        onClick={() => setIsOpen(!isOpen)}
                        className="group flex h-14 items-center gap-0 overflow-hidden rounded-full bg-stone-950 border border-stone-800 px-3.5 text-white shadow-2xl transition-all duration-300 hover:border-amber-400/80 hover:shadow-amber-400/10"
                        aria-label="Toggle checkout assistant"
                    >
                        <div className="relative flex items-center justify-center">
                            <span className="material-symbols-outlined text-2xl text-amber-400 transition-transform duration-300 group-hover:scale-110">
                                {isOpen ? 'close' : 'support_agent'}
                            </span>
                            {!isOpen && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-stone-950"></span>
                            )}
                        </div>
                        <span className="w-0 overflow-hidden whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.18em] text-stone-200 opacity-0 transition-all duration-300 group-hover:ml-3 group-hover:w-[130px] group-hover:opacity-100 text-left">
                            Checkout Agent
                        </span>
                    </button>
                </div>
            </>
        );
}

"""
ARCHIVIST Tau Agent Extension
Reference: https://twotimespi.dev/guides/extensions/

Plugs ARCHIVIST store operations, product search, and management tools
directly into the official Tau CLI and interactive TUI sessions.
"""

import json
import urllib.request
import urllib.error
from tau_agent.messages import TextContent
from tau_agent.tools import AgentTool, AgentToolResult

API_BASE = "http://localhost:5000/api"

def _make_api_request(endpoint):
    url = f"{API_BASE}{endpoint}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Tau-ARCHIVIST-Agent/1.0"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode("utf-8"))
            return True, data
    except urllib.error.URLError as e:
        return False, f"Backend connection error at {url}: {e}"
    except Exception as e:
        return False, str(e)

async def run_search_products(tool_call_id, arguments, signal=None, on_update=None):
    query = arguments.get("query", "")
    category = arguments.get("category", "")
    endpoint = "/products"
    params = []
    if query:
        params.append(f"q={urllib.parse.quote(query)}")
    if category and category != "all":
        params.append(f"category={urllib.parse.quote(category)}")
    if params:
        endpoint += "?" + "&".join(params)

    success, result = _make_api_request(endpoint)
    if not success:
        return AgentToolResult(
            content=[TextContent(text=f"Store API offline: {result}")],
            is_error=True
        )

    products = result if isinstance(result, list) else result.get("products", [])
    summary = []
    for p in products[:10]:
        summary.append(f"- {p.get('productName')} | Brand: {p.get('brandName')} | Price: INR {p.get('price')} | ID: {p.get('_id')}")

    text = "\n".join(summary) if summary else "No matching products found."
    return AgentToolResult(
        content=[TextContent(text=text)],
        is_error=False
    )

async def run_store_status(tool_call_id, arguments, signal=None, on_update=None):
    success, result = _make_api_request("/products?limit=5")
    if not success:
        return AgentToolResult(
            content=[TextContent(text=f"ARCHIVIST Backend is currently offline: {result}")],
            is_error=True
        )
    return AgentToolResult(
        content=[TextContent(text="ARCHIVIST Store Backend is online and operational. Products catalog reachable.")],
        is_error=False
    )

def setup(tau):
    """
    Called once during Tau startup to register tools, slash commands, and prompt guidelines.
    """
    # 1. Register ARCHIVIST tools
    tau.register_tool(
        AgentTool(
            name="archivist_search_products",
            label="Search Store Products",
            description="Search the ARCHIVIST e-commerce catalog for products by keyword or category.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search keyword or brand name"},
                    "category": {
                        "type": "string",
                        "enum": ["women", "men", "footwear", "bags", "perfumes", "accessories", "all"]
                    }
                }
            },
            execute_fn=run_search_products,
            prompt_snippet="Search ARCHIVIST luxury catalog for products and categories."
        )
    )

    tau.register_tool(
        AgentTool(
            name="archivist_store_status",
            label="Check Store Status",
            description="Check health and connectivity of the ARCHIVIST store backend.",
            parameters={"type": "object", "properties": {}},
            execute_fn=run_store_status,
            prompt_snippet="Check whether ARCHIVIST local backend API is running."
        )
    )

    # 2. Add Project Guidelines
    tau.add_prompt_guideline("This project is ARCHIVIST, a luxury e-commerce platform with Lucas AI Assistant.")
    tau.add_prompt_section(
        "ARCHIVIST Architecture",
        "Frontend: React + Vite + Tailwind CSS.\n"
        "Backend: Node.js + Express + MongoDB.\n"
        "Agent Harness: Tau Architecture (tau_ai, tau_agent, tau_coding) powering Lucas and Checkout Copilot.\n"
        "Currency: Indian Rupees (INR)."
    )

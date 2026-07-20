from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urljoin, urlparse

import trafilatura
from bs4 import BeautifulSoup
import requests

MAX_URL_BYTES = 2_000_000
MAX_REDIRECTS = 3


def _validate_public_url(url: str) -> str:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Only public http(s) URLs are supported.")
    if parsed.username or parsed.password:
        raise ValueError("URLs with credentials are not supported.")

    try:
        addresses = socket.getaddrinfo(parsed.hostname, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM)
    except socket.gaierror as exc:
        raise ValueError("Could not resolve URL host.") from exc

    for *_, sockaddr in addresses:
        ip = ipaddress.ip_address(sockaddr[0])
        if not ip.is_global:
            raise ValueError("Private, local, and reserved hosts are not supported.")
    return url


def _fetch_public_url(url: str) -> str:
    current = _validate_public_url(url)
    session = requests.Session()
    for _ in range(MAX_REDIRECTS + 1):
        response = session.get(
            current,
            timeout=10,
            headers={"User-Agent": "Mozilla/5.0"},
            allow_redirects=False,
            stream=True,
        )
        if response.is_redirect or response.is_permanent_redirect:
            location = response.headers.get("Location")
            if not location:
                raise ValueError("Redirect missing target.")
            current = _validate_public_url(urljoin(current, location))
            continue

        response.raise_for_status()
        chunks = []
        size = 0
        for chunk in response.iter_content(64 * 1024):
            size += len(chunk)
            if size > MAX_URL_BYTES:
                raise ValueError("URL response is too large.")
            chunks.append(chunk)
        return b"".join(chunks).decode(response.encoding or "utf-8", errors="replace")
    raise ValueError("Too many redirects.")


def extract_text_from_url(url: str) -> str:
    """
    Fetches the URL and extracts the main content text.
    Uses trafilatura for clean extraction, with BeautifulSoup as a fallback.
    """
    html = _fetch_public_url(url)
    try:
        text = trafilatura.extract(html, include_links=False, include_images=False, include_tables=False)
        if text:
            return text
    except Exception:
        pass

    try:
        soup = BeautifulSoup(html, "html.parser")

        # Remove script and style elements
        for script_or_style in soup(["script", "style", "noscript", "header", "footer", "nav"]):
            script_or_style.extract()

        text = soup.get_text(separator="\n")
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        return "\n".join(chunk for chunk in chunks if chunk)
    except Exception as exc:
        raise ValueError(f"Could not extract text from URL: {exc}")

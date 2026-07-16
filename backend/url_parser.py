from __future__ import annotations

import trafilatura
from bs4 import BeautifulSoup
import requests

def extract_text_from_url(url: str) -> str:
    """
    Fetches the URL and extracts the main content text.
    Uses trafilatura for clean extraction, with BeautifulSoup as a fallback.
    """
    try:
        downloaded = trafilatura.fetch_url(url)
        if downloaded:
            text = trafilatura.extract(downloaded, include_links=False, include_images=False, include_tables=False)
            if text:
                return text
    except Exception:
        pass
    
    # Fallback to requests and BeautifulSoup
    try:
        response = requests.get(url, timeout=10, headers={'User-Agent': 'Mozilla/5.0'})
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove script and style elements
        for script_or_style in soup(["script", "style", "noscript", "header", "footer", "nav"]):
            script_or_style.extract()
            
        text = soup.get_text(separator="\n")
        # Clean up empty lines
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text = "\n".join(chunk for chunk in chunks if chunk)
        
        return text
    except Exception as exc:
        raise ValueError(f"Could not extract text from URL: {exc}")

"""Non-blocking login notification emails via SMTP."""
import asyncio
import logging
import os
import smtplib
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

log = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM", "ApplyIQ <noreply@applyiq.local>")

def _is_configured() -> bool:
    return all([SMTP_HOST, SMTP_USER, SMTP_PASSWORD])

def _build_html(user_name: str, login_time: str) -> str:
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<style>
  body {{ margin:0; padding:0; background:#f8f9ff; font-family:'Plus Jakarta Sans',system-ui,sans-serif; }}
  .wrap {{ max-width:520px; margin:40px auto; background:#fff; border-radius:12px;
           box-shadow:0 4px 20px rgba(30,39,97,.08); overflow:hidden; }}
  .header {{ background:#06104c; padding:32px; text-align:center; color:#fff; }}
  .header h1 {{ margin:0; font-size:28px; letter-spacing:-0.02em; }}
  .header p {{ margin:6px 0 0; opacity:.7; font-size:14px; }}
  .body {{ padding:32px; color:#0b1c30; line-height:1.6; }}
  .body h2 {{ margin:0 0 16px; font-size:20px; }}
  .detail {{ background:#f0f4ff; border-radius:8px; padding:16px; margin:16px 0; }}
  .detail td {{ padding:4px 12px 4px 0; font-size:14px; }}
  .label {{ color:#4e5f7a; font-weight:600; }}
  .footer {{ padding:24px 32px; text-align:center; font-size:12px; color:#767681;
             border-top:1px solid #e5eeff; }}
</style></head><body><div class="wrap">
  <div class="header"><h1>ApplyIQ</h1><p>Career Assistant</p></div>
  <div class="body">
    <h2>Hi {user_name},</h2>
    <p>A new sign-in to your ApplyIQ account was just detected.</p>
    <div class="detail"><table>
      <tr><td class="label">Account</td><td>{user_name}</td></tr>
      <tr><td class="label">Time</td><td>{login_time}</td></tr>
      <tr><td class="label">App</td><td>ApplyIQ — Career Assistant</td></tr>
    </table></div>
    <p>If this was you, no action is needed. If not, secure your account immediately.</p>
  </div>
  <div class="footer">© 2026 ApplyIQ &middot; This is an automated notification</div>
</div></body></html>"""

def _send_sync(to_email: str, user_name: str) -> None:
    now = datetime.now(timezone.utc).strftime("%B %d, %Y at %I:%M %p UTC")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "New sign-in to ApplyIQ"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(f"Hi {user_name}, a new login was detected at {now}.", "plain"))
    msg.attach(MIMEText(_build_html(user_name, now), "html"))
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)

async def send_login_notification(to_email: str, user_name: str) -> None:
    if not _is_configured():
        log.info("SMTP not configured — skipping login email for %s", to_email)
        return
    try:
        await asyncio.to_thread(_send_sync, to_email, user_name)
        log.info("Login notification sent to %s", to_email)
    except Exception:
        log.exception("Failed to send login notification to %s", to_email)

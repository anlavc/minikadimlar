#!/usr/bin/env python3
"""Validate static navigation and the public form without sending any messages."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ERRORS = []

class Page(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path, self.ids, self.links, self.labels, self.inputs = path, set(), [], [], {}
        self.h1 = 0
        self.language = None
        self.meta = {}
        self.forms = []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            if a["id"] in self.ids:
                ERRORS.append(f"{self.path.name}: duplicate id {a['id']}")
            self.ids.add(a["id"])
        if tag == "html": self.language = a.get("lang")
        if tag == "h1": self.h1 += 1
        if tag == "meta": self.meta[a.get("name", a.get("property"))] = a.get("content")
        if tag == "label" and "for" in a: self.labels.append(a["for"])
        if tag in {"input", "select", "textarea"}: self.inputs[a.get("id", a.get("name"))] = a
        if tag == "form": self.forms.append(a)
        if tag in {"a", "link"} and "href" in a: self.links.append(a["href"])
        if tag in {"img", "script"} and "src" in a: self.links.append(a["src"])
        if tag == "img" and "alt" not in a: ERRORS.append(f"{self.path.name}: image needs alt")
        if tag == "a" and a.get("target") == "_blank" and "noopener" not in a.get("rel", ""):
            ERRORS.append(f"{self.path.name}: external tab missing noopener")

pages = {path.resolve(): Page(path) for path in ROOT.rglob("*.html") if ".git" not in path.parts}
for path, page in pages.items():
    if page.language != "tr" or page.h1 != 1: ERRORS.append(f"{path.name}: expected Turkish and one h1")
    if "viewport" not in page.meta: ERRORS.append(f"{path.name}: missing viewport")
    for label in page.labels:
        if label not in page.inputs: ERRORS.append(f"{path.name}: label target {label} missing")
    for link in page.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc: continue
        local = unquote(parsed.path)
        if local.startswith("/minikadimlar/"): target = ROOT / local.removeprefix("/minikadimlar/")
        elif local.startswith("/"): target = ROOT / local.lstrip("/")
        else: target = path.parent / local if local else path
        if target.is_dir(): target = target / "index.html"
        target = target.resolve()
        if not target.is_file(): ERRORS.append(f"{path.name}: broken local link {link}")
        elif parsed.fragment and target in pages and parsed.fragment not in pages[target].ids:
            ERRORS.append(f"{path.name}: missing anchor {link}")

home = pages[(ROOT / "index.html").resolve()]
form = home.forms[0]
if form.get("action") != "https://formspree.io/f/mkjozerq" or form.get("method") != "post":
    ERRORS.append("Wrong contact form endpoint or method")
for field in ("email", "subject", "message", "privacy_acknowledgment"):
    if "required" not in home.inputs[field]: ERRORS.append(f"Required field missing: {field}")
if home.inputs["email"].get("type") != "email": ERRORS.append("Email must use native validation")
if not (ROOT / ".nojekyll").exists(): ERRORS.append("Missing .nojekyll")
ET.parse(ROOT / "sitemap.xml")
if ERRORS:
    raise SystemExit("\n".join(ERRORS))
print(f"PASS: {len(pages)} HTML pages; local links, anchors, metadata, labels, sitemap and Formspree configuration.")

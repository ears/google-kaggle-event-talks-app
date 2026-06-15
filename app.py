import re
import urllib.request
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
ATOM_NS = {'atom': 'http://www.w3.org/2005/Atom'}

def clean_plain_text(html_content):
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', '', html_content)
    # Decode basic HTML entities if any
    text = text.replace('&nbsp;', ' ').replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
    # Clean up multiple whitespaces
    return ' '.join(text.split()).strip()

def parse_release_notes():
    try:
        # Fetch the XML feed
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()

        root = ET.fromstring(xml_data)
        feed_title = root.find('atom:title', ATOM_NS).text
        feed_updated = root.find('atom:updated', ATOM_NS).text

        entries = []
        for entry in root.findall('atom:entry', ATOM_NS):
            title = entry.find('atom:title', ATOM_NS).text  # Usually the date (e.g. "June 15, 2026")
            updated = entry.find('atom:updated', ATOM_NS).text
            
            link_elem = entry.find('atom:link[@rel="alternate"]', ATOM_NS)
            link = link_elem.attrib['href'] if link_elem is not None else ''
            
            content_elem = entry.find('atom:content', ATOM_NS)
            content_html = content_elem.text if content_elem is not None else ''
            
            # Split the HTML content by <h3> headers
            # We match <h3>Type</h3> followed by everything until the next <h3> or end of string
            pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', re.DOTALL)
            matches = pattern.findall(content_html)
            
            items = []
            for match_type, match_body in matches:
                item_type = match_type.strip()
                item_html = match_body.strip()
                item_text = clean_plain_text(item_html)
                
                items.append({
                    'type': item_type,
                    'html': item_html,
                    'text': item_text
                })
            
            # If no <h3> was found but content exists, treat it as a single block
            if not items and content_html.strip():
                items.append({
                    'type': 'General',
                    'html': content_html.strip(),
                    'text': clean_plain_text(content_html)
                })

            entries.append({
                'date': title,
                'updated': updated,
                'link': link,
                'items': items
            })

        return {
            'success': True,
            'feed_title': feed_title,
            'feed_updated': feed_updated,
            'entries': entries
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    data = parse_release_notes()
    if not data['success']:
        return jsonify(data), 500
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, host='127.0.0.1', port=5000)

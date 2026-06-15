# BigQuery Release Notes Hub 🚀

A sleek, premium web application built with Python Flask and vanilla frontend technologies (HTML, CSS, JS) that fetches, parses, and visualizes the Google Cloud BigQuery release notes, allowing developers to filter updates and instantly share them on X (Twitter).

![Aesthetics](https://img.shields.io/badge/Aesthetics-Glassmorphism-purple)
![Tech Stack](https://img.shields.io/badge/Tech--Stack-Flask%20%7C%20Vanilla%20JS%20%7C%20CSS3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## ✨ Features

- **🔄 Live Feed Parser**: Pulls raw XML release notes directly from the official Google Cloud BigQuery feed.
- **📊 Interactive Metrics Summary**: Computes real-time statistics of total updates categorized by Features, Changes, and Breaking/Issues.
- **🔍 Real-Time Search & Filtration**: Instantly search updates using fuzzy search or filter by category badges (Features, Changes, Issues, Announcements, Breaking).
- **🐦 Smart X/Twitter Publisher**: Dynamically drafts tweets containing the update, date, and hashtags, automatically truncating the message to fit X's 280-character limit.
- **🎨 Modern Glassmorphism UI**: Styled with responsive slate backgrounds, light-reflective card borders, custom scrollbars, and colored category glows.
- **📋 Copy to Clipboard**: Copy any release note item's plaintext in one click.

---

## 🛠️ Technology Stack

- **Backend**: Python 3, Flask (Lightweight server proxy to avoid CORS limitations)
- **Frontend**: Vanilla HTML5, Vanilla JS (ES6+), CSS3 custom properties
- **Icons**: FontAwesome 6.4 (via CDN)
- **Fonts**: Google Fonts (Outfit & Plus Jakarta Sans)

---

## 📁 Project Structure

```text
bq-release-notes/
├── app.py                  # Flask web server & XML Parser
├── requirements.txt        # Python dependencies
├── .gitignore              # Git ignore rules
├── templates/
│   └── index.html          # Web page template
├── static/
│   ├── css/
│   │   └── style.css       # Custom design system & animations
│   └── js/
│      └── main.js          # Client-side orchestration, search & sharing
└── README.md               # Project documentation
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have **Python 3.8+** and **pip** installed on your machine.

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ears/google-kaggle-event-talks-app.git
   cd google-kaggle-event-talks-app
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the Flask development server**:
   ```bash
   python app.py
   ```

4. **Open in browser**:
   Navigate to **`http://127.0.0.1:5000`** in your favorite browser.

---

## 🔄 How the Parser Works

Google groups multiple release updates under a single day's Atom feed entry. 

`app.py` reads the HTML content of each entry and splits it into granular update items using a regular expression that detects `<h3>[Type]</h3>` headers:

```python
pattern = re.compile(r'<h3>(.*?)</h3>(.*?)(?=<h3>|$)', re.DOTALL)
```

Each piece is clean-formatted, stripped of HTML tags for plaintext previewing, and delivered to the frontend as structured JSON.

---

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshIcon = document.getElementById('refresh-icon');
    const lastUpdatedTime = document.getElementById('last-updated-time');
    const exportBtn = document.getElementById('export-btn');
    
    const searchInput = document.getElementById('search-input');
    const filterBadges = document.querySelectorAll('.filter-badge');
    
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const emptyState = document.getElementById('empty-state');
    const feedGrid = document.getElementById('feed-grid');
    
    // Stats Elements
    const statFeatures = document.getElementById('stat-features');
    const statChanges = document.getElementById('stat-changes');
    const statBreaking = document.getElementById('stat-breaking');
    const statTotal = document.getElementById('stat-total');
    
    // Modal Elements
    const tweetModal = document.getElementById('tweet-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const confirmTweetBtn = document.getElementById('confirm-tweet-btn');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCount = document.getElementById('char-count');
    
    // Toast Elements
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    // Application State
    let releaseNotesData = [];
    let currentFilter = 'all';
    let currentSearchQuery = '';
    
    // Initialize
    fetchReleaseNotes();
    
    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    exportBtn.addEventListener('click', exportToCSV);
    
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    });
    
    filterBadges.forEach(badge => {
        badge.addEventListener('click', () => {
            filterBadges.forEach(b => b.classList.remove('active'));
            badge.classList.add('active');
            currentFilter = badge.getAttribute('data-filter');
            renderFeed();
        });
    });
    
    // Fetch Data from API
    async function fetchReleaseNotes() {
        showLoading(true);
        refreshIcon.classList.add('spinning');
        
        try {
            const response = await fetch('/api/notes');
            const data = await response.json();
            
            if (response.ok && data.success) {
                releaseNotesData = data.entries;
                updateStats();
                renderFeed();
                exportBtn.disabled = false;
                
                // Set last updated time
                const now = new Date();
                lastUpdatedTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                showLoading(false);
            } else {
                showError(data.error || 'Failed to fetch release notes from BigQuery feed.');
            }
        } catch (error) {
            showError('Network error. Failed to reach the backend server.');
            console.error('Fetch error:', error);
        } finally {
            refreshIcon.classList.remove('spinning');
        }
    }
    
    // Show Loading View
    function showLoading(isLoading) {
        if (isLoading) {
            loadingState.classList.remove('hidden');
            errorState.classList.add('hidden');
            emptyState.classList.add('hidden');
            feedGrid.classList.add('hidden');
            exportBtn.disabled = true;
        } else {
            loadingState.classList.add('hidden');
        }
    }
    
    // Show Error View
    function showError(msg) {
        loadingState.classList.add('hidden');
        feedGrid.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.remove('hidden');
        errorMessage.textContent = msg;
        exportBtn.disabled = true;
    }
    
    // Calculate and Update Stat Cards
    function updateStats() {
        let featuresCount = 0;
        let changesCount = 0;
        let breakingCount = 0;
        let totalCount = 0;
        
        releaseNotesData.forEach(entry => {
            entry.items.forEach(item => {
                totalCount++;
                const type = item.type.toLowerCase();
                if (type === 'feature') featuresCount++;
                else if (type === 'change') changesCount++;
                else if (type === 'breaking' || type === 'issue') breakingCount++;
            });
        });
        
        statFeatures.textContent = featuresCount;
        statChanges.textContent = changesCount;
        statBreaking.textContent = breakingCount;
        statTotal.textContent = totalCount;
    }
    
    // Render Feed Grid
    function renderFeed() {
        feedGrid.innerHTML = '';
        let visibleEntriesCount = 0;
        
        releaseNotesData.forEach(entry => {
            // Filter items within the entry
            const filteredItems = entry.items.filter(item => {
                // Category Filter
                const matchesFilter = (currentFilter === 'all') || 
                                     (currentFilter === 'Breaking' && (item.type === 'Breaking' || item.type === 'Issue')) ||
                                     (item.type === currentFilter);
                
                // Search Keyword Filter
                const matchesSearch = !currentSearchQuery || 
                                     item.text.toLowerCase().includes(currentSearchQuery) ||
                                     item.type.toLowerCase().includes(currentSearchQuery) ||
                                     entry.date.toLowerCase().includes(currentSearchQuery);
                                     
                return matchesFilter && matchesSearch;
            });
            
            if (filteredItems.length > 0) {
                visibleEntriesCount++;
                
                // Create Date Section
                const dateSection = document.createElement('div');
                dateSection.className = 'date-section';
                
                const dateHeader = document.createElement('div');
                dateHeader.className = 'date-header';
                dateHeader.innerHTML = `
                    <h2>${entry.date}</h2>
                    <div class="date-line"></div>
                `;
                dateSection.appendChild(dateHeader);
                
                const cardsContainer = document.createElement('div');
                cardsContainer.className = 'cards-container';
                
                filteredItems.forEach(item => {
                    const card = document.createElement('div');
                    card.className = `note-card ${item.type}`;
                    
                    const badgeClass = item.type.toLowerCase();
                    
                    card.innerHTML = `
                        <div class="card-top">
                            <div class="card-header">
                                <span class="badge ${badgeClass}">${item.type}</span>
                                ${entry.link ? `<a href="${entry.link}" target="_blank" class="card-link" title="Open official release notes"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                            </div>
                            <div class="card-body">
                                ${item.html}
                            </div>
                        </div>
                        <div class="card-footer">
                            <button class="card-btn btn-copy" data-text="${encodeURIComponent(item.text)}">
                                <i class="fa-regular fa-copy"></i> Copy Note
                            </button>
                            <button class="card-btn btn-share-tweet" data-text="${encodeURIComponent(item.text)}" data-date="${encodeURIComponent(entry.date)}" data-type="${encodeURIComponent(item.type)}" data-link="${encodeURIComponent(entry.link)}">
                                <i class="fa-brands fa-x-twitter"></i> Tweet Note
                            </button>
                        </div>
                    `;
                    
                    // Add listeners to individual buttons
                    card.querySelector('.btn-copy').addEventListener('click', (e) => {
                        const text = decodeURIComponent(e.currentTarget.getAttribute('data-text'));
                        copyToClipboard(text);
                    });
                    
                    card.querySelector('.btn-share-tweet').addEventListener('click', (e) => {
                        const text = decodeURIComponent(e.currentTarget.getAttribute('data-text'));
                        const date = decodeURIComponent(e.currentTarget.getAttribute('data-date'));
                        const type = decodeURIComponent(e.currentTarget.getAttribute('data-type'));
                        const link = decodeURIComponent(e.currentTarget.getAttribute('data-link'));
                        
                        openTweetModal(text, date, type, link);
                    });
                    
                    cardsContainer.appendChild(card);
                });
                
                dateSection.appendChild(cardsContainer);
                feedGrid.appendChild(dateSection);
            }
        });
        
        if (visibleEntriesCount === 0) {
            feedGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            feedGrid.classList.remove('hidden');
        }
    }
    
    // Copy Text to Clipboard
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied note text to clipboard!');
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            showToast('Failed to copy to clipboard.');
        });
    }
    
    // Show Toast Notification
    function showToast(message) {
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
    
    // --- Tweet Preview Modal logic ---
    let currentTweetText = '';
    
    function openTweetModal(originalText, date, type, link) {
        // Generate pre-populated Tweet
        // Ensure tweet fits within X limits (280 characters)
        // Clean and truncate the note if it is too long
        let tweetBody = `Google Cloud BigQuery Update (${date}):\n\n`;
        tweetBody += `[${type}] ${originalText}`;
        
        // Trim body text to make sure hashtags and link fit
        const hashtags = `\n\n#BigQuery #GoogleCloud #DataAnalytics`;
        const linkPart = link ? `\n🔗 ${link}` : '';
        
        const reservedLen = tweetBody.length + hashtags.length + linkPart.length;
        if (reservedLen > 280) {
            const allowedTextLen = 280 - (tweetBody.length - originalText.length) - hashtags.length - linkPart.length - 4; // 4 for "..."
            const truncatedText = originalText.substring(0, allowedTextLen) + '...';
            tweetBody = `Google Cloud BigQuery Update (${date}):\n\n[${type}] ${truncatedText}`;
        }
        
        currentTweetText = `${tweetBody}${hashtags}${linkPart}`;
        
        // Set content and display modal
        tweetTextarea.value = currentTweetText;
        updateCharCount();
        tweetModal.classList.remove('hidden');
    }
    
    function updateCharCount() {
        const len = tweetTextarea.value.length;
        charCount.textContent = len;
        
        if (len > 280) {
            charCount.classList.add('limit-exceeded');
            confirmTweetBtn.disabled = true;
            confirmTweetBtn.style.opacity = 0.5;
            confirmTweetBtn.style.cursor = 'not-allowed';
        } else {
            charCount.classList.remove('limit-exceeded');
            confirmTweetBtn.disabled = false;
            confirmTweetBtn.style.opacity = 1;
            confirmTweetBtn.style.cursor = 'pointer';
        }
    }
    
    tweetTextarea.addEventListener('input', updateCharCount);
    
    // Close Modal actions
    function closeModal() {
        tweetModal.classList.add('hidden');
    }
    
    closeModalBtn.addEventListener('click', closeModal);
    cancelTweetBtn.addEventListener('click', closeModal);
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) closeModal();
    });
    
    confirmTweetBtn.addEventListener('click', () => {
        const tweetText = tweetTextarea.value;
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
        window.open(twitterIntentUrl, '_blank');
        closeModal();
        showToast('Opened Twitter / X post composer!');
    });

    // Export current filtered view to CSV file
    function exportToCSV() {
        const headers = ['Date', 'Type', 'Description', 'Link'];
        const rows = [headers];

        releaseNotesData.forEach(entry => {
            entry.items.forEach(item => {
                const matchesFilter = (currentFilter === 'all') || 
                                     (currentFilter === 'Breaking' && (item.type === 'Breaking' || item.type === 'Issue')) ||
                                     (item.type === currentFilter);
                
                const matchesSearch = !currentSearchQuery || 
                                     item.text.toLowerCase().includes(currentSearchQuery) ||
                                     item.type.toLowerCase().includes(currentSearchQuery) ||
                                     entry.date.toLowerCase().includes(currentSearchQuery);

                if (matchesFilter && matchesSearch) {
                    const cleanText = item.text.replace(/"/g, '""');
                    rows.push([
                        `"${entry.date}"`,
                        `"${item.type}"`,
                        `"${cleanText}"`,
                        `"${entry.link}"`
                    ]);
                }
            });
        });

        if (rows.length <= 1) {
            showToast('No records to export.');
            return;
        }

        const csvString = rows.map(e => e.join(",")).join("\n");
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        link.setAttribute("href", url);
        
        const now = new Date().toISOString().split('T')[0];
        link.setAttribute("download", `bigquery_release_notes_${now}.csv`);
        document.body.appendChild(link);
        
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast('Exported CSV successfully!');
    }
});

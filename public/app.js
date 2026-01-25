    // Detect Electron mode and set API URL
    const IS_ELECTRON = !!(window.electron && window.electron.isElectron);
    let API_URL = 'http://localhost:3000';

    let currentRequestId = null;
    let currentRequest = null; // Store full request data
    let isEditMode = false;
    let currentCollectionId = null;

    // Set mode indicator on page load
    document.addEventListener('DOMContentLoaded', () => {
        const modeIndicator = document.getElementById('modeIndicator');
        if (modeIndicator) {
            if (IS_ELECTRON) {
                modeIndicator.textContent = '💻 Desktop';
                modeIndicator.className = 'text-xs px-2 py-1 rounded bg-blue-900 text-blue-300';
            } else {
                modeIndicator.textContent = '🌐 Web';
                modeIndicator.className = 'text-xs px-2 py-1 rounded bg-purple-900 text-purple-300';
            }
        }
    });

    // Toast notification system
    function showToast(message, type = 'info', duration = 4000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');

        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.className = `toast toast-${type} p-4 rounded-lg text-white flex items-start gap-3`;
        toast.innerHTML = `
            <span class="text-2xl flex-shrink-0">${icons[type]}</span>
            <div class="flex-1">
                <p class="text-sm font-medium leading-relaxed">${message}</p>
            </div>
            <button class="text-white hover:text-gray-200 ml-2 flex-shrink-0" onclick="this.parentElement.remove()">✕</button>
        `;

        container.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => {
                toast.remove();
            }, 300); // Match animation duration
        }, duration);

        return toast;
    }

    // Enhanced confirm dialog
    let confirmCallback = null;
    let cancelCallback = null;

    function showConfirm(message, onConfirm, onCancel, title = 'Confirm Action') {
        return new Promise((resolve) => {
            const modal = document.getElementById('confirmModal');
            const titleEl = document.getElementById('confirmTitle');
            const messageEl = document.getElementById('confirmMessage');
            const okBtn = document.getElementById('confirmOk');
            const cancelBtn = document.getElementById('confirmCancel');

            titleEl.textContent = title;
            messageEl.textContent = message;

            // Remove old listeners
            const newOkBtn = okBtn.cloneNode(true);
            const newCancelBtn = cancelBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOkBtn, okBtn);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

            // Add new listeners
            newOkBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                if (onConfirm) onConfirm();
                resolve(true);
            });

            newCancelBtn.addEventListener('click', () => {
                modal.classList.add('hidden');
                if (onCancel) onCancel();
                resolve(false);
            });

            modal.classList.remove('hidden');
        });
    }

    // Enhanced prompt dialog
    function showPrompt(message, defaultValue = '', title = 'Enter Value', placeholder = '') {
        return new Promise((resolve) => {
            const modal = document.getElementById('promptModal');
            const titleEl = document.getElementById('promptTitle');
            const messageEl = document.getElementById('promptMessage');
            const inputEl = document.getElementById('promptInput');
            const okBtn = document.getElementById('promptOk');
            const cancelBtn = document.getElementById('promptCancel');

            titleEl.textContent = title;
            messageEl.textContent = message;
            inputEl.value = defaultValue;
            inputEl.placeholder = placeholder;

            // Remove old listeners
            const newOkBtn = okBtn.cloneNode(true);
            const newCancelBtn = cancelBtn.cloneNode(true);
            okBtn.parentNode.replaceChild(newOkBtn, okBtn);
            cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

            // Add new listeners
            const handleOk = () => {
                const value = inputEl.value.trim();
                modal.classList.add('hidden');
                resolve(value || null);
            };

            const handleCancel = () => {
                modal.classList.add('hidden');
                resolve(null);
            };

            newOkBtn.addEventListener('click', handleOk);
            newCancelBtn.addEventListener('click', handleCancel);

            // Enter key to submit
            inputEl.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    handleOk();
                }
            });

            // Escape key to cancel
            inputEl.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    handleCancel();
                }
            });

            modal.classList.remove('hidden');

            // Focus input and select text
            setTimeout(() => {
                inputEl.focus();
                inputEl.select();
            }, 100);
        });
    }

    // Error handling utilities
    function logError(context, error, details = {}) {
        console.error(`❌ [${context}]`, error, details);
    }

    function logInfo(message, details = {}) {
        console.log(`ℹ️ ${message}`, details);
    }

    function logSuccess(message, details = {}) {
        console.log(`✅ ${message}`, details);
    }

    function handleCriticalError(context, error, userMessage) {
        logError(context, error);
        showToast(userMessage || `Error in ${context}: ${error.message}`, 'error', 5000);
    }

    function handleNonCriticalError(context, error) {
        logError(context, error);
        // Don't show toast for non-critical errors, just log
    }

    function showSuccessToast(message) {
        showToast(message, 'success', 3000);
    }

    function showErrorToast(message) {
        showToast(message, 'error', 5000);
    }

    function showWarningToast(message) {
        showToast(message, 'warning', 4000);
    }

    function showInfoToast(message) {
        showToast(message, 'info', 3000);
    }

    // Safe DOM element getter with fallback
    function safeGetElement(id, fallback = null) {
        try {
            const element = document.getElementById(id);
            if (!element) {
                logError('DOM', `Element with id "${id}" not found`);
                return fallback;
            }
            return element;
        } catch (err) {
            handleNonCriticalError('safeGetElement', err);
            return fallback;
        }
    }

    // Safe JSON formatting
    function formatJSON(value) {
        if (!value) return '';

        try {
            // If it's already an object, stringify it
            if (typeof value === 'object') {
                return JSON.stringify(value, null, 2);
            }

            // If it's a string, try to parse and re-stringify
            if (typeof value === 'string') {
                try {
                    const parsed = JSON.parse(value);
                    return JSON.stringify(parsed, null, 2);
                } catch {
                    // Not valid JSON, return as is
                    return value;
                }
            }

            return String(value);
        } catch (err) {
            logError('formatJSON', err);
            return String(value);
        }
    }

    // Form-Data utilities
    function addFormDataField(containerId, key = '', value = '') {
        const container = document.getElementById(containerId);
        const fieldId = `field-${Date.now()}-${Math.random()}`;

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'flex gap-2 items-center';
        fieldDiv.id = fieldId;

        const keyInput = document.createElement('input');
        keyInput.type = 'text';
        keyInput.placeholder = 'Key';
        keyInput.value = key;
        keyInput.className = 'flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-300 text-sm form-data-key';

        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.placeholder = 'Value';
        valueInput.value = value;
        valueInput.className = 'flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-300 text-sm form-data-value';

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'text-red-500 hover:text-red-400 text-sm px-2';
        deleteBtn.textContent = '✕';
        deleteBtn.onclick = () => document.getElementById(fieldId).remove();

        fieldDiv.appendChild(keyInput);
        fieldDiv.appendChild(valueInput);
        fieldDiv.appendChild(deleteBtn);
        container.appendChild(fieldDiv);
    }

    function getFormDataFromFields(containerId) {
        const container = document.getElementById(containerId);
        const fields = container.querySelectorAll('.flex');
        const formData = {};

        fields.forEach(field => {
            const key = field.querySelector('.form-data-key')?.value.trim();
            const value = field.querySelector('.form-data-value')?.value;
            if (key) {
                formData[key] = value;
            }
        });

        return formData;
    }

    function loadFormDataFields(containerId, data) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';

        if (data && typeof data === 'object') {
            Object.entries(data).forEach(([key, value]) => {
                addFormDataField(containerId, key, value);
            });
        }

        // Add one empty field if no data
        if (!data || Object.keys(data).length === 0) {
            addFormDataField(containerId);
        }
    }

    // 1. Загрузка списка запросов
    async function loadRequests(collectionId = null) {
        const list = document.getElementById('requestsList');
        list.innerHTML = '<div class="text-center text-gray-500 mt-4">Updating...</div>';

        try {
            const url = collectionId ? `${API_URL}/requests?collectionId=${collectionId}` : `${API_URL}/requests`;
            const res = await fetch(url);

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }

            const requests = await res.json();

            // Validate that response is an array
            if (!Array.isArray(requests)) {
                console.error('Expected array of requests but got:', requests);
                list.innerHTML = '<div class="text-red-500 p-2 text-sm">Invalid response format from server</div>';
                return;
            }

            logSuccess('Requests loaded', { count: requests.length });

            list.innerHTML = '';
            requests.forEach(req => {
                const methodColor = getMethodColor(req.method);
                const el = document.createElement('div');
                el.className = 'cursor-pointer p-3 rounded hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-600 group';
                el.onclick = () => selectRequest(req);

                // Top row
                const topRow = document.createElement('div');
                topRow.className = 'flex items-center justify-between';

                const methodSpan = document.createElement('span');
                methodSpan.className = `font-bold text-xs ${methodColor} w-12`;
                methodSpan.textContent = req.method;

                const nameSpan = document.createElement('span');
                nameSpan.className = 'text-sm font-medium truncate flex-1 ml-2 text-gray-300 group-hover:text-white';
                nameSpan.textContent = req.name;

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-red-500 hover:text-red-400 text-xs ml-2';
                deleteBtn.textContent = '🗑️';
                deleteBtn.onclick = (e) => {
                    e.stopPropagation();
                    deleteRequest(req.id);
                };

                topRow.appendChild(methodSpan);
                topRow.appendChild(nameSpan);
                topRow.appendChild(deleteBtn);

                // URL row
                const urlDiv = document.createElement('div');
                urlDiv.className = 'text-xs text-gray-500 truncate mt-1 ml-14';
                urlDiv.textContent = req.url;

                // Collection row
                const collectionDiv = document.createElement('div');
                collectionDiv.className = 'text-xs text-gray-500 mt-1 ml-14';
                collectionDiv.textContent = req.collection ? `Collection: ${req.collection.name}` : 'No Collection';

                el.appendChild(topRow);
                el.appendChild(urlDiv);
                el.appendChild(collectionDiv);
                list.appendChild(el);
            });
        } catch (err) {
            handleCriticalError('loadRequests', err, 'Failed to load requests. Please check your connection.');
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error loading requests.<br>Check console for details.</div>`;
        }
    }

    // 2. Выбор запроса
    function selectRequest(req) {
        currentRequestId = req.id;
        currentRequest = req; // Store full request data

        // Set method and URL
        document.getElementById('methodSelect').value = req.method;
        document.getElementById('urlInput').value = req.url;

        // Use saved bodyType or default to 'json'
        const bodyType = req.bodyType || 'json';
        document.getElementById('requestBodyTypeEdit').value = bodyType;

        // Populate editors with formatted JSON
        queryParamsEditor.setValue(formatJSON(req.queryParams));
        bodyEditor.setValue(formatJSON(req.body));
        headersEditor.setValue(formatJSON(req.headers));
        postRequestScriptEditor.setValue(req.postRequestScript || '');

        // Handle form-data if needed
        if (bodyType === 'form-data') {
            document.getElementById('requestBodyEdit').classList.add('hidden');
            document.getElementById('requestFormDataEdit').classList.remove('hidden');
            loadFormDataFields('requestFormDataFields', req.body || {});
            setTimeout(() => {
                headersEditor.refresh();
                postRequestScriptEditor.refresh();
            }, 10);
        } else {
            document.getElementById('requestBodyEdit').classList.remove('hidden');
            document.getElementById('requestFormDataEdit').classList.add('hidden');
            setTimeout(() => {
                queryParamsEditor.refresh();
                bodyEditor.refresh();
                headersEditor.refresh();
                postRequestScriptEditor.refresh();
            }, 10);
        }

        // Clear response
        document.getElementById('responseArea').textContent = 'Ready to run.';
        document.getElementById('statusBadge').classList.add('hidden');

        // Hide save button initially
        document.getElementById('saveChangesBtn').classList.add('hidden');
    }

    // 3. Запуск запроса (Run)
    async function runCurrentRequest() {
        if (!currentRequestId) return;

        const runBtn = document.getElementById('runBtn');
        const responseArea = document.getElementById('responseArea');
        const statusBadge = document.getElementById('statusBadge');
        const timer = document.getElementById('timer');
        const envId = document.getElementById('environmentSelect').value;

        runBtn.disabled = true;
        // Show spinner
        const spinner = document.createElement('span');
        spinner.className = 'spinner';
        runBtn.textContent = '';
        runBtn.appendChild(spinner);
        runBtn.appendChild(document.createTextNode('Running...'));

        responseArea.innerHTML = '<span class="animate-pulse">Waiting for worker...</span>';
        statusBadge.classList.add('hidden');
        timer.classList.remove('hidden');

        try {
            // Создаем Run with environment
            const url = envId ? `${API_URL}/runs/requests/${currentRequestId}/run?environmentId=${envId}` : `${API_URL}/runs/requests/${currentRequestId}/run`;
            const res = await fetch(url, { method: 'POST' });
            const initialRun = await res.json();

            // Начинаем поллинг (опрос статуса)
            pollStatus(initialRun.id);

        } catch (err) {
            responseArea.textContent = 'Error: ' + err.message;
            runBtn.disabled = false;
            runBtn.textContent = '▶ Run';
        }
    }

    // 4. Поллинг статуса
    async function pollStatus(runId) {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_URL}/runs/${runId}`);
                const run = await res.json();

                if (run.status === 'SUCCESS' || run.status === 'ERROR') {
                    clearInterval(interval);
                    displayResult(run);
                    const runBtn = document.getElementById('runBtn');
                    runBtn.disabled = false;
                    runBtn.textContent = '▶ Run';
                }
            } catch (e) {
                console.error('Polling error', e);
            }
        }, 500); // Опрос каждые 500мс
    }

    function displayResult(run) {
        const area = document.getElementById('responseArea');
        const statusBadge = document.getElementById('statusBadge');
        const statusValue = document.getElementById('statusValue');
        const timerValue = document.getElementById('timerValue');

        statusBadge.classList.remove('hidden');

        if (run.status === 'SUCCESS') {
            statusBadge.className = 'text-xs px-2 py-1 rounded bg-green-900 text-green-200 border border-green-700';
            statusValue.textContent = `${run.responseStatus} OK`;
            area.className = 'flex-1 bg-gray-800 p-4 rounded border border-gray-700 font-mono text-sm text-green-300 overflow-auto whitespace-pre-wrap';

            // Format and limit response display
            let responseText = '';
            const MAX_DISPLAY_SIZE = 50000; // 50KB limit for display

            try {
                if (typeof run.responseBody === 'string') {
                    // If it's a string (HTML, XML, plain text)
                    responseText = run.responseBody;
                } else if (run.responseBody && typeof run.responseBody === 'object') {
                    // If it's JSON object
                    responseText = JSON.stringify(run.responseBody, null, 2);
                } else {
                    responseText = String(run.responseBody);
                }

                // Check size and truncate if needed
                if (responseText.length > MAX_DISPLAY_SIZE) {
                    const truncated = responseText.substring(0, MAX_DISPLAY_SIZE);
                    const sizeKB = (responseText.length / 1024).toFixed(1);
                    area.textContent = `⚠️ Response too large (${sizeKB}KB). Showing first 50KB...\n\n${truncated}\n\n... truncated ...`;
                } else {
                    area.textContent = responseText;
                }
            } catch (err) {
                area.textContent = 'Error displaying response: ' + err.message;
            }
        } else {
            statusBadge.className = 'text-xs px-2 py-1 rounded bg-red-900 text-red-200 border border-red-700';
            statusValue.textContent = 'ERROR';
            area.className = 'flex-1 bg-gray-800 p-4 rounded border border-gray-700 font-mono text-sm text-red-400 overflow-auto whitespace-pre-wrap';
            area.textContent = JSON.stringify({ error: run.error }, null, 2);
        }

        timerValue.textContent = `${run.durationMs}ms`;
    }


    // Хелперы для цветов
    function getMethodColor(m) {
        if(m === 'GET') return 'text-blue-400';
        if(m === 'POST') return 'text-green-400';
        if(m === 'DELETE') return 'text-red-400';
        return 'text-gray-400';
    }
    function getMethodColorBg(m) {
        if(m === 'GET') return 'bg-blue-500';
        if(m === 'POST') return 'bg-green-500';
        if(m === 'DELETE') return 'bg-red-500';
        return 'bg-gray-500';
    }

    // Collections
    function showRequests() {
        currentCollectionId = null; // Reset filter
        document.getElementById('requestsTab').className = 'flex-1 py-2 text-center bg-gray-700 text-white font-bold text-xs';
        document.getElementById('collectionRequestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('collectionsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('runsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('requestsList').classList.remove('hidden');
        document.getElementById('collectionsList').classList.add('hidden');
        document.getElementById('runsList').classList.add('hidden');
        document.getElementById('runsFooter').classList.add('hidden');
        loadRequests(); // Reload to show all
    }

    function showCollectionRequests() {
        if (!currentCollectionId) {
            showWarningToast('Please select a collection first.');
            return;
        }

        document.getElementById('requestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('collectionRequestsTab').className = 'flex-1 py-2 text-center bg-gray-700 text-white font-bold text-xs';
        document.getElementById('collectionsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('runsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('requestsList').classList.remove('hidden');
        document.getElementById('collectionsList').classList.add('hidden');
        document.getElementById('runsList').classList.add('hidden');
        document.getElementById('runsFooter').classList.add('hidden');
        loadRequests(currentCollectionId); // Load filtered requests
    }

    function showCollections() {
        document.getElementById('requestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('collectionRequestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('collectionsTab').className = 'flex-1 py-2 text-center bg-gray-700 text-white font-bold text-xs';
        document.getElementById('runsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('requestsList').classList.add('hidden');
        document.getElementById('collectionsList').classList.remove('hidden');
        document.getElementById('runsList').classList.add('hidden');
        document.getElementById('runsFooter').classList.add('hidden');
        loadCollections();
    }

    function showRuns() {
        document.getElementById('requestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('collectionRequestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('collectionsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('runsTab').className = 'flex-1 py-2 text-center bg-gray-700 text-white font-bold text-xs';
        document.getElementById('requestsList').classList.add('hidden');
        document.getElementById('collectionsList').classList.add('hidden');
        document.getElementById('runsList').classList.remove('hidden');
        document.getElementById('runsFooter').classList.remove('hidden');
        loadRuns();
    }

    async function loadCollections() {
        const list = document.getElementById('collectionsList');
        list.innerHTML = '<div class="text-center text-gray-500 mt-4">Loading...</div>';

        try {
            const res = await fetch(`${API_URL}/collections`);

            if (!res.ok) {
                console.warn(`Failed to load collections: ${res.status} ${res.statusText}`);
                list.innerHTML = '<div class="text-yellow-500 p-2 text-sm">Failed to load collections</div>';
                return;
            }

            const collections = await res.json();

            if (!Array.isArray(collections)) {
                console.error('Expected array of collections but got:', collections);
                list.innerHTML = '<div class="text-red-500 p-2 text-sm">Invalid response format</div>';
                return;
            }

            list.innerHTML = '';
            collections.forEach(col => {
                const el = document.createElement('div');
                el.className = 'p-3 rounded bg-gray-800 border border-gray-700 mb-2';

                // Top row
                const topRow = document.createElement('div');
                topRow.className = 'flex items-center justify-between mb-2';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'font-bold text-sm text-gray-300 cursor-pointer hover:text-white';
                nameSpan.textContent = `📁 ${col.name}`;
                nameSpan.onclick = () => selectCollection(col);

                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'flex space-x-1';

                const viewBtn = document.createElement('button');
                viewBtn.className = 'text-blue-400 hover:text-blue-300 text-xs';
                viewBtn.textContent = '👁️ View';
                viewBtn.onclick = () => viewCollectionDetails(col.id);

                const editBtn = document.createElement('button');
                editBtn.className = 'text-yellow-400 hover:text-yellow-300 text-xs';
                editBtn.textContent = '✏️ Edit';
                editBtn.onclick = () => editCollection(col.id, col.name);

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-red-500 hover:text-red-400 text-xs';
                deleteBtn.textContent = '🗑️ Delete';
                deleteBtn.onclick = () => deleteCollection(col.id);

                buttonsDiv.appendChild(viewBtn);
                buttonsDiv.appendChild(editBtn);
                buttonsDiv.appendChild(deleteBtn);

                topRow.appendChild(nameSpan);
                topRow.appendChild(buttonsDiv);

                // Count row
                const countDiv = document.createElement('div');
                countDiv.className = 'text-xs text-gray-500';
                countDiv.textContent = `${col.requests ? col.requests.length : 0} requests`;

                el.appendChild(topRow);
                el.appendChild(countDiv);
                list.appendChild(el);
            });
            // Add the create button back
            const createBtn = document.createElement('button');
            createBtn.onclick = () => showCreateCollectionModal();
            createBtn.className = 'w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded mt-4';
            createBtn.textContent = '+ New Collection';
            list.appendChild(createBtn);
        } catch (err) {
            handleNonCriticalError('loadCollections', err);
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error loading collections.<br>Check console for details.</div>`;
        }
    }

    function selectCollection(col) {
        currentCollectionId = col.id;
        showCollectionRequests(); // Switch to collection requests tab
    }

    function deleteCollection(id) {
        showConfirm(
            'Are you sure you want to delete this collection? All requests in this collection will remain but will be unassigned.',
            () => {
                fetch(`${API_URL}/collections/${id}`, { method: 'DELETE' })
                    .then(res => {
                        if (res.ok) {
                            loadCollections();
                            loadRequests(); // Refresh the requests list as well
                            logSuccess(`Collection ${id} deleted`);
                        } else {
                            logError('deleteCollection', `HTTP ${res.status}`);
                            showErrorToast('Error deleting collection');
                        }
                    })
                    .catch(err => {
                        handleCriticalError('deleteCollection', err, 'Failed to delete collection');
                    });
            },
            null,
            'Delete Collection'
        );
    }

    async function editCollection(id, currentName) {
        const newName = await showPrompt(
            'Enter new collection name:',
            currentName,
            'Rename Collection',
            'Collection name'
        );

        if (newName && newName !== currentName) {
            fetch(`${API_URL}/collections/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            })
            .then(res => {
                if (res.ok) {
                    loadCollections();
                    logSuccess(`Collection ${id} renamed to "${newName}"`);
                    showSuccessToast('Collection renamed successfully');
                } else {
                    logError('editCollection', `HTTP ${res.status}`);
                    showErrorToast('Error updating collection');
                }
            })
            .catch(err => {
                handleCriticalError('editCollection', err, 'Failed to update collection');
            });
        }
    }

    async function viewCollectionDetails(id) {
        try {
            const res = await fetch(`${API_URL}/collections/${id}`);
            if (!res.ok) {
                showErrorToast('Error loading collection');
                return;
            }

            const collection = await res.json();
            document.getElementById('viewCollectionName').textContent = collection.name;
            document.getElementById('viewCollectionCount').textContent = collection.requests?.length || 0;

            const container = document.getElementById('viewCollectionRequests');
            container.innerHTML = '';

            if (collection.requests && collection.requests.length > 0) {
                collection.requests.forEach(req => {
                    const methodColor = getMethodColor(req.method);
                    const reqDiv = document.createElement('div');
                    reqDiv.className = 'p-3 bg-gray-900 rounded border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors';
                    reqDiv.onclick = () => {
                        toggleModal('viewCollectionModal', false);
                        selectRequest(req);
                        showRequests(); // Switch to requests tab
                    };

                    // Top row
                    const topRow = document.createElement('div');
                    topRow.className = 'flex items-center justify-between mb-1';

                    const methodSpan = document.createElement('span');
                    methodSpan.className = `font-bold text-xs ${methodColor} w-16`;
                    methodSpan.textContent = req.method;

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'text-sm font-medium text-gray-300 flex-1 ml-2 truncate';
                    nameSpan.textContent = req.name;

                    topRow.appendChild(methodSpan);
                    topRow.appendChild(nameSpan);

                    // URL row
                    const urlDiv = document.createElement('div');
                    urlDiv.className = 'text-xs text-gray-500 truncate';
                    urlDiv.textContent = req.url;

                    reqDiv.appendChild(topRow);
                    reqDiv.appendChild(urlDiv);

                    // Query Params
                    if (req.queryParams && Object.keys(req.queryParams).length > 0) {
                        const qpDiv = document.createElement('div');
                        qpDiv.className = 'text-xs text-blue-400 mt-1';
                        qpDiv.textContent = `Query Params: ${Object.keys(req.queryParams).length}`;
                        reqDiv.appendChild(qpDiv);
                    }

                    // Body
                    if (req.body) {
                        const bodyDiv = document.createElement('div');
                        bodyDiv.className = 'text-xs text-green-400 mt-1';
                        bodyDiv.textContent = 'Has Body';
                        reqDiv.appendChild(bodyDiv);
                    }

                    // Headers
                    if (req.headers && Object.keys(req.headers).length > 0) {
                        const headersDiv = document.createElement('div');
                        headersDiv.className = 'text-xs text-yellow-400 mt-1';
                        headersDiv.textContent = `Headers: ${Object.keys(req.headers).length}`;
                        reqDiv.appendChild(headersDiv);
                    }

                    container.appendChild(reqDiv);
                });
            } else {
                const noReqDiv = document.createElement('div');
                noReqDiv.className = 'text-gray-500 text-sm text-center py-4';
                noReqDiv.textContent = 'No requests in this collection';
                container.appendChild(noReqDiv);
            }

            toggleModal('viewCollectionModal', true);
        } catch (err) {
            handleCriticalError('viewCollectionDetails', err, 'Failed to load collection details');
        }
    }

    async function loadRuns() {
        const list = document.getElementById('runsList');
        list.innerHTML = '<div class="text-center text-gray-500 mt-4">Loading...</div>';

        try {
            const res = await fetch(`${API_URL}/runs`);

            if (!res.ok) {
                console.warn(`Failed to load runs: ${res.status} ${res.statusText}`);
                list.innerHTML = '<div class="text-yellow-500 p-2 text-sm">Failed to load runs</div>';
                return;
            }

            const runs = await res.json();

            if (!Array.isArray(runs)) {
                console.error('Expected array of runs but got:', runs);
                list.innerHTML = '<div class="text-red-500 p-2 text-sm">Invalid response format</div>';
                return;
            }

            list.innerHTML = '';
            if (runs.length === 0) {
                list.innerHTML = '<div class="text-center text-gray-500 mt-10">No runs yet</div>';
                return;
            }

            runs.sort((a, b) => b.id - a.id); // Newest first
            runs.forEach(run => {
                const el = document.createElement('div');
                el.className = 'p-3 rounded bg-gray-800 border border-gray-700 mb-2 cursor-pointer hover:border-gray-600 transition-colors';
                el.onclick = () => viewRunDetails(run.id);

                const statusColor = run.status === 'SUCCESS' ? 'text-green-400' : run.status === 'ERROR' ? 'text-red-400' : 'text-yellow-400';
                const date = new Date(run.createdAt);
                const timeAgo = formatTimeAgo(date);

                // Top row
                const topRow = document.createElement('div');
                topRow.className = 'flex items-center justify-between mb-1';

                const statusSpan = document.createElement('span');
                statusSpan.className = `text-xs ${statusColor} font-bold`;
                statusSpan.textContent = run.status;

                const timeSpan = document.createElement('span');
                timeSpan.className = 'text-xs text-gray-500';
                timeSpan.textContent = timeAgo;

                topRow.appendChild(statusSpan);
                topRow.appendChild(timeSpan);

                // Name row
                const nameDiv = document.createElement('div');
                nameDiv.className = 'text-sm text-gray-300 font-medium mb-1';
                nameDiv.textContent = run.request?.name || 'Unknown';

                // Method and URL row
                const methodUrlDiv = document.createElement('div');
                methodUrlDiv.className = 'text-xs text-gray-500';
                methodUrlDiv.textContent = `${run.request?.method || 'GET'} ${run.request?.url || ''}`;

                // Details row
                const detailsDiv = document.createElement('div');
                detailsDiv.className = 'text-xs text-gray-400 mt-1';
                const detailsParts = [];
                if (run.responseStatus) detailsParts.push(`Status: ${run.responseStatus}`);
                if (run.durationMs) detailsParts.push(`${run.durationMs}ms`);
                detailsDiv.textContent = detailsParts.join(' • ');

                el.appendChild(topRow);
                el.appendChild(nameDiv);
                el.appendChild(methodUrlDiv);
                el.appendChild(detailsDiv);
                list.appendChild(el);
            });
        } catch (err) {
            handleNonCriticalError('loadRuns', err);
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error loading runs history.<br>Check console for details.</div>`;
        }
    }

    function formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    async function viewRunDetails(runId) {
        try {
            const res = await fetch(`${API_URL}/runs/${runId}`);
            if (!res.ok) {
                showErrorToast('Error loading run details');
                return;
            }

            const run = await res.json();

            // Set run info
            document.getElementById('runDetailName').textContent = run.request?.name || 'Unknown Request';

            // Set status badge
            const statusBadge = document.getElementById('runDetailStatus');
            if (run.status === 'SUCCESS') {
                statusBadge.className = 'text-xs px-2 py-1 rounded bg-green-900 text-green-200 border border-green-700';
                statusBadge.textContent = 'SUCCESS';
            } else if (run.status === 'ERROR') {
                statusBadge.className = 'text-xs px-2 py-1 rounded bg-red-900 text-red-200 border border-red-700';
                statusBadge.textContent = 'ERROR';
            } else {
                statusBadge.className = 'text-xs px-2 py-1 rounded bg-yellow-900 text-yellow-200 border border-yellow-700';
                statusBadge.textContent = run.status;
            }

            // Set time and duration
            const date = new Date(run.createdAt);
            document.getElementById('runDetailTime').textContent = `Executed ${formatTimeAgo(date)}`;
            document.getElementById('runDetailDuration').textContent = run.durationMs ? `Duration: ${run.durationMs}ms` : '';

            // Set request details
            const methodBadge = document.getElementById('runDetailMethod');
            const method = run.request?.method || 'GET';
            methodBadge.textContent = method;
            methodBadge.className = `px-2 py-1 rounded text-xs font-bold text-gray-900 ${getMethodColorBg(method)}`;

            document.getElementById('runDetailUrl').textContent = run.request?.url || '';

            // Query Params
            if (run.request?.queryParams && Object.keys(run.request.queryParams).length > 0) {
                document.getElementById('runDetailQueryParams').classList.remove('hidden');
                document.getElementById('runDetailQueryParamsContent').textContent = JSON.stringify(run.request.queryParams, null, 2);
            } else {
                document.getElementById('runDetailQueryParams').classList.add('hidden');
            }

            // Body
            if (run.request?.body) {
                document.getElementById('runDetailBody').classList.remove('hidden');
                document.getElementById('runDetailBodyContent').textContent = JSON.stringify(run.request.body, null, 2);
            } else {
                document.getElementById('runDetailBody').classList.add('hidden');
            }

            // Headers
            if (run.request?.headers && Object.keys(run.request.headers).length > 0) {
                document.getElementById('runDetailHeaders').classList.remove('hidden');
                document.getElementById('runDetailHeadersContent').textContent = JSON.stringify(run.request.headers, null, 2);
            } else {
                document.getElementById('runDetailHeaders').classList.add('hidden');
            }

            // Response or Error
            if (run.status === 'SUCCESS') {
                document.getElementById('runDetailResponseSection').classList.remove('hidden');
                document.getElementById('runDetailErrorSection').classList.add('hidden');

                document.getElementById('runDetailResponseStatus').textContent = run.responseStatus || '-';

                // Format response body with size limit
                const responseBodyEl = document.getElementById('runDetailResponseBody');
                const MAX_DISPLAY_SIZE = 50000; // 50KB limit

                if (run.responseBody) {
                    let responseText = '';
                    try {
                        if (typeof run.responseBody === 'string') {
                            responseText = run.responseBody;
                        } else if (typeof run.responseBody === 'object') {
                            responseText = JSON.stringify(run.responseBody, null, 2);
                        } else {
                            responseText = String(run.responseBody);
                        }

                        // Check size and truncate if needed
                        if (responseText.length > MAX_DISPLAY_SIZE) {
                            const truncated = responseText.substring(0, MAX_DISPLAY_SIZE);
                            const sizeKB = (responseText.length / 1024).toFixed(1);
                            responseBodyEl.textContent = `⚠️ Response too large (${sizeKB}KB). Showing first 50KB...\n\n${truncated}\n\n... truncated ...`;
                        } else {
                            responseBodyEl.textContent = responseText;
                        }
                    } catch (err) {
                        responseBodyEl.textContent = 'Error formatting response: ' + err.message;
                    }
                } else {
                    responseBodyEl.textContent = 'No response body';
                }
            } else if (run.status === 'ERROR') {
                document.getElementById('runDetailResponseSection').classList.add('hidden');
                document.getElementById('runDetailErrorSection').classList.remove('hidden');

                document.getElementById('runDetailError').textContent = run.error || 'Unknown error';
            }

            // Environment
            if (run.environment) {
                document.getElementById('runDetailEnvironment').classList.remove('hidden');
                document.getElementById('runDetailEnvironmentName').textContent = run.environment.name || 'Unknown Environment';
            } else {
                document.getElementById('runDetailEnvironment').classList.add('hidden');
            }

            toggleModal('viewRunModal', true);
        } catch (err) {
            handleCriticalError('viewRunDetails', err, 'Failed to load run details');
        }
    }

    function deleteRequest(id) {
        showConfirm(
            'Are you sure you want to delete this request? This action cannot be undone.',
            () => {
                fetch(`${API_URL}/requests/${id}`, { method: 'DELETE' })
                    .then(res => {
                        if (res.ok) {
                            loadRequests();
                            if (currentRequestId === id) {
                                // Clear selection if the deleted request was selected
                                currentRequestId = null;
                                currentRequest = null;
                                document.getElementById('urlInput').value = '';
                                document.getElementById('methodSelect').value = 'GET';
                                queryParamsEditor.setValue('');
                                bodyEditor.setValue('');
                                headersEditor.setValue('');
                                document.getElementById('responseArea').textContent = 'Select a request and click Run.';
                                document.getElementById('statusBadge').classList.add('hidden');
                                document.getElementById('saveChangesBtn').classList.add('hidden');
                            }
                            console.log(`✅ Request ${id} deleted successfully`);
                            showSuccessToast('Request deleted successfully');
                        } else {
                            console.error(`❌ Error deleting request ${id}: HTTP ${res.status}`);
                            showErrorToast('Error deleting request');
                        }
                    })
                    .catch(err => {
                        console.error(`❌ Error deleting request ${id}:`, err);
                        showErrorToast('Error: ' + err.message);
                    });
            },
            null,
            'Delete Request'
        );
    }

    async function showCreateCollectionModal() {
        const name = await showPrompt(
            'Enter collection name:',
            '',
            'Create Collection',
            'My Collection'
        );

        if (name) {
            createCollection(name);
        }
    }

    async function createCollection(name) {
        try {
            const res = await fetch(`${API_URL}/collections`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            if (res.ok) {
                loadCollections();
                logSuccess(`Collection "${name}" created`);
            } else {
                logError('createCollection', `HTTP ${res.status}`);
                showErrorToast('Error creating collection');
            }
        } catch (err) {
            handleCriticalError('createCollection', err, 'Failed to create collection');
        }
    }

    // Environments
    async function loadEnvironments() {
        const list = document.getElementById('environmentsList');
        list.innerHTML = '<div class="text-center text-gray-500 mt-4">Loading...</div>';

        try {
            const res = await fetch(`${API_URL}/environments`);

            if (!res.ok) {
                console.warn(`Failed to load environments: ${res.status} ${res.statusText}`);
                list.innerHTML = '<div class="text-yellow-500 p-2 text-sm">Failed to load environments</div>';
                return;
            }

            const environments = await res.json();

            if (!Array.isArray(environments)) {
                console.error('Expected array of environments but got:', environments);
                list.innerHTML = '<div class="text-red-500 p-2 text-sm">Invalid response format</div>';
                return;
            }

            list.innerHTML = '';
            environments.forEach(env => {
                const el = document.createElement('div');
                el.className = 'p-3 rounded bg-gray-800 border border-gray-700';

                // Top row
                const topRow = document.createElement('div');
                topRow.className = 'flex justify-between items-center mb-2';

                const nameSpan = document.createElement('span');
                nameSpan.className = 'font-bold text-gray-300';
                nameSpan.textContent = env.name;

                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'space-x-2';

                const viewBtn = document.createElement('button');
                viewBtn.className = 'text-blue-400 hover:text-blue-300 text-xs';
                viewBtn.textContent = '👁️ View';
                viewBtn.onclick = () => viewEnvironment(env.id, env.name, JSON.stringify(env.variables));

                const manageBtn = document.createElement('button');
                manageBtn.className = 'text-purple-400 hover:text-purple-300 text-xs';
                manageBtn.textContent = '⚙️ Variables';
                manageBtn.onclick = () => manageEnvironmentVariables(env.id, env.name, JSON.stringify(env.variables));

                const editBtn = document.createElement('button');
                editBtn.className = 'text-yellow-400 hover:text-yellow-300 text-xs';
                editBtn.textContent = '✏️ Edit';
                editBtn.onclick = () => editEnvironment(env.id, env.name, JSON.stringify(env.variables));

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-red-500 hover:text-red-400 text-xs';
                deleteBtn.textContent = '🗑️ Delete';
                deleteBtn.onclick = () => deleteEnvironment(env.id);

                buttonsDiv.appendChild(viewBtn);
                buttonsDiv.appendChild(manageBtn);
                buttonsDiv.appendChild(editBtn);
                buttonsDiv.appendChild(deleteBtn);

                topRow.appendChild(nameSpan);
                topRow.appendChild(buttonsDiv);

                // Count row
                const countDiv = document.createElement('div');
                countDiv.className = 'text-xs text-gray-500';
                countDiv.textContent = `${Object.keys(env.variables || {}).length} variables`;

                el.appendChild(topRow);
                el.appendChild(countDiv);
                list.appendChild(el);
            });
        } catch (err) {
            handleNonCriticalError('loadEnvironments', err);
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error loading environments.<br>Check console for details.</div>`;
        }
    }

    function viewEnvironment(id, name, variablesStr) {
        const variables = JSON.parse(variablesStr);
        document.getElementById('viewEnvironmentName').value = name;

        const container = document.getElementById('viewEnvironmentVariables');
        container.innerHTML = '';

        if (variables && Object.keys(variables).length > 0) {
            Object.entries(variables).forEach(([key, value]) => {
                const varDiv = document.createElement('div');
                varDiv.className = 'flex gap-2 p-2 bg-gray-900 rounded border border-gray-700';

                const keySpan = document.createElement('span');
                keySpan.className = 'text-sm text-purple-400 font-medium w-1/3';
                keySpan.textContent = key;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'text-sm text-gray-300 flex-1 break-all';
                valueSpan.textContent = value;

                varDiv.appendChild(keySpan);
                varDiv.appendChild(valueSpan);
                container.appendChild(varDiv);
            });
        } else {
            const noVarsDiv = document.createElement('div');
            noVarsDiv.className = 'text-gray-500 text-sm';
            noVarsDiv.textContent = 'No variables';
            container.appendChild(noVarsDiv);
        }

        toggleModal('viewEnvironmentModal', true);
    }

    function hideViewEnvironmentModal() {
        toggleModal('viewEnvironmentModal', false);
    }

    function showManageEnvironmentsModal() {
        toggleModal('manageEnvironmentsModal', true);
        loadEnvironments();
    }

    function hideManageEnvironmentsModal() {
        toggleModal('manageEnvironmentsModal', false);
    }

    function showCreateEnvironmentModal() {
        toggleModal('createEnvironmentModal', true);
        document.getElementById('environmentModalTitle').textContent = 'Create Environment';
        document.getElementById('createEnvironmentForm').reset();
        document.getElementById('createEnvironmentForm').onsubmit = createEnvironment;

        // Initialize with one empty variable field
        loadFormDataFields('environmentVariablesFields', {});
    }

    function hideCreateEnvironmentModal() {
        toggleModal('createEnvironmentModal', false);
        document.getElementById('environmentVariablesFields').innerHTML = '';
    }

    function editEnvironment(id, name, variablesStr) {
        const variables = JSON.parse(variablesStr);
        document.getElementById('environmentName').value = name;

        // Load variables into key-value fields
        loadFormDataFields('environmentVariablesFields', variables);

        document.getElementById('environmentModalTitle').textContent = 'Edit Environment';
        document.getElementById('createEnvironmentForm').onsubmit = (e) => {
            e.preventDefault();
            updateEnvironment(id);
        };
        toggleModal('createEnvironmentModal', true);
    }

    async function updateEnvironment(id) {
        const name = document.getElementById('environmentName').value;
        const variables = getFormDataFromFields('environmentVariablesFields');

        try {
            const res = await fetch(`${API_URL}/environments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, variables })
            });
            if (res.ok) {
                loadEnvironments();
                hideCreateEnvironmentModal();
                loadEnvironmentsForSelect();
            } else {
                showErrorToast('Error updating environment');
            }
        } catch (err) {
            handleCriticalError('updateEnvironment', err, 'Failed to update environment');
        }
    }

    // Manage individual environment variables
    let currentManageEnvId = null;

    function manageEnvironmentVariables(id, name, variablesStr) {
        currentManageEnvId = id;
        const variables = JSON.parse(variablesStr);

        document.getElementById('manageVarEnvName').textContent = name;
        displayManageVariables(variables);
        toggleModal('manageVariablesModal', true);
    }

    function displayManageVariables(variables) {
        const container = document.getElementById('manageVariablesList');
        container.innerHTML = '';

        if (variables && Object.keys(variables).length > 0) {
            Object.entries(variables).forEach(([key, value]) => {
                const varDiv = document.createElement('div');
                varDiv.className = 'flex gap-2 p-2 bg-gray-900 rounded border border-gray-700 items-center';

                const keySpan = document.createElement('span');
                keySpan.className = 'text-sm text-purple-400 font-medium w-1/3 break-all';
                keySpan.textContent = key;

                const valueSpan = document.createElement('span');
                valueSpan.className = 'text-sm text-gray-300 flex-1 break-all';
                valueSpan.textContent = value;

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'text-red-500 hover:text-red-400 text-sm px-2';
                deleteBtn.textContent = '✕';
                deleteBtn.onclick = () => deleteVariable(key, key);

                varDiv.appendChild(keySpan);
                varDiv.appendChild(valueSpan);
                varDiv.appendChild(deleteBtn);
                container.appendChild(varDiv);
            });
        } else {
            const noVarsDiv = document.createElement('div');
            noVarsDiv.className = 'text-gray-500 text-sm';
            noVarsDiv.textContent = 'No variables yet. Add one below.';
            container.appendChild(noVarsDiv);
        }
    }

    async function addVariable() {
        const key = document.getElementById('newVarKey').value.trim();
        const value = document.getElementById('newVarValue').value;

        if (!key) {
            showWarningToast('Please enter a variable name');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/environments/${currentManageEnvId}/variables`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value })
            });

            if (res.ok) {
                const updatedEnv = await res.json();
                displayManageVariables(updatedEnv.variables);
                document.getElementById('newVarKey').value = '';
                document.getElementById('newVarValue').value = '';
                loadEnvironments();
                loadEnvironmentsForSelect();
            } else {
                showErrorToast('Error adding variable');
            }
        } catch (err) {
            handleCriticalError('addVariable', err, 'Failed to add variable');
        }
    }

    async function deleteVariable(escapedKey, actualKey) {
        showConfirm(
            `Delete variable "${actualKey}"? This action cannot be undone.`,
            async () => {
                try {
                    const res = await fetch(`${API_URL}/environments/${currentManageEnvId}/variables/${encodeURIComponent(actualKey)}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        const updatedEnv = await res.json();
                        displayManageVariables(updatedEnv.variables);
                        loadEnvironments();
                        loadEnvironmentsForSelect();
                        showSuccessToast('Variable deleted successfully');
                    } else {
                        showErrorToast('Error deleting variable');
                    }
                } catch (err) {
                    handleCriticalError('deleteVariable', err, 'Failed to delete variable');
                }
            },
            null,
            'Delete Variable'
        );
    }

    function deleteEnvironment(id) {
        showConfirm(
            'Are you sure you want to delete this environment? All variables will be lost.',
            () => {
                fetch(`${API_URL}/environments/${id}`, { method: 'DELETE' })
                    .then(res => {
                        if (res.ok) {
                            loadEnvironments();
                            loadEnvironmentsForSelect();
                            logSuccess(`Environment ${id} deleted`);
                            showSuccessToast('Environment deleted successfully');
                        } else {
                            logError('deleteEnvironment', `HTTP ${res.status}`);
                            showErrorToast('Error deleting environment');
                        }
                    })
                    .catch(err => {
                        handleCriticalError('deleteEnvironment', err, 'Failed to delete environment');
                    });
            },
            null,
            'Delete Environment'
        );
    }

    async function createEnvironment(e) {
        e.preventDefault();

        const name = document.getElementById('environmentName').value;
        const variables = getFormDataFromFields('environmentVariablesFields');

        try {
            const res = await fetch(`${API_URL}/environments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, variables })
            });
            if (res.ok) {
                loadEnvironments();
                hideCreateEnvironmentModal();
                loadEnvironmentsForSelect();
            } else {
                showErrorToast('Error creating environment');
            }
        } catch (err) {
            handleCriticalError('createEnvironment', err, 'Failed to create environment');
        }
    }

    // Update the loadEnvironments function to also update the select
    async function loadEnvironmentsForSelect() {
        try {
            const res = await fetch(`${API_URL}/environments`);

            // Check if response is OK
            if (!res.ok) {
                console.warn(`Failed to load environments: ${res.status} ${res.statusText}`);
                const select = document.getElementById('environmentSelect');
                select.innerHTML = '<option value="">No Environment (error loading)</option>';
                return;
            }

            const environments = await res.json();

            // Validate that response is an array
            if (!Array.isArray(environments)) {
                console.error('Expected array of environments but got:', environments);
                const select = document.getElementById('environmentSelect');
                select.innerHTML = '<option value="">No Environment (invalid data)</option>';
                return;
            }

            const select = document.getElementById('environmentSelect');
            select.innerHTML = '<option value="">No Environment</option>';
            environments.forEach(env => {
                const option = document.createElement('option');
                option.value = env.id;
                option.textContent = env.name;
                select.appendChild(option);
            });
        } catch (err) {
            console.error('Error loading environments for select:', err);
            const select = document.getElementById('environmentSelect');
            if (select) {
                select.innerHTML = '<option value="">No Environment (connection error)</option>';
            }
        }
    }

    // Import/Export Environment functions
    function showImportEnvironmentModal() {
        toggleModal('importEnvironmentModal', true);
        document.getElementById('importEnvironmentJson').value = '';
    }

    function hideImportEnvironmentModal() {
        toggleModal('importEnvironmentModal', false);
    }

    function showExportEnvironmentModal() {
        loadEnvironmentsForExport();
        toggleModal('exportEnvironmentModal', true);
    }

    function hideExportEnvironmentModal() {
        toggleModal('exportEnvironmentModal', false);
    }

    async function loadEnvironmentsForExport() {
        const select = document.getElementById('exportEnvironmentSelect');
        select.innerHTML = '<option value="">Select an environment...</option>';

        try {
            const res = await fetch(`${API_URL}/environments`);
            const environments = await res.json();

            environments.forEach(env => {
                const option = document.createElement('option');
                option.value = env.id;
                option.textContent = env.name;
                select.appendChild(option);
            });
        } catch (err) {
            console.error('Error loading environments:', err);
        }
    }

    // Import environment form handler
    document.getElementById('importEnvironmentForm').onsubmit = async (e) => {
        e.preventDefault();

        const jsonText = document.getElementById('importEnvironmentJson').value.trim();

        if (!jsonText) {
            showWarningToast('Please paste environment JSON');
            return;
        }

        let postmanEnv;
        try {
            postmanEnv = JSON.parse(jsonText);
        } catch (e) {
            showErrorToast('Invalid JSON format');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/environments/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postmanEnv)
            });

            if (res.ok) {
                const importedEnv = await res.json();
                loadEnvironments();
                loadEnvironmentsForSelect();
                hideImportEnvironmentModal();
                showSuccessToast(`Environment "${importedEnv.name}" imported successfully!`);
            } else {
                showErrorToast('Error importing environment');
            }
        } catch (err) {
            handleCriticalError('importEnvironment', err, 'Failed to import environment');
        }
    };

    // Export environment form handler
    document.getElementById('exportEnvironmentForm').onsubmit = async (e) => {
        e.preventDefault();

        const envId = document.getElementById('exportEnvironmentSelect').value;

        if (!envId) {
            showWarningToast('Please select an environment');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/environments/${envId}/export`);
            if (res.ok) {
                const postmanEnv = await res.json();

                // Create and download JSON file
                const blob = new Blob([JSON.stringify(postmanEnv, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `${postmanEnv.name.replace(/\s+/g, '_')}_environment.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);

                hideExportEnvironmentModal();
                showSuccessToast('Environment exported successfully!');
            } else {
                showErrorToast('Error exporting environment');
            }
        } catch (err) {
            handleCriticalError('exportEnvironment', err, 'Failed to export environment');
        }
    };

    // Cleanup History functions
    function showCleanupHistoryModal() {
        toggleModal('cleanupHistoryModal', true);
        document.getElementById('cleanupHoursInput').value = '';
    }

    function hideCleanupHistoryModal() {
        toggleModal('cleanupHistoryModal', false);
    }

    // Cleanup history form handler
    document.getElementById('cleanupHistoryForm').onsubmit = async (e) => {
        e.preventDefault();

        const customHours = document.getElementById('cleanupHoursInput').value;

        if (!customHours) {
            showWarningToast('Please select or enter hours to keep');
            return;
        }

        const hours = parseFloat(customHours);

        if (isNaN(hours) || hours < 0) {
            showWarningToast('Please enter a valid number of hours');
            return;
        }

        showConfirm(
            `Delete all history older than ${hours} hour(s)?\n\nThis action cannot be undone!`,
            async () => {
                try {
                    const res = await fetch(`${API_URL}/runs/cleanup?hours=${hours}`, {
                        method: 'DELETE'
                    });

                    if (res.ok) {
                        const result = await res.json();
                        hideCleanupHistoryModal();
                        loadRuns();
                        showSuccessToast(`Cleanup complete! Deleted: ${result.deleted} run(s), Kept: Last ${result.hoursKept} hour(s)`);
                    } else {
                        showErrorToast('Error cleaning history');
                    }
                } catch (err) {
                    handleCriticalError('cleanupHistory', err, 'Failed to clean history');
                }
            },
            null,
            'Clean History'
        );
    };

    // Quick hours buttons
    document.querySelectorAll('.cleanup-hours-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const hours = btn.getAttribute('data-hours');
            document.getElementById('cleanupHoursInput').value = hours;

            // Visual feedback
            document.querySelectorAll('.cleanup-hours-btn').forEach(b => {
                b.classList.remove('bg-blue-600', 'border-2', 'border-blue-400');
                b.classList.add('bg-gray-700');
            });
            btn.classList.remove('bg-gray-700');
            btn.classList.add('bg-blue-600', 'border-2', 'border-blue-400');
        });
    });

    // Backup/Restore functions
    async function exportBackup() {
        try {
            const res = await fetch(`${API_URL}/backup/export`);
            if (!res.ok) {
                showErrorToast('Error exporting backup');
                return;
            }

            const data = await res.json();

            if (IS_ELECTRON && window.electron?.exportBackup) {
                // Use Electron native file dialog
                const result = await window.electron.exportBackup(data);
                if (result.success) {
                    showSuccessToast(`Backup exported to ${result.path}!`);
                } else {
                    showWarningToast('Export cancelled');
                }
            } else {
                // Fallback for browser
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `spinner-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                showSuccessToast('Backup exported successfully!');
            }
        } catch (err) {
            handleCriticalError('exportBackup', err, 'Failed to export backup');
        }
    }

    async function showBackupImportModal() {
        if (IS_ELECTRON && window.electron?.importBackup) {
            // Use Electron native file dialog
            try {
                const result = await window.electron.importBackup();
                if (result.success) {
                    await importBackupData(result.data);
                } else {
                    showWarningToast('Import cancelled');
                }
            } catch (err) {
                handleCriticalError('showBackupImportModal', err, 'Failed to import backup');
            }
        } else {
            // Show modal for browser
            toggleModal('backupImportModal', true);
            document.getElementById('backupFileInput').value = '';
            document.getElementById('backupJsonInput').value = '';
            document.getElementById('backupImportResult').classList.add('hidden');
        }
    }

    function hideBackupImportModal() {
        toggleModal('backupImportModal', false);
    }

    // Backup import form handler
    document.getElementById('backupImportForm').onsubmit = async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('backupFileInput');
        const jsonInput = document.getElementById('backupJsonInput');
        let backupData;

        if (fileInput.files.length > 0) {
            // Read from file
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = async (event) => {
                try {
                    const content = event.target.result;
                    backupData = JSON.parse(content);
                    await importBackupData(backupData);
                } catch (err) {
                    showErrorToast('Error parsing backup file: ' + err.message);
                }
            };

            reader.readAsText(file);
        } else if (jsonInput.value.trim() !== '') {
            // Read from textarea
            try {
                backupData = JSON.parse(jsonInput.value);
                await importBackupData(backupData);
            } catch (err) {
                showErrorToast('Error parsing JSON: ' + err.message);
            }
        } else {
            showWarningToast('Please upload a file or paste JSON');
        }
    };

    async function importBackupData(data) {
        try {
            const res = await fetch(`${API_URL}/backup/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                const result = await res.json();

                // Show results
                document.getElementById('backupImportResult').classList.remove('hidden');
                document.getElementById('importedCollections').textContent = result.imported.collections;
                document.getElementById('importedRequests').textContent = result.imported.requests;
                document.getElementById('importedEnvironments').textContent = result.imported.environments;
                document.getElementById('importedRuns').textContent = result.imported.runs;

                // Show errors if any
                if (result.errors && result.errors.length > 0) {
                    document.getElementById('importErrors').classList.remove('hidden');
                    const errorsList = document.getElementById('importErrorsList');
                    errorsList.innerHTML = '';
                    result.errors.forEach(error => {
                        const li = document.createElement('li');
                        li.textContent = error;
                        errorsList.appendChild(li);
                    });
                } else {
                    document.getElementById('importErrors').classList.add('hidden');
                }

                // Reload data
                loadRequests();
                loadCollections();
                loadEnvironments();
                loadEnvironmentsForSelect();

                showSuccessToast(`Backup restored! ${result.imported.collections} collections, ${result.imported.requests} requests, ${result.imported.environments} environments, ${result.imported.runs} runs`);
            } else {
                showErrorToast('Error importing backup');
            }
        } catch (err) {
            handleCriticalError('importBackup', err, 'Failed to import backup');
        }
    }

    // Инит
    loadRequests();
    loadEnvironmentsForSelect();

    // Create Request Modal
    const createRequestModal = document.getElementById('createRequestModal');
    const createRequestForm = document.getElementById('createRequestForm');

    function showCreateRequestModal() {
        toggleModal('createRequestModal', true);
        loadCollectionsForModal();

        // Reset body type to JSON
        document.getElementById('newRequestBodyType').value = 'json';
        document.getElementById('jsonBodyContainer').classList.remove('hidden');
        document.getElementById('formDataContainer').classList.add('hidden');

        // Initialize form-data with one empty field
        loadFormDataFields('formDataFields', {});

        setTimeout(() => {
            newRequestQueryParamsEditor.refresh();
            newRequestBodyEditor.refresh();
            newRequestHeadersEditor.refresh();
        }, 10);
    }

    function hideCreateRequestModal() {
        toggleModal('createRequestModal', false);
        createRequestForm.reset();
        document.getElementById('formDataFields').innerHTML = '';
    }

    async function loadCollectionsForModal() {
        const select = document.getElementById('newRequestCollection');
        select.innerHTML = '<option value="">No Collection</option>';

        try {
            const res = await fetch(`${API_URL}/collections`);
            const collections = await res.json();

            collections.forEach(col => {
                const option = document.createElement('option');
                option.value = col.id;
                option.textContent = col.name;
                select.appendChild(option);
            });
        } catch (err) {
            console.error('Error loading collections:', err);
        }
    }

    createRequestForm.onsubmit = async (e) => {
        e.preventDefault();

        const name = document.getElementById('newRequestName').value;
        const method = document.getElementById('newRequestMethod').value;
        const url = document.getElementById('newRequestUrl').value;
        const bodyType = document.getElementById('newRequestBodyType').value;
        const queryParamsText = newRequestQueryParamsEditor.getValue().trim();
        const headersText = newRequestHeadersEditor.getValue().trim();
        const postRequestScript = newRequestPostScriptEditor.getValue().trim();
        const collectionId = document.getElementById('newRequestCollection').value;

        let queryParams = null;
        let body = null;
        let headers = null;

        try {
            if (queryParamsText) queryParams = JSON.parse(queryParamsText);
            if (headersText) headers = JSON.parse(headersText);

            // Handle body based on type
            if (bodyType === 'json') {
                const bodyText = newRequestBodyEditor.getValue().trim();
                if (bodyText) body = JSON.parse(bodyText);
            } else if (bodyType === 'form-data') {
                const formData = getFormDataFromFields('formDataFields');
                if (Object.keys(formData).length > 0) {
                    body = formData;
                }
            }
        } catch (e) {
            showErrorToast('Invalid JSON in query params, body or headers');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    method,
                    url,
                    queryParams,
                    body,
                    bodyType,
                    headers,
                    postRequestScript: postRequestScript || null,
                    collectionId
                })
            });
            if (res.ok) {
                const newRequest = await res.json();
                loadRequests();
                hideCreateRequestModal();
                selectRequest(newRequest);
                showSuccessToast(`Request "${name}" created successfully!`);
            } else {
                showErrorToast('Error creating request');
            }
        } catch (err) {
            handleCriticalError('createRequest', err, 'Failed to create request');
        }
    }

    // Import/Export Modals
    const importCollectionModal = document.getElementById('importCollectionModal');
    const exportCollectionModal = document.getElementById('exportCollectionModal');

    function showImportCollectionModal() {
        toggleModal('importCollectionModal', true);

        setTimeout(() => {
            importJsonEditor.refresh();
        }, 10);
    }

    function hideImportCollectionModal() {
        toggleModal('importCollectionModal', false);
    }

    function showExportCollectionModal() {
        loadCollectionsForExport();
        toggleModal('exportCollectionModal', true);
    }

    function hideExportCollectionModal() {
        toggleModal('exportCollectionModal', false);
    }

    async function loadCollectionsForExport() {
        const select = document.getElementById('exportCollectionSelect');
        select.innerHTML = '<option value="">Select a collection...</option>';

        try {
            const res = await fetch(`${API_URL}/collections`);
            const collections = await res.json();

            collections.forEach(col => {
                const option = document.createElement('option');
                option.value = col.id;
                option.textContent = col.name;
                select.appendChild(option);
            });
        } catch (err) {
            console.error('Error loading collections for export:', err);
        }
    }

    // Handle Import Collection
    document.getElementById('importCollectionForm').onsubmit = async (e) => {
        e.preventDefault();

        const fileInput = document.getElementById('importFile');
        const jsonInput = document.getElementById('importJson');

        let jsonData = null;

        // Если загружен файл, читаем его
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();

            reader.onload = async (e) => {
                const content = e.target.result;
                try {
                    jsonData = JSON.parse(content);
                    await importCollectionData(jsonData);
                    hideImportCollectionModal();
                } catch (err) {
                    showErrorToast('Error parsing JSON file: ' + err.message);
                }
            };

            reader.readAsText(file);
        } else if (jsonInput.value.trim() !== '') {
            // Или, если есть текст в поле, парсим его
            try {
                jsonData = JSON.parse(importJsonEditor.getValue());
                await importCollectionData(jsonData);
                hideImportCollectionModal();
            } catch (err) {
                showErrorToast('Error parsing JSON: ' + err.message);
            }
        } else {
            showWarningToast('Please upload a file or enter JSON data');
        }
    };

    async function importCollectionData(data) {
        try {
            const res = await fetch(`${API_URL}/collections/import`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                const result = await res.json();
                showSuccessToast('Collection imported successfully!');
                loadCollections();
            } else {
                showErrorToast('Error importing collection');
            }
        } catch (err) {
            handleCriticalError('importCollection', err, 'Failed to import collection');
        }
    }

    // Handle Export Collection
    document.getElementById('exportCollectionForm').onsubmit = async (e) => {
        e.preventDefault();

        const select = document.getElementById('exportCollectionSelect');
        const collectionId = select.value;

        if (!collectionId) {
            showWarningToast('Please select a collection to export');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/collections/${collectionId}/export`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'collection.json';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                showSuccessToast('Collection exported successfully!');
            } else {
                showErrorToast('Error exporting collection');
            }
        } catch (err) {
            handleCriticalError('exportCollection', err, 'Failed to export collection');
        }
    }

    // Save changes from editable fields
    async function saveChanges() {
        if (!currentRequestId) return;

        const method = document.getElementById('methodSelect').value;
        const url = document.getElementById('urlInput').value;
        const bodyType = document.getElementById('requestBodyTypeEdit').value;
        const queryParamsText = queryParamsEditor.getValue().trim();
        const headersText = headersEditor.getValue().trim();

        let queryParams = null;
        let body = null;
        let headers = null;

        try {
            if (queryParamsText) queryParams = JSON.parse(queryParamsText);
            if (headersText) headers = JSON.parse(headersText);

            // Handle body based on type
            if (bodyType === 'json') {
                const bodyText = bodyEditor.getValue().trim();
                if (bodyText) body = JSON.parse(bodyText);
            } else if (bodyType === 'form-data') {
                const formData = getFormDataFromFields('requestFormDataFields');
                if (Object.keys(formData).length > 0) {
                    body = formData;
                }
            }
        } catch (e) {
            showErrorToast('Invalid JSON in query params, body or headers');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/requests/${currentRequestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method,
                    url,
                    queryParams,
                    body,
                    bodyType,
                    headers,
                    postRequestScript: postRequestScriptEditor.getValue().trim() || null
                })
            });

            if (res.ok) {
                const updatedRequest = await res.json();
                currentRequest = updatedRequest;
                loadRequests(currentCollectionId);

                // Hide save button
                document.getElementById('saveChangesBtn').classList.add('hidden');
                showSuccessToast('Changes saved successfully!');
            } else {
                showErrorToast('Error saving changes');
            }
        } catch (err) {
            handleCriticalError('saveChanges', err, 'Failed to save changes');
        }
    }

    // Show save button when fields change
    function markAsChanged() {
        if (currentRequestId) {
            document.getElementById('saveChangesBtn').classList.remove('hidden');
        }
    }

    // Universal modal toggle function
    function toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        if (show) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }

    // Event listeners
    document.getElementById('refreshBtn').addEventListener('click', loadRequests);
    document.getElementById('requestsTab').addEventListener('click', showRequests);
    document.getElementById('collectionRequestsTab').addEventListener('click', showCollectionRequests);
    document.getElementById('collectionsTab').addEventListener('click', showCollections);
    document.getElementById('runsTab').addEventListener('click', showRuns);
    document.getElementById('newRequestBtn').addEventListener('click', showCreateRequestModal);
    document.getElementById('newCollectionBtn').addEventListener('click', showCreateCollectionModal);
    document.getElementById('importBtn').addEventListener('click', showImportCollectionModal);
    document.getElementById('exportBtn').addEventListener('click', showExportCollectionModal);
    document.getElementById('environmentsBtn').addEventListener('click', showManageEnvironmentsModal);
    document.getElementById('saveChangesBtn').addEventListener('click', saveChanges);
    document.getElementById('runBtn').addEventListener('click', runCurrentRequest);
    document.getElementById('newEnvironmentBtn').addEventListener('click', showCreateEnvironmentModal);
    document.getElementById('cancelCreateRequest').addEventListener('click', hideCreateRequestModal);
    document.getElementById('cancelImport').addEventListener('click', hideImportCollectionModal);
    document.getElementById('cancelExport').addEventListener('click', hideExportCollectionModal);
    document.getElementById('closeManageEnvironments').addEventListener('click', hideManageEnvironmentsModal);
    document.getElementById('cancelCreateEnvironment').addEventListener('click', hideCreateEnvironmentModal);
    document.getElementById('closeViewEnvironment').addEventListener('click', hideViewEnvironmentModal);
    document.getElementById('closeManageVariables').addEventListener('click', () => {
        toggleModal('manageVariablesModal', false);
        currentManageEnvId = null;
    });
    document.getElementById('addNewVariable').addEventListener('click', addVariable);
    document.getElementById('closeViewCollection').addEventListener('click', () => {
        toggleModal('viewCollectionModal', false);
    });
    document.getElementById('closeViewRun').addEventListener('click', () => {
        toggleModal('viewRunModal', false);
    });
    document.getElementById('importEnvironmentBtn').addEventListener('click', showImportEnvironmentModal);
    document.getElementById('exportEnvironmentBtn').addEventListener('click', showExportEnvironmentModal);
    document.getElementById('cancelImportEnvironment').addEventListener('click', hideImportEnvironmentModal);
    document.getElementById('cancelExportEnvironment').addEventListener('click', hideExportEnvironmentModal);
    document.getElementById('cleanupHistoryBtn').addEventListener('click', showCleanupHistoryModal);
    document.getElementById('cancelCleanupHistory').addEventListener('click', hideCleanupHistoryModal);
    document.getElementById('backupExportBtn').addEventListener('click', exportBackup);
    document.getElementById('backupImportBtn').addEventListener('click', showBackupImportModal);
    document.getElementById('cancelBackupImport').addEventListener('click', hideBackupImportModal);

    // Track changes to show save button
    document.getElementById('methodSelect').addEventListener('change', markAsChanged);
    document.getElementById('urlInput').addEventListener('input', markAsChanged);
    document.getElementById('requestBodyTypeEdit').addEventListener('change', markAsChanged);

    // Body type switching for create modal
    document.getElementById('newRequestBodyType').addEventListener('change', (e) => {
        const isFormData = e.target.value === 'form-data';
        document.getElementById('jsonBodyContainer').classList.toggle('hidden', isFormData);
        document.getElementById('formDataContainer').classList.toggle('hidden', !isFormData);
    });

    // Add form-data field buttons
    document.getElementById('addFormDataField').addEventListener('click', () => {
        addFormDataField('formDataFields');
    });

    document.getElementById('addRequestFormDataField').addEventListener('click', () => {
        addFormDataField('requestFormDataFields');
        markAsChanged();
    });

    // Add environment variable button
    document.getElementById('addEnvironmentVariable').addEventListener('click', () => {
        addFormDataField('environmentVariablesFields');
    });

    // Body type switching for edit mode
    document.addEventListener('change', (e) => {
        if (e.target.id === 'requestBodyTypeEdit') {
            const isFormData = e.target.value === 'form-data';
            document.getElementById('requestBodyEdit').classList.toggle('hidden', isFormData);
            document.getElementById('requestFormDataEdit').classList.toggle('hidden', !isFormData);

            if (isFormData && currentRequest) {
                loadFormDataFields('requestFormDataFields', currentRequest.body || {});
            }
            markAsChanged();
        }
    });

    // Initialize CodeMirror editors
    const queryParamsEditor = CodeMirror.fromTextArea(document.getElementById('requestQueryParamsEdit'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: 10
    });
    // Force width constraint
    queryParamsEditor.getWrapperElement().style.width = '100%';
    queryParamsEditor.getScrollerElement().style.maxWidth = '100%';

    const bodyEditor = CodeMirror.fromTextArea(document.getElementById('requestBodyEdit'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: 10
    });
    // Force width constraint
    bodyEditor.getWrapperElement().style.width = '100%';
    bodyEditor.getScrollerElement().style.maxWidth = '100%';

    const headersEditor = CodeMirror.fromTextArea(document.getElementById('requestHeadersEdit'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: 10
    });
    // Force width constraint
    headersEditor.getWrapperElement().style.width = '100%';
    headersEditor.getScrollerElement().style.maxWidth = '100%';

    // Track changes in CodeMirror editors
    queryParamsEditor.on('change', markAsChanged);
    bodyEditor.on('change', markAsChanged);
    headersEditor.on('change', markAsChanged);

    const newRequestQueryParamsEditor = CodeMirror.fromTextArea(document.getElementById('newRequestQueryParams'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: 10
    });
    newRequestQueryParamsEditor.getWrapperElement().style.width = '100%';

    const newRequestBodyEditor = CodeMirror.fromTextArea(document.getElementById('newRequestBody'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: 10
    });
    newRequestBodyEditor.getWrapperElement().style.width = '100%';

    const newRequestHeadersEditor = CodeMirror.fromTextArea(document.getElementById('newRequestHeaders'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: 10
    });
    newRequestHeadersEditor.getWrapperElement().style.width = '100%';

    // Post-request script editors
    const postRequestScriptEditor = CodeMirror.fromTextArea(document.getElementById('postRequestScriptEdit'), {
        mode: 'javascript',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: 10
    });
    postRequestScriptEditor.getWrapperElement().style.width = '100%';
    postRequestScriptEditor.getScrollerElement().style.maxWidth = '100%';
    postRequestScriptEditor.on('change', markAsChanged);

    const newRequestPostScriptEditor = CodeMirror.fromTextArea(document.getElementById('newRequestPostScript'), {
        mode: 'javascript',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: 10
    });
    newRequestPostScriptEditor.getWrapperElement().style.width = '100%';

    const importJsonEditor = CodeMirror.fromTextArea(document.getElementById('importJson'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: 10
    });
    importJsonEditor.getWrapperElement().style.width = '100%';

    // Global error handlers
    window.addEventListener('error', (event) => {
        handleNonCriticalError('Global', event.error || event.message);
        // Prevent default error popup
        event.preventDefault();
    });

    window.addEventListener('unhandledrejection', (event) => {
        handleNonCriticalError('Unhandled Promise Rejection', event.reason);
        // Prevent default error popup
        event.preventDefault();
    });

    logInfo('Application initialized successfully');



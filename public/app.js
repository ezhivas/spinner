    const API_URL = 'http://localhost:3000';
    let currentRequestId = null;
    let currentRequest = null; // Store full request data
    let isEditMode = false;
    let currentCollectionId = null;

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
            const requests = await res.json();

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
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error connecting to backend.<br>Did you enable CORS?</div>`;
        }
    }

    // 2. Выбор запроса
    function selectRequest(req) {
        currentRequestId = req.id;
        currentRequest = req; // Store full request data

        // Set method and URL
        document.getElementById('methodSelect').value = req.method;
        document.getElementById('urlInput').value = req.url;

        // Detect body type
        const bodyType = (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) ? 'form-data' : 'json';
        document.getElementById('requestBodyTypeEdit').value = bodyType;

        // Populate editors
        queryParamsEditor.setValue(req.queryParams ? JSON.stringify(req.queryParams, null, 2) : '');
        bodyEditor.setValue(req.body ? JSON.stringify(req.body, null, 2) : '');
        headersEditor.setValue(req.headers ? JSON.stringify(req.headers, null, 2) : '');

        // Handle form-data if needed
        if (bodyType === 'form-data') {
            document.getElementById('requestBodyEdit').classList.add('hidden');
            document.getElementById('requestFormDataEdit').classList.remove('hidden');
            loadFormDataFields('requestFormDataFields', req.body || {});
            setTimeout(() => headersEditor.refresh(), 10);
        } else {
            document.getElementById('requestBodyEdit').classList.remove('hidden');
            document.getElementById('requestFormDataEdit').classList.add('hidden');
            setTimeout(() => {
                queryParamsEditor.refresh();
                bodyEditor.refresh();
                headersEditor.refresh();
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
            area.textContent = JSON.stringify(run.responseBody, null, 2);
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
        loadRequests(); // Reload to show all
    }

    function showCollectionRequests() {
        if (!currentCollectionId) {
            alert('Please select a collection first.');
            return;
        }

        document.getElementById('requestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('collectionRequestsTab').className = 'flex-1 py-2 text-center bg-gray-700 text-white font-bold text-xs';
        document.getElementById('collectionsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('runsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700 text-xs';
        document.getElementById('requestsList').classList.remove('hidden');
        document.getElementById('collectionsList').classList.add('hidden');
        document.getElementById('runsList').classList.add('hidden');
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
        loadRuns();
    }

    async function loadCollections() {
        const list = document.getElementById('collectionsList');
        list.innerHTML = '<div class="text-center text-gray-500 mt-4">Loading...</div>';

        try {
            const res = await fetch(`${API_URL}/collections`);
            const collections = await res.json();

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
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error loading collections.</div>`;
        }
    }

    function selectCollection(col) {
        currentCollectionId = col.id;
        showCollectionRequests(); // Switch to collection requests tab
    }

    function deleteCollection(id) {
        if (confirm('Are you sure you want to delete this collection?')) {
            fetch(`${API_URL}/collections/${id}`, { method: 'DELETE' })
                .then(res => {
                    if (res.ok) {
                        loadCollections();
                        loadRequests(); // Refresh the requests list as well
                    } else {
                        alert('Error deleting collection');
                    }
                })
                .catch(err => alert('Error: ' + err.message));
        }
    }

    function editCollection(id, currentName) {
        const newName = prompt('Enter new collection name:', currentName);
        if (newName && newName !== currentName) {
            fetch(`${API_URL}/collections/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            })
            .then(res => {
                if (res.ok) {
                    loadCollections();
                } else {
                    alert('Error updating collection');
                }
            })
            .catch(err => alert('Error: ' + err.message));
        }
    }

    async function viewCollectionDetails(id) {
        try {
            const res = await fetch(`${API_URL}/collections/${id}`);
            if (!res.ok) {
                alert('Error loading collection');
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
            alert('Error: ' + err.message);
        }
    }

    async function loadRuns() {
        const list = document.getElementById('runsList');
        list.innerHTML = '<div class="text-center text-gray-500 mt-4">Loading...</div>';

        try {
            const res = await fetch(`${API_URL}/runs`);
            const runs = await res.json();

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
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error loading runs history.</div>`;
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
                alert('Error loading run details');
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
                document.getElementById('runDetailResponseBody').textContent = run.responseBody
                    ? JSON.stringify(run.responseBody, null, 2)
                    : 'No response body';
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
            alert('Error: ' + err.message);
        }
    }

    function deleteRequest(id) {
        if (confirm('Are you sure you want to delete this request?')) {
            fetch(`${API_URL}/requests/${id}`, { method: 'DELETE' })
                .then(res => {
                    if (res.ok) {
                        loadRequests();
                        if (currentRequestId === id) {
                            // Clear selection if the deleted request was selected
                            currentRequestId = null;
                            document.getElementById('urlInput').value = '';
                            document.getElementById('methodBadge').textContent = 'METHOD';
                            document.getElementById('requestBodyDisplay').textContent = 'Select a request...';
                            document.getElementById('requestHeadersDisplay').textContent = '';
                            document.getElementById('responseArea').textContent = 'Select a request and click Run.';
                            document.getElementById('statusBadge').classList.add('hidden');
                            document.getElementById('editBtn').classList.add('hidden');
                        }
                    } else {
                        alert('Error deleting request');
                    }
                })
                .catch(err => alert('Error: ' + err.message));
        }
    }

    function showCreateCollectionModal() {
        const name = prompt('Enter collection name:');
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
            } else {
                alert('Error creating collection');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    // Environments
    async function loadEnvironments() {
        const list = document.getElementById('environmentsList');
        list.innerHTML = '<div class="text-center text-gray-500 mt-4">Loading...</div>';

        try {
            const res = await fetch(`${API_URL}/environments`);
            const environments = await res.json();

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
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error loading environments.</div>`;
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
                alert('Error updating environment');
            }
        } catch (err) {
            alert('Error: ' + err.message);
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
            alert('Please enter a variable name');
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
                alert('Error adding variable');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    async function deleteVariable(escapedKey, actualKey) {
        if (!confirm(`Delete variable "${actualKey}"?`)) return;

        try {
            const res = await fetch(`${API_URL}/environments/${currentManageEnvId}/variables/${encodeURIComponent(actualKey)}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                const updatedEnv = await res.json();
                displayManageVariables(updatedEnv.variables);
                loadEnvironments();
                loadEnvironmentsForSelect();
            } else {
                alert('Error deleting variable');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    function deleteEnvironment(id) {
        if (confirm('Are you sure you want to delete this environment?')) {
            fetch(`${API_URL}/environments/${id}`, { method: 'DELETE' })
                .then(res => {
                    if (res.ok) {
                        loadEnvironments();
                        loadEnvironmentsForSelect();
                    } else {
                        alert('Error deleting environment');
                    }
                })
                .catch(err => alert('Error: ' + err.message));
        }
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
                alert('Error creating environment');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    // Update the loadEnvironments function to also update the select
    async function loadEnvironmentsForSelect() {
        try {
            const res = await fetch(`${API_URL}/environments`);
            const environments = await res.json();

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
            alert('Invalid JSON in query params, body or headers');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, method, url, queryParams, body, headers, collectionId })
            });
            if (res.ok) {
                const newRequest = await res.json();
                loadRequests();
                hideCreateRequestModal();
                selectRequest(newRequest);
            } else {
                alert('Error creating request');
            }
        } catch (err) {
            alert('Error: ' + err.message);
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
                    alert('Error parsing JSON file: ' + err.message);
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
                alert('Error parsing JSON: ' + err.message);
            }
        } else {
            alert('Please upload a file or enter JSON data.');
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
                alert('Collection imported successfully!');
                loadCollections();
            } else {
                alert('Error importing collection');
            }
        } catch (err) {
            alert('Error: ' + err.message);
        }
    }

    // Handle Export Collection
    document.getElementById('exportCollectionForm').onsubmit = async (e) => {
        e.preventDefault();

        const select = document.getElementById('exportCollectionSelect');
        const collectionId = select.value;

        if (!collectionId) {
            alert('Please select a collection to export.');
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
                alert('Collection exported successfully!');
            } else {
                alert('Error exporting collection');
            }
        } catch (err) {
            alert('Error: ' + err.message);
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
            alert('Invalid JSON in query params, body or headers');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/requests/${currentRequestId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method, url, queryParams, body, headers })
            });

            if (res.ok) {
                const updatedRequest = await res.json();
                currentRequest = updatedRequest;
                loadRequests(currentCollectionId);

                // Hide save button
                document.getElementById('saveChangesBtn').classList.add('hidden');
                alert('✅ Changes saved successfully!');
            } else {
                alert('Error saving changes');
            }
        } catch (err) {
            alert('Error: ' + err.message);
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
        viewportMargin: Infinity
    });

    const bodyEditor = CodeMirror.fromTextArea(document.getElementById('requestBodyEdit'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: Infinity
    });

    const headersEditor = CodeMirror.fromTextArea(document.getElementById('requestHeadersEdit'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: Infinity
    });

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
        viewportMargin: Infinity
    });

    const newRequestBodyEditor = CodeMirror.fromTextArea(document.getElementById('newRequestBody'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: Infinity
    });

    const newRequestHeadersEditor = CodeMirror.fromTextArea(document.getElementById('newRequestHeaders'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: Infinity
    });

    const importJsonEditor = CodeMirror.fromTextArea(document.getElementById('importJson'), {
        mode: 'application/json',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-lint-markers'],
        viewportMargin: Infinity
    });


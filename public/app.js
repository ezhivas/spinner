    const API_URL = 'http://localhost:3000';
    let currentRequestId = null;
    let isEditMode = false;
    let currentCollectionId = null;

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
                el.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-xs ${methodColor} w-12">${req.method}</span>
                        <span class="text-sm font-medium truncate flex-1 ml-2 text-gray-300 group-hover:text-white">${req.name}</span>
                        <button onclick="event.stopPropagation(); deleteRequest(${req.id});" class="text-red-500 hover:text-red-400 text-xs ml-2">🗑️</button>
                    </div>
                    <div class="text-xs text-gray-500 truncate mt-1 ml-14">${req.url}</div>
                    <div class="text-xs text-gray-500 mt-1 ml-14">${req.collection ? `Collection: ${req.collection.name}` : 'No Collection'}</div>
                `;
                list.appendChild(el);
            });
        } catch (err) {
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error connecting to backend.<br>Did you enable CORS?</div>`;
        }
    }

    // 2. Выбор запроса
    function selectRequest(req) {
        currentRequestId = req.id;
        document.getElementById('urlInput').value = req.url;

        const badge = document.getElementById('methodBadge');
        badge.textContent = req.method;
        badge.className = `px-3 py-1 rounded font-mono font-bold text-sm text-gray-900 ${getMethodColorBg(req.method)}`;

        // Display mode
        document.getElementById('requestBodyDisplay').textContent = req.body ? JSON.stringify(req.body, null, 2) : '// No Body';
        document.getElementById('requestHeadersDisplay').textContent = req.headers ? JSON.stringify(req.headers, null, 2) : '// No Headers';

        // Edit mode (populate textareas)
        document.getElementById('requestBodyEdit').value = req.body ? JSON.stringify(req.body, null, 2) : '';
        document.getElementById('requestHeadersEdit').value = req.headers ? JSON.stringify(req.headers, null, 2) : '';

        // Очистка ответа
        document.getElementById('responseArea').textContent = 'Ready to run.';
        document.getElementById('statusBadge').classList.add('hidden');

        // Показать кнопку редактирования
        document.getElementById('editBtn').classList.remove('hidden');
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
        runBtn.innerHTML = '⏳ Running...';
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
            runBtn.innerHTML = '▶ Run';
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
                    document.getElementById('runBtn').disabled = false;
                    document.getElementById('runBtn').innerHTML = '▶ Run';
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
            area.className = 'flex-1 bg-gray-800 p-4 rounded border border-gray-700 font-mono text-sm text-green-300 overflow-auto';
            area.textContent = JSON.stringify(run.responseBody, null, 2);
        } else {
            statusBadge.className = 'text-xs px-2 py-1 rounded bg-red-900 text-red-200 border border-red-700';
            statusValue.textContent = 'ERROR';
            area.className = 'flex-1 bg-gray-800 p-4 rounded border border-gray-700 font-mono text-sm text-red-400 overflow-auto';
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
        document.getElementById('requestsTab').className = 'flex-1 py-2 text-center bg-gray-700 text-white font-bold';
        document.getElementById('collectionRequestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700';
        document.getElementById('collectionsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700';
        document.getElementById('requestsList').classList.remove('hidden');
        document.getElementById('collectionsList').classList.add('hidden');
        loadRequests(); // Reload to show all
    }

    function showCollectionRequests() {
        if (!currentCollectionId) {
            alert('Please select a collection first.');
            return;
        }

        document.getElementById('requestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700';
        document.getElementById('collectionRequestsTab').className = 'flex-1 py-2 text-center bg-gray-700 text-white font-bold';
        document.getElementById('collectionsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700';
        document.getElementById('requestsList').classList.remove('hidden');
        document.getElementById('collectionsList').classList.add('hidden');
        loadRequests(currentCollectionId); // Load filtered requests
    }

    function showCollections() {
        document.getElementById('requestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700';
        document.getElementById('collectionRequestsTab').className = 'flex-1 py-2 text-center bg-gray-600 text-gray-300 hover:bg-gray-700';
        document.getElementById('collectionsTab').className = 'flex-1 py-2 text-center bg-gray-700 text-white font-bold';
        document.getElementById('requestsList').classList.add('hidden');
        document.getElementById('collectionsList').classList.remove('hidden');
        loadCollections();
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
                el.className = 'cursor-pointer p-3 rounded hover:bg-gray-700 transition-colors border border-transparent hover:border-gray-600 group';
                el.onclick = () => selectCollection(col);
                el.innerHTML = `
                    <div class="flex items-center justify-between">
                        <span class="font-bold text-sm text-gray-300 group-hover:text-white">📁 ${col.name}</span>
                        <button onclick="event.stopPropagation(); deleteCollection(${col.id});" class="text-red-500 hover:text-red-400 text-xs ml-2">🗑️</button>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">${col.requests ? col.requests.length : 0} requests</div>
                `;
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
                el.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-gray-300">${env.name}</span>
                        <div class="space-x-2">
                            <button onclick="viewEnvironment(${env.id}, '${env.name.replace(/'/g, "\\'")}', '${JSON.stringify(env.variables).replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" class="text-blue-400 hover:text-blue-300 text-xs">👁️ View</button>
                            <button onclick="editEnvironment(${env.id}, '${env.name.replace(/'/g, "\\'")}', '${JSON.stringify(env.variables).replace(/'/g, "\\'").replace(/"/g, '&quot;')}')" class="text-yellow-400 hover:text-yellow-300 text-xs">✏️ Edit</button>
                            <button onclick="deleteEnvironment(${env.id})" class="text-red-500 hover:text-red-400 text-xs">🗑️ Delete</button>
                        </div>
                    </div>
                `;
                list.appendChild(el);
            });
        } catch (err) {
            list.innerHTML = `<div class="text-red-500 p-2 text-sm">Error loading environments.</div>`;
        }
    }

    function viewEnvironment(id, name, variablesStr) {
        const variables = JSON.parse(variablesStr.replace(/&quot;/g, '"'));
        document.getElementById('viewEnvironmentName').value = name;
        document.getElementById('viewEnvironmentVariables').textContent = JSON.stringify(variables, null, 2);
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
    }

    function hideCreateEnvironmentModal() {
        toggleModal('createEnvironmentModal', false);
    }

    function editEnvironment(id, name, variablesStr) {
        const variables = JSON.parse(variablesStr.replace(/&quot;/g, '"'));
        document.getElementById('environmentName').value = name;
        document.getElementById('environmentVariables').value = JSON.stringify(variables, null, 2);
        document.getElementById('environmentModalTitle').textContent = 'Edit Environment';
        document.getElementById('createEnvironmentForm').onsubmit = (e) => {
            e.preventDefault();
            updateEnvironment(id);
        };
        showCreateEnvironmentModal();
    }

    async function updateEnvironment(id) {
        const name = document.getElementById('environmentName').value;
        const variablesText = document.getElementById('environmentVariables').value.trim();

        let variables = {};

        try {
            if (variablesText) variables = JSON.parse(variablesText);
        } catch (e) {
            alert('Invalid JSON in variables');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/environments/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, variables })
            });
            if (res.ok) {
                loadEnvironments();
                hideCreateEnvironmentModal();
                // Reload the select
                loadEnvironmentsForSelect();
            } else {
                alert('Error updating environment');
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
        const variablesText = document.getElementById('environmentVariables').value.trim();

        let variables = {};

        try {
            if (variablesText) variables = JSON.parse(variablesText);
        } catch (e) {
            alert('Invalid JSON in variables');
            return;
        }

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
    }

    function hideCreateRequestModal() {
        toggleModal('createRequestModal', false);
        createRequestForm.reset();
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
        const bodyText = document.getElementById('newRequestBody').value.trim();
        const headersText = document.getElementById('newRequestHeaders').value.trim();
        const collectionId = document.getElementById('newRequestCollection').value;

        let body = null;
        let headers = null;

        try {
            if (bodyText) body = JSON.parse(bodyText);
            if (headersText) headers = JSON.parse(headersText);
        } catch (e) {
            alert('Invalid JSON in body or headers');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, method, url, body, headers, collectionId })
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
                jsonData = JSON.parse(jsonInput.value);
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


    function toggleEditMode() {
        // Hide display elements, show edit elements
        document.getElementById('requestBodyDisplay').classList.add('hidden');
        document.getElementById('requestBodyEdit').classList.remove('hidden');
        document.getElementById('requestHeadersDisplay').classList.add('hidden');
        document.getElementById('requestHeadersEdit').classList.remove('hidden');

        // Hide edit button, show save and discard
        document.getElementById('editBtn').classList.add('hidden');
        document.getElementById('saveBtn').classList.remove('hidden');
        document.getElementById('discardBtn').classList.remove('hidden');
    }

    function saveChanges() {
        const bodyText = document.getElementById('requestBodyEdit').value.trim();
        const headersText = document.getElementById('requestHeadersEdit').value.trim();

        let body = null;
        let headers = null;

        try {
            if (bodyText) body = JSON.parse(bodyText);
            if (headersText) headers = JSON.parse(headersText);
        } catch (e) {
            alert('Invalid JSON in body or headers');
            return;
        }

        // Update the request via API
        fetch(`${API_URL}/requests/${currentRequestId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ body, headers })
        }).then(res => {
            if (res.ok) {
                // Update display
                document.getElementById('requestBodyDisplay').textContent = body ? JSON.stringify(body, null, 2) : '// No Body';
                document.getElementById('requestHeadersDisplay').textContent = headers ? JSON.stringify(headers, null, 2) : '// No Headers';
                // Switch back to display mode
                discardChanges();
            } else {
                alert('Error saving changes');
            }
        }).catch(err => alert('Error: ' + err.message));
    }

    function discardChanges() {
        // Show display, hide edit
        document.getElementById('requestBodyDisplay').classList.remove('hidden');
        document.getElementById('requestBodyEdit').classList.add('hidden');
        document.getElementById('requestHeadersDisplay').classList.remove('hidden');
        document.getElementById('requestHeadersEdit').classList.add('hidden');

        // Show edit button, hide save and discard
        document.getElementById('editBtn').classList.remove('hidden');
        document.getElementById('saveBtn').classList.add('hidden');
        document.getElementById('discardBtn').classList.add('hidden');
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
    document.getElementById('newRequestBtn').addEventListener('click', showCreateRequestModal);
    document.getElementById('newCollectionBtn').addEventListener('click', showCreateCollectionModal);
    document.getElementById('importBtn').addEventListener('click', showImportCollectionModal);
    document.getElementById('exportBtn').addEventListener('click', showExportCollectionModal);
    document.getElementById('environmentsBtn').addEventListener('click', showManageEnvironmentsModal);
    document.getElementById('editBtn').addEventListener('click', toggleEditMode);
    document.getElementById('saveBtn').addEventListener('click', saveChanges);
    document.getElementById('discardBtn').addEventListener('click', discardChanges);
    document.getElementById('runBtn').addEventListener('click', runCurrentRequest);
    document.getElementById('newEnvironmentBtn').addEventListener('click', showCreateEnvironmentModal);
    document.getElementById('cancelCreateRequest').addEventListener('click', hideCreateRequestModal);
    document.getElementById('cancelImport').addEventListener('click', hideImportCollectionModal);
    document.getElementById('cancelExport').addEventListener('click', hideExportCollectionModal);
    document.getElementById('closeManageEnvironments').addEventListener('click', hideManageEnvironmentsModal);
    document.getElementById('cancelCreateEnvironment').addEventListener('click', hideCreateEnvironmentModal);
    document.getElementById('closeViewEnvironment').addEventListener('click', hideViewEnvironmentModal);

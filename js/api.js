// Singleton Pattern
const ApiSingleton = (function() {
    let instance;
    
    function createInstance() {
        // Private variables and methods
        const API_BASE_URL = 'http://localhost:8080/api';
        
        // Public methods
        return {
            // Authentication API calls
            auth: {
                async login(email, password) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/login`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ email, password })
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            return { 
                                success: false, 
                                message: errorData.message || 'Login failed'
                            };
                        }
                        
                        return { success: true, data: await response.json() };
                    } catch (error) {
                        console.error('Login error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
            
                async register(name, email, password) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/register`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ name, email, password })
                        });
                        
                        if (!response.ok) {
                            const errorData = await response.json();
                            return { 
                                success: false, 
                                message: errorData.message || 'Registration failed'
                            };
                        }
                        
                        return { success: true, data: await response.json() };
                    } catch (error) {
                        console.error('Registration error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
            
                async logout() {
                    try {
                        const response = await fetch(`${API_BASE_URL}/logout`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return { success: false, message: 'Logout failed' };
                        }
                        
                        return { success: true };
                    } catch (error) {
                        console.error('Logout error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
            
                async checkAuth() {
                    try {
                        const response = await fetch(`${API_BASE_URL}/check-auth`, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return { isAuthenticated: false };
                        }
                        
                        return { isAuthenticated: true, ...await response.json() };
                    } catch (error) {
                        console.error('Auth check error:', error);
                        return { isAuthenticated: false };
                    }
                }
            },
            
            // Items API calls - using Command Pattern
            items: {
                async createLostItem(itemData) {
                    return this._createItem({...itemData, type: 'LOST'});
                },
                
                async createFoundItem(itemData) {
                    return this._createItem({...itemData, type: 'FOUND'});
                },
            
                async _createItem(itemData) {
                    try {
                        console.log('API._createItem called with data:', JSON.stringify(itemData, null, 2));
                        
                        // Make sure we have a 'name' field, fall back to 'title' if needed
                        if (!itemData.name && itemData.title) {
                            itemData.name = itemData.title;
                            console.log('Setting name from title field');
                        }
                        
                        // Make sure we have a valid type field
                        if (!itemData.type) {
                            console.error('No type specified for item, defaulting to LOST');
                            itemData.type = 'LOST';
                        }
                        
                        const endpoint = itemData.type === 'LOST' 
                            ? `${API_BASE_URL}/lost-items` 
                            : `${API_BASE_URL}/found-items`;
                        
                        console.log(`Sending request to ${endpoint}`);
                        
                        // Create a modifiable copy to avoid mutating the original
                        const dataToSend = { ...itemData };
                        
                        // Add the current user ID if available
                        let userId = null;
                        let userEmail = null;
                        
                        try {
                            const userDataStr = localStorage.getItem('userData');
                            console.log('Raw userData from localStorage:', userDataStr);
                            
                            if (userDataStr) {
                                const userData = JSON.parse(userDataStr);
                                console.log('Parsed userData:', userData);
                                
                                if (userData) {
                                    // Handle MongoDB ObjectId format
                                    if (userData._id && typeof userData._id === 'object' && userData._id.$oid) {
                                        userId = userData._id.$oid;
                                        console.log('Found MongoDB ObjectId format:', userId);
                                    } else {
                                        userId = userData.id || userData._id || userData.userId;
                                        console.log('Found standard ID format:', userId);
                                    }
                                    userEmail = userData.email;
                                    
                                    // Try multiple user fields
                                    dataToSend.userId = userId;
                                    dataToSend.user_id = userId;
                                    dataToSend._id = userId;
                                    dataToSend.user = userId;
                                    dataToSend.userEmail = userEmail;
                                    dataToSend.email = userEmail;
                                    
                                    console.log('Adding user data to item:', {
                                        id: userId,
                                        email: userEmail
                                    });
                                }
                            }
                        } catch (userError) {
                            console.error('Error adding user ID to item data:', userError);
                        }
                        
                        // Get user token from local storage to include in headers
                        let token = null;
                        try {
                            token = localStorage.getItem('token');
                            console.log('Found auth token:', token ? 'Yes' : 'No');
                        } catch (tokenError) {
                            console.error('Error getting token:', tokenError);
                        }
                        
                        // Ensure the proper field names based on the item type
                        if (itemData.type === 'LOST') {
                            dataToSend.itemName = itemData.name || itemData.title;
                            dataToSend.dateLost = itemData.date;
                        } else {
                            dataToSend.itemName = itemData.name || itemData.title;
                            dataToSend.dateFound = itemData.date;
                        }
                        
                        // Ensure image field is properly set - try multiple field names to match backend expectations
                        if (itemData.photoBase64) {
                            dataToSend.photoBase64 = itemData.photoBase64;
                            // Also try these alternative field names that the backend might expect
                            dataToSend.imageUrl = itemData.photoBase64;
                            dataToSend.photo = itemData.photoBase64;
                            dataToSend.image = itemData.photoBase64;
                        }
                        
                        // Try a direct base64 image format
                        if (itemData.photoFile) {
                            try {
                                const reader = new FileReader();
                                const imagePromise = new Promise((resolve) => {
                                    reader.onloadend = () => resolve(reader.result);
                                    reader.readAsDataURL(itemData.photoFile);
                                });
                                
                                const base64Image = await imagePromise;
                                console.log('Converted image to base64 from photoFile');
                                dataToSend.photoBase64 = base64Image;
                                dataToSend.imageUrl = base64Image;
                                dataToSend.photo = base64Image;
                                dataToSend.image = base64Image;
                            } catch (fileError) {
                                console.error('Error converting file to base64:', fileError);
                            }
                        }
                        
                        // Log the exact data being sent
                        console.log('Request payload:', JSON.stringify({
                            ...dataToSend,
                            photoBase64: dataToSend.photoBase64 ? '[BASE64 DATA]' : null,
                            imageUrl: dataToSend.imageUrl ? '[BASE64 DATA]' : null,
                            photo: dataToSend.photo ? '[BASE64 DATA]' : null,
                            image: dataToSend.image ? '[BASE64 DATA]' : null
                        }, null, 2));
                            
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Accept': 'application/json',
                                ...(token ? {'Authorization': `Bearer ${token}`} : {})
                            },
                            credentials: 'include',
                            body: JSON.stringify(dataToSend)
                        });
                        
                        console.log('Response status:', response.status);
                        console.log('Response headers:', [...response.headers.entries()]);
                        
                        if (!response.ok) {
                            let errorMessage = 'Failed to create item';
                            try {
                                const errorData = await response.json();
                                console.error('Error response:', errorData);
                                errorMessage = errorData.message || errorMessage;
                            } catch (jsonError) {
                                console.error('Failed to parse error response:', jsonError);
                                try {
                                    errorMessage = await response.text() || errorMessage;
                                } catch (textError) {
                                    console.error('Failed to read error response text:', textError);
                                }
                            }
                            
                            return { 
                                success: false, 
                                message: errorMessage
                            };
                        }
                        
                        // Get response text first to log it for debugging
                        const responseText = await response.text();
                        console.log('Raw success response text:', responseText);
                        
                        // Try to parse as JSON if it looks like JSON
                        let responseData;
                        try {
                            responseData = JSON.parse(responseText);
                        } catch (jsonError) {
                            console.warn('Response is not valid JSON:', jsonError);
                            responseData = { message: responseText };
                        }
                        
                        console.log('Processed success response:', responseData);
                        return { success: true, data: responseData };
                    } catch (error) {
                        console.error('Create item error:', error);
                        return { success: false, message: 'Network error occurred: ' + error.message };
                    }
                },
            
                async getLostItems(category = null, location = null) {
                    return this._getItems('LOST', category, location);
                },
                
                async getFoundItems(category = null, location = null) {
                    return this._getItems('FOUND', category, location);
                },
            
                async _getItems(type, category = null, location = null) {
                    try {
                        const endpoint = type === 'LOST' 
                            ? `${API_BASE_URL}/lost-items` 
                            : `${API_BASE_URL}/found-items`;
                            
                        let url = endpoint;
                        const params = new URLSearchParams();
                        if (category) params.append('category', category);
                        if (location) params.append('location', location);
                        if (params.toString()) url += `?${params.toString()}`;
                
                        const response = await fetch(url, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return [];
                        }
                        
                        return await response.json();
                    } catch (error) {
                        console.error(`Get ${type} items error:`, error);
                        return [];
                    }
                },
            
                async getItemById(id, type) {
                    try {
                        const endpoint = type === 'LOST' 
                            ? `${API_BASE_URL}/lost-items/${id}` 
                            : `${API_BASE_URL}/found-items/${id}`;
                            
                        const response = await fetch(endpoint, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return null;
                        }
                        
                        return await response.json();
                    } catch (error) {
                        console.error('Get item by id error:', error);
                        return null;
                    }
                },
            
                async getUserItems() {
                    try {
                        // Get user info from localStorage to include in request
                        let userId = null;
                        let token = null;
                        
                        try {
                            const userDataStr = localStorage.getItem('userData');
                            console.log('Raw userData from localStorage:', userDataStr);
                            
                            if (userDataStr) {
                                const userData = JSON.parse(userDataStr);
                                console.log('Parsed userData:', userData);
                                
                                if (userData) {
                                    // Handle MongoDB ObjectId format
                                    if (userData._id && typeof userData._id === 'object' && userData._id.$oid) {
                                        userId = userData._id.$oid;
                                        console.log('Found MongoDB ObjectId format:', userId);
                                    } else {
                                        userId = userData.id || userData._id || userData.userId;
                                        console.log('Found standard ID format:', userId);
                                    }
                                }
                            }
                            token = localStorage.getItem('token');
                            console.log('Auth token found:', token ? 'Yes' : 'No');
                        } catch (authError) {
                            console.error('Error getting user info for items:', authError);
                        }
                        
                        console.log('Using userId for API request:', userId);
                        
                        if (!userId) {
                            console.error('No user ID found, cannot fetch user items');
                            return { lost: [], found: [] };
                        }
                        
                        const headers = {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        };
                        
                        // Add authorization header if we have a token
                        if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                        }
                        
                        // Fetch lost items
                        const lostItemsUrl = `${API_BASE_URL}/lost-items?userId=${userId}`;
                        console.log('Fetching lost items from:', lostItemsUrl);
                        
                        const lostResponse = await fetch(lostItemsUrl, {
                            method: 'GET',
                            headers: headers,
                            credentials: 'include'
                        });
                        
                        console.log('Lost items response status:', lostResponse.status);
                        
                        let lostItems = [];
                        if (lostResponse.ok) {
                            try {
                                const allLostItems = await lostResponse.json();
                                console.log('All lost items fetched:', allLostItems);
                                
                                // Filter items by user ID on the client side as a backup
                                if (Array.isArray(allLostItems)) {
                                    lostItems = allLostItems.filter(item => 
                                        item.userId === userId || 
                                        item.user_id === userId || 
                                        (item.user && (item.user === userId || item.user.id === userId || item.user._id === userId))
                                    );
                                    console.log('Filtered lost items by user ID:', lostItems);
                                }
                            } catch (parseError) {
                                console.error('Error parsing lost items response:', parseError);
                            }
                        }
                        
                        // Fetch found items
                        const foundItemsUrl = `${API_BASE_URL}/found-items?userId=${userId}`;
                        console.log('Fetching found items from:', foundItemsUrl);
                        
                        const foundResponse = await fetch(foundItemsUrl, {
                            method: 'GET',
                            headers: headers,
                            credentials: 'include'
                        });
                        
                        console.log('Found items response status:', foundResponse.status);
                        
                        let foundItems = [];
                        if (foundResponse.ok) {
                            try {
                                const allFoundItems = await foundResponse.json();
                                console.log('All found items fetched:', allFoundItems);
                                
                                // Filter items by user ID on the client side as a backup
                                if (Array.isArray(allFoundItems)) {
                                    foundItems = allFoundItems.filter(item => 
                                        item.userId === userId || 
                                        item.user_id === userId || 
                                        (item.user && (item.user === userId || item.user.id === userId || item.user._id === userId))
                                    );
                                    console.log('Filtered found items by user ID:', foundItems);
                                }
                            } catch (parseError) {
                                console.error('Error parsing found items response:', parseError);
                            }
                        }
                        
                        return { lost: lostItems, found: foundItems };
                    } catch (error) {
                        console.error('Get user items error:', error);
                        return { lost: [], found: [] };
                    }
                },
                
                async createClaim(itemId, claimData) {
                    try {
                        // Get authentication token from localStorage
                        const token = localStorage.getItem('token');
                        const headers = { 
                            'Content-Type': 'application/json' 
                        };
                        
                        // Add authorization header if token exists
                        if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                        }
                        
                        // Get user ID from localStorage
                        let userId = null;
                        try {
                            const userDataStr = localStorage.getItem('userData');
                            if (userDataStr) {
                                const userData = JSON.parse(userDataStr);
                                if (userData) {
                                    // Handle MongoDB ObjectId format
                                    if (userData._id && typeof userData._id === 'object' && userData._id.$oid) {
                                        userId = userData._id.$oid;
                                    } else {
                                        userId = userData.id || userData._id || userData.userId;
                                    }
                                }
                            }
                        } catch (userError) {
                            console.error('Error getting user info:', userError);
                        }
                        
                        // Create the claim command object following the backend's Command pattern
                        const claimCommand = {
                            itemId,
                            userId,
                            claimantName: claimData.name,
                            claimantEmail: claimData.email,
                            claimantPhone: claimData.contactNumber,
                            description: claimData.description,
                            proofPhotoUrl: claimData.proofPhotoUrl || null,
                            // Include additional fields for compatibility with different backend implementations
                            claimDate: new Date().toISOString(),
                            status: 'PENDING',
                            ...claimData
                        };
                        
                        console.log('Submitting claim with data:', { ...claimCommand, proofPhotoUrl: claimCommand.proofPhotoUrl ? '[PHOTO DATA]' : null });
                        
                        // First try the command-based endpoint
                        try {
                            const commandResponse = await fetch(`${API_BASE_URL}/claims/command`, {
                                method: 'POST',
                                headers: headers,
                                credentials: 'include',
                                body: JSON.stringify({
                                    command: 'CreateClaimCommand',
                                    data: claimCommand
                                })
                            });
                            
                            if (commandResponse.ok) {
                                return { success: true, data: await commandResponse.json() };
                            }
                            
                            console.log('Command-based endpoint failed, trying standard endpoint');
                        } catch (commandError) {
                            console.error('Command endpoint error:', commandError);
                        }
                        
                        // Fall back to standard endpoint if command-based endpoint fails
                        const response = await fetch(`${API_BASE_URL}/claims`, {
                            method: 'POST',
                            headers: headers,
                            credentials: 'include',
                            body: JSON.stringify(claimCommand)
                        });
                        
                        if (!response.ok) {
                            let errorMessage = 'Failed to create claim';
                            try {
                                const errorData = await response.json();
                                errorMessage = errorData.message || errorMessage;
                            } catch (e) {
                                // If response is not JSON, try to get text
                                errorMessage = await response.text() || errorMessage;
                            }
                            
                            return { 
                                success: false, 
                                message: errorMessage
                            };
                        }
                        
                        // Try to parse response as JSON
                        let responseData;
                        try {
                            responseData = await response.json();
                        } catch (jsonError) {
                            // If not JSON, use text response
                            const textResponse = await response.text();
                            responseData = { message: textResponse };
                        }
                        
                        return { success: true, data: responseData };
                    } catch (error) {
                        console.error('Create claim error:', error);
                        return { success: false, message: 'Network error occurred: ' + (error.message || '') };
                    }
                },
                
                async getUserClaims() {
                    try {
                        // Get authentication token
                        const token = localStorage.getItem('token');
                        const headers = { 'Content-Type': 'application/json' };
                        
                        // Add authorization header if token exists
                        if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                        }
                        
                        // Get user ID from localStorage
                        let userId = null;
                        try {
                            const userDataStr = localStorage.getItem('userData');
                            if (userDataStr) {
                                const userData = JSON.parse(userDataStr);
                                if (userData) {
                                    // Handle MongoDB ObjectId format
                                    if (userData._id && typeof userData._id === 'object' && userData._id.$oid) {
                                        userId = userData._id.$oid;
                                    } else {
                                        userId = userData.id || userData._id || userData.userId;
                                    }
                                }
                            }
                        } catch (userError) {
                            console.error('Error getting user info:', userError);
                        }
                        
                        if (!userId) {
                            return { success: false, message: 'User ID not found' };
                        }
                        
                        // Try to fetch user claims
                        const response = await fetch(`${API_BASE_URL}/claims/user/${userId}`, {
                            method: 'GET',
                            headers: headers,
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return { 
                                success: false, 
                                message: 'Failed to fetch claims'
                            };
                        }
                        
                        const claims = await response.json();
                        return { success: true, data: claims };
                    } catch (error) {
                        console.error('Get user claims error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
                
                async getItemClaims(itemId) {
                    try {
                        // Get authentication token
                        const token = localStorage.getItem('token');
                        const headers = { 'Content-Type': 'application/json' };
                        
                        // Add authorization header if token exists
                        if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                        }
                        
                        // Try to fetch item claims
                        const response = await fetch(`${API_BASE_URL}/claims/item/${itemId}`, {
                            method: 'GET',
                            headers: headers,
                            credentials: 'include'
                        });
                        
                        if (!response.ok) {
                            return { 
                                success: false, 
                                message: 'Failed to fetch item claims'
                            };
                        }
                        
                        const claims = await response.json();
                        return { success: true, data: claims };
                    } catch (error) {
                        console.error('Get item claims error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
                
                async updateClaimStatus(claimId, status) {
                    try {
                        // Get authentication token
                        const token = localStorage.getItem('token');
                        const headers = { 'Content-Type': 'application/json' };
                        
                        // Add authorization header if token exists
                        if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                        }
                        
                        // Try to update claim status
                        const response = await fetch(`${API_BASE_URL}/claims/${claimId}/status`, {
                            method: 'PUT',
                            headers: headers,
                            credentials: 'include',
                            body: JSON.stringify({ status })
                        });
                        
                        if (!response.ok) {
                            return { 
                                success: false, 
                                message: 'Failed to update claim status'
                            };
                        }
                        
                        return { success: true, data: await response.json() };
                    } catch (error) {
                        console.error('Update claim status error:', error);
                        return { success: false, message: 'Network error occurred' };
                    }
                },
                
                async uploadImage(file) {
                    try {
                        console.log('uploadImage called with file:', file ? `${file.name} (${file.size} bytes, type: ${file.type})` : 'null');
                        
                        if (!file) {
                            console.error('No file provided to uploadImage');
                            return { success: false, message: 'No file provided' };
                        }
                        
                        // Try to convert the file to base64 first - this is our fallback
                        let base64Image = null;
                        try {
                            const reader = new FileReader();
                            const imagePromise = new Promise((resolve) => {
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(file);
                            });
                            
                            base64Image = await imagePromise;
                            console.log('Successfully converted image to base64');
                        } catch (readerError) {
                            console.error('Error converting image to base64:', readerError);
                        }
                        
                        // Prepare FormData for server upload
                        const formData = new FormData();
                        formData.append('file', file);
                        
                        // Also include the file name and type explicitly
                        formData.append('fileName', file.name);
                        formData.append('fileType', file.type);
                        
                        // Add any authentication info if available
                        let token = null;
                        let userId = null;
                        try {
                            token = localStorage.getItem('token');
                            
                            const userDataStr = localStorage.getItem('userData');
                            if (userDataStr) {
                                const userData = JSON.parse(userDataStr);
                                if (userData) {
                                    userId = userData.id || userData._id || userData.userId;
                                    if (userId) {
                                        formData.append('userId', userId);
                                    }
                                }
                            }
                        } catch (authError) {
                            console.error('Error getting auth data for upload:', authError);
                        }
                        
                        console.log('Uploading image with FormData. Token present:', !!token, 'UserID present:', !!userId);
                        
                        try {
                            const headers = {};
                            if (token) {
                                headers['Authorization'] = `Bearer ${token}`;
                            }
                            
                            const response = await fetch(`${API_BASE_URL}/upload`, {
                                method: 'POST',
                                headers: headers,
                                body: formData,
                                credentials: 'include'
                            });
                            
                            console.log('Upload response status:', response.status);
                            console.log('Upload response headers:', [...response.headers.entries()]);
                            
                            if (!response.ok) {
                                const errorMsg = await response.text();
                                console.error('Upload error response:', errorMsg);
                                
                                // If server upload failed, use the client-side base64 conversion
                                if (base64Image) {
                                    console.log('Server upload failed, using client-side base64 image');
                                    return { 
                                        success: true, 
                                        data: { 
                                            imageUrl: base64Image,
                                            source: 'client-side-fallback'
                                        } 
                                    };
                                }
                                
                                return { success: false, message: 'Failed to upload image: ' + errorMsg };
                            }
                            
                            // Get response text first to log it for debugging
                            const responseText = await response.text();
                            console.log('Raw upload response text:', responseText);
                            
                            // Try to parse as JSON if it looks like JSON
                            let responseData;
                            try {
                                responseData = JSON.parse(responseText);
                                console.log('Parsed upload response:', responseData);
                            } catch (jsonError) {
                                console.warn('Upload response is not valid JSON:', jsonError);
                                
                                // If the raw text might be a URL or file path
                                if (responseText && typeof responseText === 'string' && responseText.trim()) {
                                    return { 
                                        success: true, 
                                        data: { 
                                            imageUrl: responseText.trim(),
                                            source: 'raw-text-response'
                                        } 
                                    };
                                }
                                
                                // If we couldn't parse the response but we have a client-side base64
                                if (base64Image) {
                                    console.log('Could not parse server response, using client-side base64 image');
                                    return { 
                                        success: true, 
                                        data: { 
                                            imageUrl: base64Image,
                                            source: 'client-side-fallback'
                                        } 
                                    };
                                }
                                
                                return { success: false, message: 'Failed to parse upload response' };
                            }
                            
                            // Check for various response formats
                            if (responseData) {
                                // If the server returned the image as base64 or URL
                                if (responseData.imageUrl || responseData.url || responseData.filePath || responseData.path) {
                                    return { 
                                        success: true, 
                                        data: { 
                                            imageUrl: responseData.imageUrl || responseData.url || 
                                                    responseData.filePath || responseData.path,
                                            source: 'server-response-object'
                                        } 
                                    };
                                }
                                
                                // If the response itself is the URL or object with string representation
                                if (typeof responseData === 'string') {
                                    return { 
                                        success: true, 
                                        data: { 
                                            imageUrl: responseData,
                                            source: 'server-response-string'
                                        } 
                                    };
                                }
                                
                                // If the server just returned a success flag but no URL
                                if (responseData.success !== false) {
                                    if (base64Image) {
                                        console.log('Server returned success but no URL, using client-side base64 image');
                                        return { 
                                            success: true, 
                                            data: { 
                                                imageUrl: base64Image,
                                                source: 'client-side-fallback-with-server-success'
                                            } 
                                        };
                                    }
                                }
                            }
                            
                            // If we get here and have a base64 image, use it
                            if (base64Image) {
                                console.log('Using client-side base64 image as last resort');
                                return { 
                                    success: true, 
                                    data: { 
                                        imageUrl: base64Image,
                                        source: 'client-side-last-resort'
                                    } 
                                };
                            }
                            
                            // If we get here, we couldn't extract a useful image URL
                            return { success: false, message: 'Server did not return a usable image URL' };
                            
                        } catch (fetchError) {
                            console.error('Error during fetch:', fetchError);
                            
                            // If we have a base64 image from earlier, use it
                            if (base64Image) {
                                console.log('Fetch error occurred, using client-side base64 image');
                                return { 
                                    success: true, 
                                    data: { 
                                        imageUrl: base64Image,
                                        source: 'client-side-fallback-after-fetch-error'
                                    } 
                                };
                            }
                            
                            throw fetchError; // Re-throw to be caught by outer try/catch
                        }
                    } catch (error) {
                        console.error('Upload image error:', error);
                        
                        // As a last resort, try to convert the image to base64 client-side again
                        try {
                            const reader = new FileReader();
                            const imagePromise = new Promise((resolve) => {
                                reader.onloadend = () => resolve(reader.result);
                                reader.readAsDataURL(file);
                            });
                            
                            const base64Image = await imagePromise;
                            console.log('Converted image to base64 client-side as final fallback');
                            return { 
                                success: true, 
                                data: { 
                                    imageUrl: base64Image,
                                    source: 'client-side-final-fallback'
                                } 
                            };
                        } catch (readerError) {
                            console.error('Error converting image client-side in final attempt:', readerError);
                            return { success: false, message: 'Network error occurred: ' + error.message };
                        }
                    }
                },
                
                // Add resolveItem method
                async resolveItem(itemId, type) {
                    try {
                        if (!itemId || !type) {
                            console.error('Missing required parameters for resolveItem:', { itemId, type });
                            return { success: false, message: 'Missing item ID or type' };
                        }
                        
                        const normalizedType = type.toUpperCase() === 'LOST' ? 'lost' : 'found';
                        const endpoint = `${API_BASE_URL}/${normalizedType}-items/${itemId}/resolve`;
                        
                        console.log(`Resolving ${normalizedType} item with ID: ${itemId}`);
                        console.log(`Endpoint: ${endpoint}`);
                        
                        // Get auth token
                        let token = null;
                        try {
                            token = localStorage.getItem('token');
                        } catch (tokenError) {
                            console.error('Error getting token:', tokenError);
                        }
                        
                        const headers = {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        };
                        
                        if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                        }
                        
                        console.log('Request headers:', headers);
                        
                        // Try the PUT request first (RESTful approach)
                        try {
                            const response = await fetch(endpoint, {
                                method: 'PUT',
                                headers: headers,
                                credentials: 'include'
                            });
                            
                            console.log('Response status:', response.status);
                            
                            if (response.ok) {
                                console.log('Item successfully resolved');
                                return { success: true };
                            }
                            
                            // If PUT fails, try alternative PATCH method
                            console.log('PUT method failed, trying PATCH...');
                            const patchResponse = await fetch(endpoint, {
                                method: 'PATCH',
                                headers: headers,
                                credentials: 'include',
                                body: JSON.stringify({ isResolved: true })
                            });
                            
                            console.log('PATCH response status:', patchResponse.status);
                            
                            if (patchResponse.ok) {
                                console.log('Item successfully resolved with PATCH');
                                return { success: true };
                            }
                            
                            // If both methods fail, try updating the whole item
                            console.log('PATCH method failed, trying to update the item...');
                            
                            // Get the item data first
                            const itemResponse = await fetch(`${API_BASE_URL}/${normalizedType}-items/${itemId}`, {
                                method: 'GET',
                                headers: headers,
                                credentials: 'include'
                            });
                            
                            if (itemResponse.ok) {
                                const itemData = await itemResponse.json();
                                
                                // Update the item with isResolved flag
                                itemData.isResolved = true;
                                
                                const updateResponse = await fetch(`${API_BASE_URL}/${normalizedType}-items/${itemId}`, {
                                    method: 'PUT',
                                    headers: headers,
                                    credentials: 'include',
                                    body: JSON.stringify(itemData)
                                });
                                
                                if (updateResponse.ok) {
                                    console.log('Item successfully resolved via update');
                                    return { success: true };
                                }
                            }
                            
                            // All attempts failed, return error message
                            let errorMessage = 'Failed to resolve item';
                            try {
                                const errorData = await response.json();
                                errorMessage = errorData.message || errorMessage;
                                console.error('Error response:', errorData);
                            } catch (parseError) {
                                console.error('Error parsing API error response:', parseError);
                            }
                            
                            return { success: false, message: errorMessage };
                        } catch (fetchError) {
                            console.error('Network error during resolve item:', fetchError);
                            return { success: false, message: fetchError.message || 'Network error' };
                        }
                    } catch (error) {
                        console.error('Error resolving item:', error);
                        return { success: false, message: error.message || 'An unknown error occurred' };
                    }
                },

                // Add deleteItem method to permanently remove an item
                async deleteItem(itemId, type) {
                    try {
                        if (!itemId || !type) {
                            console.error('Missing required parameters for deleteItem:', { itemId, type });
                            return { success: false, message: 'Missing item ID or type' };
                        }
                        
                        const normalizedType = type.toUpperCase() === 'LOST' ? 'lost' : 'found';
                        console.log(`Attempting to delete ${normalizedType} item with ID: ${itemId}`);
                        
                        // Get auth token
                        let token = null;
                        try {
                            token = localStorage.getItem('token');
                        } catch (tokenError) {
                            console.error('Error getting token:', tokenError);
                        }
                        
                        const headers = {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        };
                        
                        if (token) {
                            headers['Authorization'] = `Bearer ${token}`;
                        }
                        
                        console.log('Delete request headers:', headers);
                        
                        // Try multiple approaches to delete the item
                        const deleteApproaches = [
                            // Approach 1: Standard REST DELETE
                            async () => {
                                const endpoint = `${API_BASE_URL}/${normalizedType}-items/${itemId}`;
                                console.log(`Trying standard REST DELETE at: ${endpoint}`);
                                const response = await fetch(endpoint, {
                                    method: 'DELETE',
                                    headers: headers,
                                    credentials: 'include'
                                });
                                return { 
                                    success: response.ok, 
                                    status: response.status,
                                    statusText: response.statusText
                                };
                            },
                            
                            // Approach 2: Alternative endpoint with DELETE
                            async () => {
                                const endpoint = `${API_BASE_URL}/${normalizedType}-items/delete/${itemId}`;
                                console.log(`Trying alternative DELETE endpoint: ${endpoint}`);
                                const response = await fetch(endpoint, {
                                    method: 'DELETE',
                                    headers: headers,
                                    credentials: 'include'
                                });
                                return { 
                                    success: response.ok, 
                                    status: response.status,
                                    statusText: response.statusText
                                };
                            },
                            
                            // Approach 3: POST to delete endpoint
                            async () => {
                                const endpoint = `${API_BASE_URL}/${normalizedType}-items/delete`;
                                console.log(`Trying POST to delete endpoint: ${endpoint}`);
                                const response = await fetch(endpoint, {
                                    method: 'POST',
                                    headers: headers,
                                    credentials: 'include',
                                    body: JSON.stringify({ id: itemId })
                                });
                                return { 
                                    success: response.ok, 
                                    status: response.status,
                                    statusText: response.statusText
                                };
                            },
                            
                            // Approach 4: PUT to update isDeleted flag
                            async () => {
                                // First get the item
                                const getEndpoint = `${API_BASE_URL}/${normalizedType}-items/${itemId}`;
                                console.log(`Trying to mark as deleted via PUT: ${getEndpoint}`);
                                
                                try {
                                    const getResponse = await fetch(getEndpoint, {
                                        method: 'GET',
                                        headers: headers,
                                        credentials: 'include'
                                    });
                                    
                                    if (getResponse.ok) {
                                        const itemData = await getResponse.json();
                                        
                                        // Mark as deleted and update
                                        itemData.isDeleted = true;
                                        itemData.isResolved = true;
                                        itemData.status = 'DELETED';
                                        
                                        const updateResponse = await fetch(getEndpoint, {
                                            method: 'PUT',
                                            headers: headers,
                                            credentials: 'include',
                                            body: JSON.stringify(itemData)
                                        });
                                        
                                        return { 
                                            success: updateResponse.ok, 
                                            status: updateResponse.status,
                                            statusText: updateResponse.statusText
                                        };
                                    }
                                    return { success: false };
                                } catch (err) {
                                    console.error('Error in approach 4:', err);
                                    return { success: false };
                                }
                            },
                            
                            // Approach 5: Use a general API endpoint
                            async () => {
                                const endpoint = `${API_BASE_URL}/items/${itemId}`;
                                console.log(`Trying general API endpoint: ${endpoint}`);
                                const response = await fetch(endpoint, {
                                    method: 'DELETE',
                                    headers: headers,
                                    credentials: 'include'
                                });
                                return { 
                                    success: response.ok, 
                                    status: response.status,
                                    statusText: response.statusText
                                };
                            }
                        ];
                        
                        // Try each approach in sequence
                        let lastError = null;
                        for (let i = 0; i < deleteApproaches.length; i++) {
                            try {
                                console.log(`Trying delete approach ${i + 1}...`);
                                const result = await deleteApproaches[i]();
                                console.log(`Approach ${i + 1} result:`, result);
                                if (result.success) {
                                    console.log(`Successfully deleted item using approach ${i + 1}`);
                                    return { success: true };
                                }
                                lastError = `Approach ${i + 1} failed with status: ${result.status} ${result.statusText}`;
                            } catch (approachError) {
                                console.error(`Error in delete approach ${i + 1}:`, approachError);
                                lastError = approachError.message || `Error in approach ${i + 1}`;
                            }
                        }
                        
                        // All approaches failed
                        console.error('All delete approaches failed. Last error:', lastError);
                        return { success: false, message: 'Failed to delete item after trying all approaches' };
                    } catch (error) {
                        console.error('Error in deleteItem:', error);
                        return { success: false, message: error.message || 'An unknown error occurred' };
                    }
                }
            }
        };
    }
    
    return {
        // Public method to get the Singleton instance
        getInstance: function() {
            if (!instance) {
                instance = createInstance();
            }
            return instance;
        }
    };
})();

// Export the API instances
const API = ApiSingleton.getInstance();
const authAPI = API.auth;
const itemsAPI = API.items; 